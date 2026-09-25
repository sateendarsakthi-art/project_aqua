# AQUA-OPT
**AI-powered Water & Energy Optimization for Sustainable Data Centers**

> **Smart India Hackathon 2026**
> Problem Statement ID: **SIH26202** | Theme: **Smart Automation** | PS Category: **Software**
> Team: **Frostbite Fighters**

---

## Proposed Solution

AQUA-OPT is an AI-driven optimization layer that continuously monitors data-center resources and uses AI to optimize cooling, server utilization, workload distribution, energy usage and water management while maintaining thermal safety and SLA requirements.

- **Real-time Monitoring** — server/GPU utilization, rack temperature, power consumption, cooling performance, water consumption and environmental conditions.
- **Water-Aware Cooling** — selects the most suitable cooling strategy (Free Cooling / Hybrid / Evaporative) based on current conditions to reduce fresh-water consumption.
- **Water Recovery & Reuse** — recovered water is treated and reused for cooling, reducing dependence on fresh water.
- **Predictive Intelligence** — forecasts workload, temperature, energy demand and cooling-water demand.
- **Anomaly Detection** — detects abnormal temperature, power and cooling patterns; identifies potential equipment issues and generates early alerts.
- **Sustainability Optimization** — reduces energy consumption, fresh-water usage, carbon footprint and operational cost, making the solution eco-friendly, secure and reliable.

---

## Feasibility

- Can be developed initially as a software-based Digital Twin, without access to a real data center.
- Simulates servers, workloads, cooling, power, temperature and water usage.
- Uses realistic/synthetic telemetry to train and test the AI optimizer safely.
- Integrates PPO-based optimization, prediction and anomaly detection.
- A dashboard shows live monitoring and before vs. after optimization.
- Safety constraints ensure thermal limits and SLA/QoS are maintained.

## Viability

- Works as an AI intelligence layer over existing data-center infrastructure — no infrastructure replacement.
- Can receive data from server/GPU monitoring, cooling systems, power meters, water-flow meters, environmental sensors and weather data.
- Optimizes energy, cooling, workload distribution and water usage together including water recovery and reuse to reduce dependence on fresh water.
- Can scale from a simulated prototype to real-world data-center deployment.
- Helps reduce operational cost, resource wastage and environmental impact.

---

## Expected Impact

| Dimension | Impact |
|---|---|
| **Energy** | Reduce unnecessary server and cooling power consumption. Dynamically adapt resource usage to workload demand. |
| **Water** | Minimize unnecessary cooling-water consumption. Recover and reuse water for cooling, reducing dependence on fresh water. |
| **Economic** | Reduce maintenance, electricity and water-related operating costs through optimized operation. |
| **Performance** | Optimize workload distribution and resource utilization while maintaining thermal safety and SLA/QoS requirements. |

## Benefits

- ✅ Energy and Water Efficient
- ✅ Cost Effective
- ✅ Reliable Operations — early anomaly detection supports preventive action
- ✅ Sustainable Data Centers — balances performance with energy and water efficiency

---

## Run

**Backend:**
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend** (second PowerShell):
```powershell
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

The backend runs with SQLite by default, so the prototype works without PostgreSQL.
PostgreSQL/Redis are provided in `docker-compose.yml` for the extended architecture.

---

## Modules

| Module | Description |
|---|---|
| Overview | Core metrics and AI decision panel |
| Live Monitoring | Real-time digital-twin telemetry and thermal map |
| AI Optimizer | PPO-based decision layer with safety constraints |
| Cooling & Water | Joint cooling strategy optimization and water accounting |
| Water Recovery & Reuse | 4-step recovery pipeline simulator |
| Workload Manager | Migrate/delay/run flexible workloads |
| Predictions & Alerts | 30-minute forecasts and anomaly detection |
| Sustainability | Before vs. after optimization comparison |
| Reports | CSV telemetry export |

The live prototype uses a digital-twin simulator. PPO training is included in `ai/train_ppo.py`.
If no trained PPO model exists, the backend uses a safe deterministic optimizer so the demo works immediately.
