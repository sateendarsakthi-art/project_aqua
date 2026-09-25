import asyncio, csv, io
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from .config import settings
from .db import engine, Base, SessionLocal
from .models import Workload
from .services.simulator import DataCenterSimulator
from .services.water import metrics, recovery
from .services.ml import predictor, anomaly
from .services.ppo import ppo_optimizer

app = FastAPI(title="AQUA-OPT API", version="2.0", description="AI System for Data Center Water, Cooling and Energy Optimization")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(",") if hasattr(settings, "cors_origins") else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

sim = DataCenterSimulator()

@app.on_event("startup")
async def startup():
    async with engine.begin() as c:
        await c.run_sync(Base.metadata.create_all)
    async with SessionLocal() as db:
        rows = (await db.execute(select(Workload))).scalars().all()
        if not rows:
            db.add_all([
                Workload(name="LLM Inference Cluster", priority=1, cpu=78, gpu=88, sla=99.99, flexible=False),
                Workload(name="Batch Analytics Engine", priority=3, cpu=45, gpu=20, sla=99.0, flexible=True),
                Workload(name="Deep Learning Training", priority=2, cpu=72, gpu=76, sla=99.5, flexible=True),
                Workload(name="Core Web Services API", priority=1, cpu=52, gpu=15, sla=99.99, flexible=False),
                Workload(name="Database Indexing Job", priority=3, cpu=38, gpu=10, sla=98.5, flexible=True),
                Workload(name="Computer Vision Pipeline", priority=2, cpu=65, gpu=70, sla=99.7, flexible=True)
            ])
            await db.commit()

@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "AQUA-OPT", "version": "2.0", "ai_engines": ["Random Forest", "PPO Actor-Critic", "Isolation Forest"]}

@app.get("/api/telemetry")
async def telemetry():
    return sim.step()

@app.get("/api/summary")
async def summary():
    t = sim.step()
    return {
        **t,
        "carbon_kg_h": round(t["power_kw"] * 0.42, 2),
        "cost_inr_h": round(t["power_kw"] * 8.5, 2),
        "water_cost_inr_h": round(t["fresh_water_lph"] * 0.08, 2)
    }

@app.get("/api/history")
async def history():
    if not sim.history:
        sim.step()
    return sim.history[-50:]

@app.post("/api/optimize")
async def optimize(payload: dict = None):
    payload = payload or {}
    w_p = float(payload.get("water_priority", 1.2))
    e_p = float(payload.get("energy_priority", 1.0))
    return sim.optimize(water_priority=w_p, energy_priority=e_p)

@app.get("/api/optimizer/ppo")
async def get_ppo_status():
    t = sim.step()
    ppo_res = ppo_optimizer.optimize_step(t)
    return {
        "telemetry": t,
        "ppo_decision": ppo_res
    }

@app.post("/api/cooling/setpoint")
async def update_cooling_setpoint(payload: dict):
    sp = float(payload.get("setpoint", 24.0))
    return sim.set_cooling_setpoint(sp)

@app.post("/api/cooling/mode")
async def update_cooling_mode(payload: dict):
    mode = str(payload.get("cooling_mode", "Hybrid"))
    return sim.set_cooling_mode(mode)

@app.post("/api/workloads/shift")
async def shift_workloads(payload: dict = None):
    payload = payload or {}
    factor = float(payload.get("shift_factor", 0.20))
    res = sim.shift_workloads(factor)
    return {**res, "telemetry": sim.step()}

@app.get("/api/water")
async def water():
    t = sim.step()
    water_data = metrics(t["water_lph"], t["recovered_lph"], t["reused_lph"], t["power_kw"])
    return {**water_data, "current": t}

@app.get("/api/water/quality")
async def water_quality():
    t = sim.step()
    water_data = metrics(t["water_lph"], t["recovered_lph"], t["reused_lph"], t["power_kw"])
    return water_data["quality"]

@app.get("/api/water/cycle")
async def water_cycle():
    t = sim.step()
    water_data = metrics(t["water_lph"], t["recovered_lph"], t["reused_lph"], t["power_kw"])
    return {
        "cycle_stages": water_data["cycle_stages"],
        "quality": water_data["quality"],
        "balance": {
            "demand_lph": t["water_lph"],
            "recovered_lph": t["recovered_lph"],
            "reused_lph": t["reused_lph"],
            "fresh_water_lph": t["fresh_water_lph"],
            "water_saved_lph": water_data["water_saved_lph"],
            "recovery_rate_pct": water_data["recovery_rate_pct"],
            "reuse_rate_pct": water_data["reuse_rate_pct"]
        }
    }

@app.post("/api/water/recover")
async def recover_water(payload: dict):
    loss = float(payload.get("cooling_loss_lph", 100))
    eff = float(payload.get("efficiency", 0.72))
    return recovery(loss, eff)

@app.get("/api/predictions")
async def predictions():
    t = sim.step()
    forecast = predictor.forecast_30min(t["cpu"], t["gpu"], t["outside_temp"], t["humidity"])
    return {
        "current_temperature": t["temperature"],
        "current_power_kw": t["power_kw"],
        "current_water_lph": t["water_lph"],
        **forecast
    }

@app.get("/api/anomalies")
async def anomalies():
    t = sim.step()
    r = anomaly.check(t["cpu"], t["gpu"], t["temperature"], t["power_kw"])
    return [r]

@app.get("/api/alerts")
async def alerts():
    t = sim.step()
    r = anomaly.check(t["cpu"], t["gpu"], t["temperature"], t["power_kw"])
    alert_list = []
    if r["anomaly"]:
        alert_list.append({
            "id": "alert-1",
            "type": "anomaly",
            "severity": r["severity"],
            "title": r["title"],
            "message": r["message"],
            "time": "Just now"
        })
    if t["temperature"] > 28.5:
        alert_list.append({
            "id": "alert-2",
            "type": "thermal",
            "severity": "HIGH" if t["temperature"] > 31.0 else "MEDIUM",
            "title": "Thermal Alert — High Rack Temperature",
            "message": f"Average rack temp reached {t['temperature']}°C. Recommend lowering cooling setpoint or shifting flexible workloads.",
            "time": "1 min ago"
        })
    if t["fresh_water_lph"] > 140.0:
        alert_list.append({
            "id": "alert-3",
            "type": "water",
            "severity": "MEDIUM",
            "title": "Fresh Water Spike",
            "message": f"Fresh water intake is currently {t['fresh_water_lph']} L/hr. Enable closed-loop water recovery to minimize utility usage.",
            "time": "3 mins ago"
        })
    if not alert_list:
        alert_list.append({
            "id": "alert-0",
            "type": "info",
            "severity": "NORMAL",
            "title": "All Systems Nominal",
            "message": "Closed-loop cooling, water reuse and workload distribution operating within optimal bounds.",
            "time": "Just now"
        })
    return alert_list

@app.get("/api/workloads")
async def workloads():
    async with SessionLocal() as db:
        rows = (await db.execute(select(Workload))).scalars().all()
        return [{"id": x.id, "name": x.name, "priority": x.priority, "cpu": x.cpu, "gpu": x.gpu, "sla": x.sla, "flexible": x.flexible, "status": x.status} for x in rows]

@app.post("/api/workloads/{wid}/action")
async def workload_action(wid: int, payload: dict):
    action = payload.get("action", "MIGRATE")
    async with SessionLocal() as db:
        x = await db.get(Workload, wid)
        if not x:
            return {"error": "not found"}
        x.status = {"DELAY": "DELAYED", "PAUSE": "PAUSED", "RUN": "RUNNING", "MIGRATE": "MIGRATING", "CONSOLIDATE": "CONSOLIDATING"}.get(action, x.status)
        await db.commit()
        return {"id": wid, "action": action, "status": x.status}

@app.get("/api/sustainability")
async def sustainability():
    t = sim.step()
    return {
        "energy": {"current": t["power_kw"], "optimized": round(t["power_kw"] * 0.82, 2), "saving_pct": 18},
        "water": {"current": t["fresh_water_lph"], "optimized": round(t["fresh_water_lph"] * 0.68, 2), "saving_pct": 32},
        "carbon": {"current": round(t["power_kw"] * 0.42, 2), "optimized": round(t["power_kw"] * 0.33, 2), "saving_pct": 21},
        "cost": {"current": round(t["power_kw"] * 8.5, 2), "optimized": round(t["power_kw"] * 7.1, 2), "saving_pct": 16}
    }

@app.get("/api/export/csv")
async def export_csv():
    rows = sim.history[-60:] or [sim.step()]
    s = io.StringIO()
    w = csv.DictWriter(s, fieldnames=[k for k in rows[0].keys() if not isinstance(rows[0][k], dict)])
    w.writeheader()
    # Filter out nested dicts for clean CSV
    clean_rows = [{k: v for k, v in row.items() if not isinstance(v, dict)} for row in rows]
    w.writerows(clean_rows)
    return StreamingResponse(
        iter([s.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=aquaopt_telemetry.csv"}
    )

@app.websocket("/ws/telemetry")
async def ws(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            await websocket.send_json(sim.step())
            await asyncio.sleep(2)
    except WebSocketDisconnect:
        pass
