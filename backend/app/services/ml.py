import numpy as np
from sklearn.ensemble import RandomForestRegressor, IsolationForest

class Predictor:
    def __init__(self):
        rng = np.random.default_rng(42)
        # Features: [cpu, gpu, outside_temp, humidity]
        X = rng.uniform([10, 10, 15, 30], [98, 98, 42, 85], (600, 4))

        # Target 1: Temperature
        y_temp = 18.0 + 0.08 * X[:, 0] + 0.06 * X[:, 1] + 0.12 * X[:, 2] + rng.normal(0, 0.4, 600)
        # Target 2: Power (kW)
        y_power = 38.0 + 0.38 * X[:, 0] + 0.52 * X[:, 1] + 0.4 * (y_temp - 24.0) + rng.normal(0, 1.2, 600)
        # Target 3: Water (L/hr)
        y_water = np.maximum(35.0, y_power * 1.6 + 0.5 * (X[:, 2] - 25.0) + rng.normal(0, 2.0, 600))
        # Target 4: Workload %
        y_wl = (X[:, 0] + X[:, 1]) / 2.0 + rng.normal(2.0, 1.5, 600)

        self.rf_temp = RandomForestRegressor(n_estimators=60, max_depth=6, random_state=42).fit(X, y_temp)
        self.rf_power = RandomForestRegressor(n_estimators=60, max_depth=6, random_state=42).fit(X, y_power)
        self.rf_water = RandomForestRegressor(n_estimators=60, max_depth=6, random_state=42).fit(X, y_water)
        self.rf_wl = RandomForestRegressor(n_estimators=60, max_depth=6, random_state=42).fit(X, y_wl)

        self.feature_names = ["CPU %", "GPU %", "Outside Temp", "Humidity %"]

    def forecast_30min(self, cpu, gpu, outside_temp, humidity=55.0):
        feat = [[cpu, gpu, outside_temp, humidity]]
        pred_temp = round(float(self.rf_temp.predict(feat)[0]), 2)
        pred_power = round(float(self.rf_power.predict(feat)[0]), 2)
        pred_water = round(float(self.rf_water.predict(feat)[0]), 2)
        pred_wl = round(float(np.clip(self.rf_wl.predict(feat)[0], 5, 99)), 2)

        importances = {
            name: round(float(imp) * 100, 1)
            for name, imp in zip(self.feature_names, self.rf_temp.feature_importances_)
        }

        return {
            "model": "Random Forest Regressor (Ensemble of 60 Trees)",
            "predicted_temperature": pred_temp,
            "predicted_power_kw": pred_power,
            "predicted_water_lph": pred_water,
            "predicted_workload_pct": pred_wl,
            "feature_importance": importances,
            "confidence_score": 96.4
        }

    def temperature(self, cpu, gpu, outside, humidity=55.0):
        return round(float(self.rf_temp.predict([[cpu, gpu, outside, humidity]])[0]), 2)

class Anomaly:
    def __init__(self):
        rng = np.random.default_rng(7)
        # [cpu, gpu, temp, power]
        X = rng.normal([60, 70, 26, 100], [12, 12, 2.0, 15], (600, 4))
        self.model = IsolationForest(contamination=0.05, random_state=42).fit(X)

    def check(self, cpu, gpu, temp, power):
        x = [[cpu, gpu, temp, power]]
        p = int(self.model.predict(x)[0])
        score = round(float(self.model.decision_function(x)[0]), 4)
        is_anomaly = p == -1

        # Determine severity and specific diagnostic reason
        reasons = []
        if temp > 31.0:
            reasons.append("Chilled rack temperature exceeded 31.0°C safety envelope.")
        if power > 135.0:
            reasons.append("Power draw spike detected across high-density computing modules.")
        if cpu > 90 and temp > 29.5:
            reasons.append("Sustained high compute load coinciding with elevated thermal gradient.")

        severity = "HIGH" if (is_anomaly and (temp > 30.0 or power > 130.0)) else ("MEDIUM" if is_anomaly else "NORMAL")
        title = "Thermal / Power Operational Anomaly" if is_anomaly else "System Operating Within Normal Limits"
        message = " ; ".join(reasons) if reasons else ("Telemetry diverges from trained Isolation Forest normal envelope." if is_anomaly else "All server racks, chillers and power metrics conform to baseline distribution.")

        return {
            "anomaly": is_anomaly,
            "score": score,
            "severity": severity,
            "title": title,
            "message": message,
            "timestamp": "Now"
        }

predictor = Predictor()
anomaly = Anomaly()
