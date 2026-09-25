import math, random
from datetime import datetime
from .ppo import ppo_optimizer

class DataCenterSimulator:
    def __init__(self):
        self.t = 0
        self.cooling_mode = "Hybrid"
        self.setpoint = 24.0
        self.recovery_efficiency = 0.72
        self.reuse_fraction = 0.80
        self.workload_shift_factor = 0.0
        self.history = []

    def set_cooling_setpoint(self, setpoint: float):
        self.setpoint = max(18.0, min(28.0, round(float(setpoint), 1)))
        return {"setpoint": self.setpoint, "status": "updated"}

    def set_cooling_mode(self, mode: str):
        if mode in ["Free Cooling", "Hybrid", "Evaporative"]:
            self.cooling_mode = mode
        return {"cooling_mode": self.cooling_mode, "status": "updated"}

    def shift_workloads(self, factor: float = 0.15):
        self.workload_shift_factor = max(0.0, min(0.35, float(factor)))
        return {"workload_shift_factor": self.workload_shift_factor, "status": "workloads shifted to cooler zones"}

    def step(self):
        self.t += 1
        # Workload generation with shift attenuation if active
        raw_cpu = 55 + 20 * math.sin(self.t / 8) + random.uniform(-4, 4)
        raw_gpu = 62 + 25 * math.sin(self.t / 11 + 1) + random.uniform(-5, 5)

        cpu = max(10, min(98, raw_cpu * (1.0 - self.workload_shift_factor * 0.4)))
        gpu = max(5, min(99, raw_gpu * (1.0 - self.workload_shift_factor * 0.3)))

        outside = 29 + 5 * math.sin(self.t / 20) + random.uniform(-1, 1)
        humidity = 55 + 15 * math.sin(self.t / 18) + random.uniform(-3, 3)

        temp = 20.5 + .075 * cpu + .055 * gpu + .07 * (outside - 28)
        if self.cooling_mode == "Hybrid":
            temp *= 0.92
        elif self.cooling_mode == "Free Cooling":
            temp *= 0.96 if outside < 22 else 1.05

        cooling_power = max(5.0, (temp - self.setpoint + 4) * 4.5)
        power = 35.0 + 0.38 * cpu + 0.52 * gpu + cooling_power

        # Water consumption model
        water_mult = 1.15 if self.cooling_mode == "Evaporative" else (0.72 if self.cooling_mode == "Hybrid" else 0.20)
        water = max(35.0, cooling_power * 7.5 * water_mult)
        recovered = water * self.recovery_efficiency * 0.48
        reused = recovered * self.reuse_fraction
        fresh = max(0.0, water - reused)

        # Water-Aware Cooling strategy recommendation based on environmental sensors
        if outside < 20.0 and humidity < 55.0:
            water_aware_strategy = "Free Cooling"
        elif outside < 30.0 and humidity < 75.0:
            water_aware_strategy = "Hybrid"
        else:
            water_aware_strategy = "Evaporative"

        # Water Quality metrics
        ph = round(7.25 + random.uniform(-0.1, 0.1), 2)
        turbidity = round(1.15 + random.uniform(-0.15, 0.2), 2)
        tds = round(142 + random.uniform(-10, 15), 1)

        d = {
            "timestamp": datetime.utcnow().isoformat(),
            "cpu": round(cpu, 2), "gpu": round(gpu, 2),
            "temperature": round(temp, 2), "power_kw": round(power, 2),
            "cooling_power_kw": round(cooling_power, 2),
            "water_lph": round(water, 2), "recovered_lph": round(recovered, 2),
            "reused_lph": round(reused, 2), "fresh_water_lph": round(fresh, 2),
            "outside_temp": round(outside, 2), "humidity": round(humidity, 2),
            "cooling_mode": self.cooling_mode,
            "water_aware_cooling_strategy": water_aware_strategy,
            "setpoint": self.setpoint,
            "pue": round(1.20 + cooling_power / 500, 3),
            "wue": round(fresh / max(power, 1), 3),
            "sla": 99.98 if temp < 33.5 else 99.45,
            "efficiency_score": round(max(50, min(99, 100 - (power * 0.25 + fresh * 0.15 + max(0, temp - 26) * 3))), 1),
            "water_quality": {
                "ph": ph,
                "turbidity_ntu": turbidity,
                "tds_ppm": tds,
                "status": "Optimal"
            }
        }
        self.history.append(d)
        self.history = self.history[-100:]
        return d

    def optimize(self, water_priority=1.0, energy_priority=1.0):
        current_state = self.step()
        # Execute genuine PPO Actor-Critic optimization step
        ppo_res = ppo_optimizer.optimize_step(current_state, water_priority, energy_priority)

        # Apply PPO decision to simulator state
        delta = ppo_res.get("setpoint_delta", 0.0)
        self.setpoint = max(19.0, min(27.0, round(self.setpoint + delta, 1)))
        
        mode = ppo_res.get("cooling_mode", self.cooling_mode)
        if mode in ["Free Cooling", "Hybrid", "Evaporative"]:
            self.cooling_mode = mode

        # If PPO suggested workload shifting, apply throttle factor
        if "Shift" in ppo_res.get("workload_action", ""):
            self.workload_shift_factor = 0.20
        else:
            self.workload_shift_factor = max(0.0, self.workload_shift_factor - 0.05)

        # Simulate new state after PPO policy applied
        optimized_state = self.step()

        return {
            "telemetry": optimized_state,
            "baseline": current_state,
            "actions": ppo_res.get("actions", []),
            "ppo_decision": {
                "algorithm": ppo_res.get("algorithm"),
                "policy_type": ppo_res.get("policy_type"),
                "applied_setpoint": self.setpoint,
                "applied_cooling_mode": self.cooling_mode,
                "workload_action": ppo_res.get("workload_action"),
                "ppo_metrics": ppo_res.get("ppo_metrics", {})
            }
        }
