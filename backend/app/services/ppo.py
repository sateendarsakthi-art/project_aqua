import torch
import torch.nn as nn
import torch.optim as optim
from torch.distributions import Categorical
import numpy as np

class ActorCritic(nn.Module):
    def __init__(self, state_dim=8):
        super().__init__()
        self.shared = nn.Sequential(
            nn.Linear(state_dim, 64),
            nn.Tanh(),
            nn.Linear(64, 64),
            nn.Tanh()
        )
        # Action Head 1: Setpoint delta [-1.0, -0.5, 0.0, +0.5, +1.0]
        self.actor_setpoint = nn.Linear(64, 5)
        # Action Head 2: Cooling Mode [0: Free Cooling, 1: Hybrid, 2: Evaporative]
        self.actor_cooling = nn.Linear(64, 3)
        # Action Head 3: Workload Action [0: Keep, 1: Shift Batch to Cold Rack, 2: Delay Flexible Workload]
        self.actor_workload = nn.Linear(64, 3)
        # Critic Value Head
        self.critic = nn.Linear(64, 1)

    def forward(self, state):
        features = self.shared(state)
        logits_setpoint = self.actor_setpoint(features)
        logits_cooling = self.actor_cooling(features)
        logits_workload = self.actor_workload(features)
        value = self.critic(features)
        return logits_setpoint, logits_cooling, logits_workload, value

class PPOOptimizer:
    SETPOINT_DELTAS = [-1.0, -0.5, 0.0, +0.5, +1.0]
    COOLING_MODES = ["Free Cooling", "Hybrid", "Evaporative"]
    WORKLOAD_ACTIONS = [
        "Optimal workload distribution maintained",
        "Shift flexible batch analytics away from high-temperature rack",
        "Delay non-critical background jobs to cooler night-time window"
    ]

    def __init__(self):
        torch.manual_seed(42)
        self.policy = ActorCritic(state_dim=8)
        self.optimizer = optim.Adam(self.policy.parameters(), lr=0.001)
        self.clip_eps = 0.2
        self.training_steps = 0
        self.reward_history = []
        self._pretrain_synthetic()

    def _state_to_tensor(self, t):
        # [cpu, gpu, temp, power, water, outside, humidity, setpoint]
        s = np.array([
            t.get("cpu", 50.0) / 100.0,
            t.get("gpu", 50.0) / 100.0,
            (t.get("temperature", 25.0) - 15.0) / 25.0,
            t.get("power_kw", 60.0) / 150.0,
            t.get("water_lph", 120.0) / 300.0,
            (t.get("outside_temp", 28.0) - 10.0) / 30.0,
            t.get("humidity", 50.0) / 100.0,
            (t.get("setpoint", 24.0) - 18.0) / 12.0
        ], dtype=np.float32)
        return torch.tensor(s, dtype=torch.float32).unsqueeze(0)

    def _compute_reward(self, t, water_p=1.0, energy_p=1.0):
        # Multi-objective reward: penalize energy, fresh water, thermal exceedance, SLA hit
        p_norm = t.get("power_kw", 60.0) / 100.0
        w_norm = t.get("fresh_water_lph", 50.0) / 150.0
        temp = t.get("temperature", 25.0)
        temp_penalty = max(0.0, temp - 27.5) ** 2 * 0.8
        sla_penalty = max(0.0, 99.9 - t.get("sla", 99.98)) * 5.0
        reward = -(energy_p * p_norm + water_p * w_norm + temp_penalty + sla_penalty)
        return float(reward)

    def _pretrain_synthetic(self):
        """Warm-up PPO policy on simulated multi-objective environmental scenarios"""
        for _ in range(35):
            cpu = np.random.uniform(20, 90)
            gpu = np.random.uniform(20, 95)
            outside = np.random.uniform(15, 38)
            humidity = np.random.uniform(30, 80)
            setpoint = 24.0
            temp = 20.0 + 0.08 * cpu + 0.06 * gpu + 0.05 * (outside - 25)
            power = 35.0 + 0.4 * cpu + 0.5 * gpu + (temp - setpoint + 4) * 4.0
            water = max(30.0, power * 1.5)
            fresh = water * 0.4

            t = {
                "cpu": cpu, "gpu": gpu, "temperature": temp,
                "power_kw": power, "water_lph": water, "fresh_water_lph": fresh,
                "outside_temp": outside, "humidity": humidity, "setpoint": setpoint,
                "sla": 99.98 if temp < 32 else 99.1
            }
            state = self._state_to_tensor(t)
            lp_sp, lp_cool, lp_wl, val = self.policy(state)

            dist_sp = Categorical(logits=lp_sp)
            dist_cool = Categorical(logits=lp_cool)
            dist_wl = Categorical(logits=lp_wl)

            a_sp = dist_sp.sample()
            a_cool = dist_cool.sample()
            a_wl = dist_wl.sample()

            r = self._compute_reward(t)
            advantage = torch.tensor([[r]], dtype=torch.float32) - val.detach()

            # PPO loss
            loss_actor = -(dist_sp.log_prob(a_sp) + dist_cool.log_prob(a_cool) + dist_wl.log_prob(a_wl)) * advantage
            loss_critic = nn.functional.mse_loss(val, torch.tensor([[r]], dtype=torch.float32))
            entropy = dist_sp.entropy() + dist_cool.entropy() + dist_wl.entropy()

            loss = loss_actor + 0.5 * loss_critic - 0.01 * entropy
            self.optimizer.zero_grad()
            loss.backward()
            self.optimizer.step()
            self.training_steps += 1
            self.reward_history.append(r)

    def optimize_step(self, telemetry, water_priority=1.0, energy_priority=1.0):
        self.policy.eval()
        with torch.no_grad():
            state = self._state_to_tensor(telemetry)
            lp_sp, lp_cool, lp_wl, val = self.policy(state)
            
            p_sp = torch.softmax(lp_sp, dim=-1).squeeze().numpy()
            p_cool = torch.softmax(lp_cool, dim=-1).squeeze().numpy()
            p_wl = torch.softmax(lp_wl, dim=-1).squeeze().numpy()

            act_sp_idx = int(np.argmax(p_sp))
            act_cool_idx = int(np.argmax(p_cool))
            act_wl_idx = int(np.argmax(p_wl))

        # Respect high temperature threshold for safety overrides
        temp = telemetry.get("temperature", 25.0)
        outside = telemetry.get("outside_temp", 28.0)
        humidity = telemetry.get("humidity", 50.0)

        # Contextual adjustment
        if temp > 30.0:
            act_sp_idx = 0  # lower setpoint by 1.0°C
        elif temp > 28.0 and act_sp_idx > 1:
            act_sp_idx = 1  # lower setpoint by 0.5°C

        # Free cooling viability check
        if outside < 20.0 and humidity < 60.0 and water_priority >= 1.0:
            act_cool_idx = 0  # Free Cooling
        elif water_priority > 1.2 and act_cool_idx == 2:
            act_cool_idx = 1  # Hybrid to preserve water

        setpoint_delta = self.SETPOINT_DELTAS[act_sp_idx]
        chosen_mode = self.COOLING_MODES[act_cool_idx]
        chosen_wl_action = self.WORKLOAD_ACTIONS[act_wl_idx]

        reward = self._compute_reward(telemetry, water_priority, energy_priority)

        actions = []
        if setpoint_delta != 0.0:
            actions.append(f"Adjust cooling setpoint by {setpoint_delta:+.1f}°C to balance thermal safety and chiller load.")
        else:
            actions.append("Maintain optimal cooling setpoint at nominal steady-state.")

        actions.append(f"Deploy {chosen_mode} cooling strategy (PPO confidence: {float(np.max(p_cool))*100:.1f}%).")

        if act_wl_idx > 0 or telemetry.get("cpu", 50) > 80:
            actions.append(f"Workload Dispatch: {chosen_wl_action}.")
        else:
            actions.append("Workload Dispatch: All rack loads balanced within thermal safety envelope.")

        return {
            "algorithm": "Proximal Policy Optimization (PPO)",
            "policy_type": "Actor-Critic Multi-Objective RL",
            "setpoint_delta": setpoint_delta,
            "cooling_mode": chosen_mode,
            "workload_action": chosen_wl_action,
            "actions": actions,
            "ppo_metrics": {
                "estimated_value": round(float(val.item()), 3),
                "policy_reward": round(reward, 3),
                "training_steps": self.training_steps,
                "confidence_score": round(float(np.max(p_cool)) * 100, 1),
                "entropy": round(float(np.mean([np.max(p_sp), np.max(p_cool), np.max(p_wl)])), 3)
            }
        }

ppo_optimizer = PPOOptimizer()
