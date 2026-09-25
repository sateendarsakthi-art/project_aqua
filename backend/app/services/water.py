import random

def metrics(water, recovered, reused, power):
    fresh = max(0, water - reused)
    # Simulate high precision water quality sensors
    ph = round(7.2 + random.uniform(-0.15, 0.15), 2)
    turbidity = round(1.2 + random.uniform(-0.25, 0.35), 2)
    tds = round(145 + random.uniform(-15, 20), 1)
    conductivity = round(240 + random.uniform(-20, 25), 1)

    quality_ok = (6.8 <= ph <= 7.8) and (turbidity < 2.5) and (tds < 300)
    
    return {
        "fresh_water_lph": round(fresh, 2),
        "recovery_rate_pct": round(recovered / water * 100, 2) if water else 0,
        "reuse_rate_pct": round(reused / recovered * 100, 2) if recovered else 0,
        "water_saved_lph": round(reused, 2),
        "wue": round(fresh / max(power, 1), 3),
        "quality": {
            "ph": ph,
            "ph_status": "Optimal (6.8 - 7.8)",
            "turbidity_ntu": turbidity,
            "turbidity_status": "Clear (< 2.5 NTU)",
            "tds_ppm": tds,
            "tds_status": "Low Dissolved Solids (< 300 ppm)",
            "conductivity_us": conductivity,
            "overall_status": "PASSED" if quality_ok else "CHECK_REQUIRED",
            "treatment_active": True,
            "uv_disinfection": "ACTIVE",
            "reverse_osmosis": "ACTIVE"
        },
        "cycle_stages": [
            {"step": 1, "id": "datacenter", "title": "Data Center", "desc": "Servers generate thermal load; liquid cold plates capture heat", "flow_lph": round(water, 1), "status": "Active"},
            {"step": 2, "id": "cooling", "title": "Cooling System", "desc": "Hybrid heat exchangers and cooling coils transfer thermal energy", "flow_lph": round(water, 1), "status": "Active"},
            {"step": 3, "id": "recoverable", "title": "Recoverable Water", "desc": "Condensate & blowdown collected at precision capture points", "flow_lph": round(recovered * 1.15, 1), "status": "Capturing"},
            {"step": 4, "id": "treatment", "title": "Treatment Plant", "desc": "Multi-stage sediment filtration & UV disinfection decontamination", "flow_lph": round(recovered, 1), "status": "Purifying"},
            {"step": 5, "id": "quality", "title": "Quality Check", "desc": f"Continuous IoT probe verification (pH: {ph}, TDS: {tds} ppm)", "flow_lph": round(recovered, 1), "status": "Verified"},
            {"step": 6, "id": "storage", "title": "Storage Buffer", "desc": "Clean recycled buffer tank reserves water for immediate demand", "flow_lph": round(recovered * 0.95, 1), "status": "Buffered"},
            {"step": 7, "id": "reuse", "title": "Reuse Loop", "desc": "Recycled water returned into cooling tower make-up circuit", "flow_lph": round(reused, 1), "status": "Injecting"},
            {"step": 8, "id": "saving", "title": "Less Fresh Water", "desc": f"Fresh utility intake reduced by {round(reused, 1)} L/hr ({round(reused / max(water, 1) * 100, 1)}% reduction)", "flow_lph": round(fresh, 1), "status": "Conserving"}
        ]
    }

def recovery(loss, efficiency=0.72):
    recovered = max(0, loss * efficiency)
    reused = recovered * 0.85
    return {
        "input_loss_lph": round(loss, 2),
        "recovered_lph": round(recovered, 2),
        "reused_lph": round(reused, 2),
        "fresh_saved_lph": round(reused, 2),
        "quality_check_required": False,
        "quality_status": "PASSED (pH 7.2, Turbidity 1.1 NTU, TDS 140 ppm)",
        "reuse_route": "Treatment -> Quality Validation Station -> Buffer Storage -> Cooling Make-up Loop",
        "savings_pct": round((reused / max(loss, 1)) * 100, 1)
    }
