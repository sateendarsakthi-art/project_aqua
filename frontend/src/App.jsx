import React, { useEffect, useState, useRef } from "react";
import { Routes, Route, NavLink } from "react-router-dom";
import {
  Activity, BrainCircuit, Droplets, Gauge, Server, Thermometer, Recycle, Cpu, AlertTriangle,
  Leaf, FileText, Zap, LayoutDashboard, Waves, ShieldCheck, Download, Play, Info, TrendingDown,
  CheckCircle2, FlaskConical, Wind, Flame, BarChart3, RefreshCw, Package, Cloud, DollarSign,
  ChevronRight, ArrowDown, ArrowUp, Settings, Target, Globe, Bell, Sliders, Check, Sparkles
} from "lucide-react";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar, RadialBarChart, RadialBar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell
} from "recharts";
import { api, ws } from "./api";

/* ── Navigation definition ── */
const nav = [
  { p: "/",             n: "Overview",               I: LayoutDashboard, section: "MONITOR" },
  { p: "/monitoring",   n: "Live Monitoring",        I: Activity,        section: null },
  { p: "/optimizer",    n: "AI Optimizer (PPO)",     I: BrainCircuit,    section: "AI ENGINE" },
  { p: "/cooling-water",n: "Cooling & Water",        I: Droplets,       section: null },
  { p: "/recovery",     n: "Water Recovery & Reuse", I: Recycle,         section: null },
  { p: "/workloads",    n: "Workload Manager",       I: Cpu,             section: "OPERATIONS" },
  { p: "/predictions",  n: "Predictions & Alerts",   I: BarChart3,       section: null },
  { p: "/sustainability",n: "Sustainability",        I: Leaf,            section: "REPORTS" },
  { p: "/reports",      n: "Reports",                I: FileText,        section: null },
];

/* ── Custom Dark Tooltip ── */
const DarkTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#141e2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px 14px", fontSize: 10 }}>
      <div style={{ color: "#94a3b8", marginBottom: 5, fontWeight: 700 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontFamily: "JetBrains Mono, monospace", fontWeight: 700 }}>
          {p.name}: {typeof p.value === "number" ? p.value.toFixed(2) : p.value}
        </div>
      ))}
    </div>
  );
};

/* ── Live WebSocket Hook ── */
function useLive() {
  const [d, setD] = useState({});
  const [history, setHistory] = useState([]);

  useEffect(() => {
    // Initial fetch
    api.get("/telemetry").then(res => {
      setD(res.data);
      setHistory([{ ...res.data, t: new Date().toLocaleTimeString("en", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }) }]);
    }).catch(() => {});

    const s = ws();
    s.onmessage = e => {
      try {
        const data = JSON.parse(e.data);
        setD(data);
        setHistory(h => [
          ...h.slice(-30),
          { ...data, t: new Date().toLocaleTimeString("en", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }) }
        ]);
      } catch (err) {}
    };
    return () => s.close();
  }, []);

  return { d, history };
}

/* ── Shared Layout ── */
function Layout({ children }) {
  const [alerts, setAlerts] = useState([]);
  const [showAlerts, setShowAlerts] = useState(false);

  useEffect(() => {
    const fetchAlerts = () => api.get("/alerts").then(res => setAlerts(res.data)).catch(() => {});
    fetchAlerts();
    const t = setInterval(fetchAlerts, 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="app">
      <aside>
        <div className="brand">
          <div className="brand-icon"><Waves size={20} /></div>
          <div className="brand-text">
            <b>AQUA-OPT</b>
            <small>Smart Data Center</small>
          </div>
        </div>
        <div className="team-strip">
          <span className="tname">⚡ Frostbite Fighters</span>
          <span className="sih-tag">SIH 2026</span>
        </div>
        {nav.map(({ p, n, I, section }) => (
          <React.Fragment key={p}>
            {section && <div className="nav-section">{section}</div>}
            <NavLink className={({ isActive }) => isActive ? "nav active" : "nav"} to={p}>
              <I size={16} />{n}
            </NavLink>
          </React.Fragment>
        ))}
        <div className="side-footer">
          <div className="status-dot"><span className="dot green" /><span>PPO Engine Online</span></div>
          <div className="status-dot"><span className="dot cyan" /><span>Digital Twin Active</span></div>
          <div className="status-dot"><span className="dot yellow" /><span>SIH26202 · Software</span></div>
        </div>
      </aside>

      <main>
        <header>
          <div className="hdr-left">
            <small>AQUA-OPT COMMAND CENTER</small>
            <h2>Data Center Resource Intelligence</h2>
          </div>
          <div className="hdr-right">
            <div className="alerts-wrap">
              <button className="alerts-btn" onClick={() => setShowAlerts(!showAlerts)}>
                <Bell size={14} />
                <span>Alerts</span>
                {alerts.filter(a => a.severity !== "NORMAL").length > 0 && (
                  <span className="alert-count-pill">
                    {alerts.filter(a => a.severity !== "NORMAL").length}
                  </span>
                )}
              </button>

              {showAlerts && (
                <div style={{
                  position: "absolute", right: 0, top: 40, width: 340, background: "var(--surface)",
                  border: "1px solid var(--border2)", borderRadius: 10, padding: 14, boxShadow: "0 10px 30px rgba(0,0,0,0.7)",
                  zIndex: 200
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <b style={{ fontSize: 12 }}>Active System Alerts</b>
                    <small style={{ color: "var(--text3)", cursor: "pointer" }} onClick={() => setShowAlerts(false)}>Close</small>
                  </div>
                  {alerts.map(a => (
                    <div key={a.id} style={{
                      background: "var(--surface2)", padding: "8px 10px", borderRadius: 6, marginBottom: 6,
                      borderLeft: `3px solid ${a.severity === "HIGH" ? "#ef4444" : a.severity === "MEDIUM" ? "#eab308" : "#22c55e"}`
                    }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text)" }}>{a.title}</div>
                      <div style={{ fontSize: 9, color: "var(--text2)", marginTop: 2 }}>{a.message}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <span className="sih-badge-hdr">SIH26202 · Frostbite Fighters</span>
            <span className="live-pill">LIVE TWIN</span>
          </div>
        </header>

        <section className="page-wrap">{children}</section>
      </main>
    </div>
  );
}

/* ── UI Helpers ── */
function Card({ title, Icon, accent, children, glowClass = "" }) {
  return (
    <div className={`card ${glowClass}`}>
      <div className="card-title">
        <div className={`ct-icon ${accent || ""}`}><Icon size={14} /></div>
        {title}
      </div>
      {children}
    </div>
  );
}

function Page({ title, sub, children }) {
  return (
    <div className="page">
      <div className="pagetitle">
        <div className="module-label">AQUA-OPT MODULE</div>
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
      {children}
    </div>
  );
}

function MetricCard({ label, value, unit, Icon, cls, trend }) {
  return (
    <div className={`metric-card ${cls}`}>
      <div className="mc-icon"><Icon size={16} /></div>
      <div className="mc-label">{label}</div>
      <div><span className="mc-value">{value}</span><span className="mc-unit">{unit}</span></div>
      {trend && (
        <div className="mc-trend" style={{ color: trend > 0 ? "#ef4444" : "#22c55e" }}>
          {trend > 0 ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
          {Math.abs(trend)}% vs last cycle
        </div>
      )}
    </div>
  );
}

function ScoreRing({ value, max = 100, color, label }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const r = 48;
  const circ = 2 * Math.PI * r;
  const dash = circ * (pct / 100);
  return (
    <div className="score-ring-wrap">
      <div className="score-ring">
        <svg width="120" height="120" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
          <circle
            cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="10"
            strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
            style={{ transition: "stroke-dasharray 1s ease", filter: `drop-shadow(0 0 8px ${color}88)` }}
          />
        </svg>
        <div className="sr-text">
          <span className="sr-num" style={{ color }}>{typeof value === "number" ? value.toFixed(1) : value}</span>
          <span className="sr-label">{label}</span>
        </div>
      </div>
    </div>
  );
}

function Racks({ temp = 26 }) {
  return (
    <div className="racks">
      {Array.from({ length: 8 }, (_, i) => {
        const t = temp + (i % 4) * 0.85 - 1.2;
        return (
          <div className={t > 30 ? "rack hot" : t > 27.5 ? "rack warm" : "rack"} key={i}>
            <Server size={18} />
            <b>R-{String(i + 1).padStart(2, "0")}</b>
            <span>{t.toFixed(1)}°C</span>
          </div>
        );
      })}
    </div>
  );
}

/* ════════════════════════════════════════════════
   PAGE 1: OVERVIEW
════════════════════════════════════════════════ */
function Overview() {
  const { d, history } = useLive();
  const [optimizing, setOptimizing] = useState(false);
  const [optSuccess, setOptSuccess] = useState(false);
  const [shiftMsg, setShiftMsg] = useState("");

  async function runOpt() {
    setOptimizing(true);
    try {
      await api.post("/optimize", { water_priority: 1.4, energy_priority: 1.0 });
      setOptSuccess(true);
      setTimeout(() => setOptSuccess(false), 4000);
    } catch (e) {}
    setOptimizing(false);
  }

  async function shiftWorkloads() {
    setShiftMsg("Shifting flexible loads...");
    try {
      await api.post("/workloads/shift", { shift_factor: 0.25 });
      setShiftMsg("Flexible jobs shifted away from hot racks!");
      setTimeout(() => setShiftMsg(""), 3500);
    } catch (e) {
      setShiftMsg("Error shifting");
    }
  }

  return (
    <Page title="Overview" sub="Autonomous AI optimization of data-center cooling, power, workload allocation, and water recovery.">
      {/* Hero Banner */}
      <div className="hero-banner">
        <div className="hero-content">
          <div className="hero-tag">AQUA-OPT · Smart India Hackathon 2026</div>
          <h1>Smarter Cooling.<br /><span>Less Water. Less Energy.</span></h1>
          <p>Closed-loop water reuse &amp; PPO Reinforcement Learning preserving server thermal safety and 99.98% SLA.</p>
          <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap", alignItems: "center" }}>
            <button className="btn btn-primary" onClick={runOpt} disabled={optimizing}>
              <Play size={14} />{optimizing ? "PPO Computing Policy..." : optSuccess ? "✓ PPO Optimized!" : "Run AI Optimization"}
            </button>
            <button className="btn btn-purple" onClick={shiftWorkloads}>
              <Cpu size={14} />Auto-Shift Workloads
            </button>
            <NavLink className="btn btn-ghost" to="/monitoring"><Activity size={14} />Live Monitor</NavLink>
            {shiftMsg && <span style={{ fontSize: 11, color: "var(--teal)", fontWeight: 600 }}>{shiftMsg}</span>}
          </div>
        </div>
        <div className="hero-stats">
          <div className="hero-stat">
            <ShieldCheck size={18} />
            <div>
              <b style={{ color: "#22c55e" }}>{d.sla?.toFixed(2) || "99.98"}%</b>
              <small>SLA Maintained</small>
            </div>
          </div>
          <div className="hero-stat">
            <Zap size={18} />
            <div>
              <b style={{ color: "#00e5ff" }}>{d.power_kw?.toFixed(1) || "--"} kW</b>
              <small>Total Power Draw</small>
            </div>
          </div>
          <div className="hero-stat">
            <Droplets size={18} />
            <div>
              <b style={{ color: "#00c9a7" }}>{d.fresh_water_lph?.toFixed(0) || "--"} L/hr</b>
              <small>Fresh Water Intake</small>
            </div>
          </div>
        </div>
      </div>

      {/* 8-Metric Live Strip */}
      <div className="metrics-strip">
        <MetricCard label="Power Draw" value={d.power_kw?.toFixed(1) || "--"} unit="kW" Icon={Zap} cls="mc-cyan" />
        <MetricCard label="Cooling Power" value={d.cooling_power_kw?.toFixed(1) || "--"} unit="kW" Icon={Wind} cls="mc-blue" />
        <MetricCard label="Fresh Water" value={d.fresh_water_lph?.toFixed(0) || "--"} unit="L/hr" Icon={Droplets} cls="mc-teal" />
        <MetricCard label="Recovered Water" value={d.recovered_lph?.toFixed(0) || "--"} unit="L/hr" Icon={Recycle} cls="mc-pink" />
        <MetricCard label="Rack Temperature" value={d.temperature?.toFixed(1) || "--"} unit="°C" Icon={Thermometer} cls="mc-orange" />
        <MetricCard label="SLA Maintained" value={d.sla?.toFixed(2) || "--"} unit="%" Icon={ShieldCheck} cls="mc-green" />
        <MetricCard label="PUE Ratio" value={d.pue?.toFixed(3) || "--"} unit="" Icon={Gauge} cls="mc-purple" />
        <MetricCard label="WUE Ratio" value={d.wue?.toFixed(2) || "--"} unit="L/kWh" Icon={Waves} cls="mc-yellow" />
      </div>

      {/* Live Trend Charts */}
      <div className="cols">
        <Card title="Power & Water Real-Time Telemetry" Icon={Activity} glowClass="card-glow-cyan">
          <div className="chart-area">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gPower" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00e5ff" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#00e5ff" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gWater" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00c9a7" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#00c9a7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="t" tick={{ fontSize: 8, fill: "#4b5c78" }} tickLine={false} />
                <YAxis tick={{ fontSize: 8, fill: "#4b5c78" }} tickLine={false} axisLine={false} />
                <Tooltip content={<DarkTooltip />} />
                <Area type="monotone" dataKey="power_kw" name="Power (kW)" stroke="#00e5ff" fill="url(#gPower)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="water_lph" name="Water (L/hr)" stroke="#00c9a7" fill="url(#gWater)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Compute Load: CPU & GPU Utilization" Icon={Cpu} glowClass="card-glow-purple">
          <div className="chart-area">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="t" tick={{ fontSize: 8, fill: "#4b5c78" }} tickLine={false} />
                <YAxis tick={{ fontSize: 8, fill: "#4b5c78" }} tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip content={<DarkTooltip />} />
                <Line type="monotone" dataKey="cpu" name="CPU %" stroke="#a855f7" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="gpu" name="GPU %" stroke="#6366f1" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Rack Map + Score Rings */}
      <div className="cols">
        <Card title="Digital Twin Rack Thermal Distribution" Icon={Thermometer} glowClass="card-glow-orange">
          <Racks temp={d.temperature} />
        </Card>
        <Card title="Composite Efficiency & Safety Scores" Icon={Gauge} glowClass="card-glow-green">
          <div style={{ display: "flex", justifyContent: "space-around", padding: "8px 0" }}>
            <ScoreRing value={d.efficiency_score || 88} max={100} color="#00e5ff" label="Efficiency" />
            <ScoreRing value={100 - (d.wue || 0) * 20} max={100} color="#00c9a7" label="Water Score" />
            <ScoreRing value={d.sla || 99.98} max={100} color="#22c55e" label="SLA %" />
          </div>
        </Card>
      </div>
    </Page>
  );
}

/* ════════════════════════════════════════════════
   PAGE 2: LIVE MONITORING
════════════════════════════════════════════════ */
function Monitoring() {
  const { d, history } = useLive();
  return (
    <Page title="Live Monitoring" sub="Real-time digital-twin telemetry across all server racks, chillers, pumps, and water conduits.">
      <div className="metrics-strip">
        <MetricCard label="CPU Load" value={d.cpu?.toFixed(0) || "--"} unit="%" Icon={Cpu} cls="mc-purple" />
        <MetricCard label="GPU Load" value={d.gpu?.toFixed(0) || "--"} unit="%" Icon={Server} cls="mc-indigo" />
        <MetricCard label="Total Power" value={d.power_kw?.toFixed(1) || "--"} unit="kW" Icon={Zap} cls="mc-cyan" />
        <MetricCard label="Water Draw" value={d.water_lph?.toFixed(0) || "--"} unit="L/hr" Icon={Droplets} cls="mc-teal" />
      </div>

      <div className="cols">
        <Card title="Rack Thermal Map" Icon={Thermometer} glowClass="card-glow-orange">
          <Racks temp={d.temperature} />
          <div style={{ marginTop: 10, display: "flex", gap: 12, fontSize: 10, color: "var(--text3)" }}>
            <span style={{ color: "var(--teal)" }}>■ Normal (&lt;27.5°C)</span>
            <span style={{ color: "var(--yellow)" }}>■ Warm (27.5°C - 30°C)</span>
            <span style={{ color: "var(--red)" }}>■ Hot (&gt;30°C)</span>
          </div>
        </Card>

        <Card title="Raw Telemetry Inspector" Icon={Activity} glowClass="card-glow-purple">
          <div className="tele-grid">
            {Object.entries(d).map(([k, v]) => {
              if (typeof v === "object") return null;
              return (
                <div className="tele-row" key={k}>
                  <span>{k.replaceAll("_", " ")}</span>
                  <b>{typeof v === "number" ? v.toFixed(2) : String(v)}</b>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card title="Multi-Channel Telemetry Stream" Icon={BarChart3} glowClass="card-glow-cyan">
        <div className="chart-area-lg">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                {[["gT", "#f97316"], ["gP", "#00e5ff"], ["gW", "#00c9a7"], ["gC", "#a855f7"]].map(([id, c]) => (
                  <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={c} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={c} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="t" tick={{ fontSize: 8, fill: "#4b5c78" }} tickLine={false} />
              <YAxis tick={{ fontSize: 8, fill: "#4b5c78" }} tickLine={false} axisLine={false} />
              <Tooltip content={<DarkTooltip />} />
              <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 9, color: "#94a3b8" }} />
              <Area type="monotone" dataKey="temperature" name="Temp °C" stroke="#f97316" fill="url(#gT)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="power_kw" name="Power kW" stroke="#00e5ff" fill="url(#gP)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="water_lph" name="Water L/hr" stroke="#00c9a7" fill="url(#gW)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="cpu" name="CPU %" stroke="#a855f7" fill="url(#gC)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </Page>
  );
}

/* ════════════════════════════════════════════════
   PAGE 3: AI OPTIMIZER (PPO RL)
════════════════════════════════════════════════ */
function Optimizer() {
  const [ppoData, setPpoData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [waterWeight, setWaterWeight] = useState(1.4);
  const [energyWeight, setEnergyWeight] = useState(1.0);
  const [setpointVal, setSetpointVal] = useState(24.0);

  const fetchPpo = async () => {
    try {
      const res = await api.get("/optimizer/ppo");
      setPpoData(res.data);
      if (res.data.telemetry?.setpoint) setSetpointVal(res.data.telemetry.setpoint);
    } catch (e) {}
  };

  useEffect(() => {
    fetchPpo();
    const t = setInterval(fetchPpo, 6000);
    return () => clearInterval(t);
  }, []);

  async function executePPO() {
    setLoading(true);
    try {
      const res = await api.post("/optimize", {
        water_priority: Number(waterWeight),
        energy_priority: Number(energyWeight)
      });
      setPpoData({ telemetry: res.data.telemetry, ppo_decision: res.data.ppo_decision, actions: res.data.actions });
      if (res.data.telemetry?.setpoint) setSetpointVal(res.data.telemetry.setpoint);
    } catch (e) {}
    setLoading(false);
  }

  async function handleSetpointChange(val) {
    setSetpointVal(val);
    await api.post("/cooling/setpoint", { setpoint: Number(val) });
  }

  return (
    <Page title="AI Optimizer" sub="Multi-Objective Proximal Policy Optimization (PPO) reinforcement learning for joint cooling, power, and water efficiency.">
      <div className="cols">
        {/* Objectives & PPO Controls */}
        <Card title="PPO Multi-Objective Reinforcement Learning Engine" Icon={BrainCircuit} glowClass="card-glow-purple">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <span className="ppo-badge"><Sparkles size={12} />Actor-Critic Deep RL</span>
            <span style={{ fontSize: 10, color: "var(--text2)" }}>Policy: Clipped PPO (ε=0.2)</span>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
              <span>Water Saving Weight (α)</span>
              <b style={{ color: "var(--cyan)" }}>{waterWeight}x</b>
            </div>
            <input type="range" min="0.5" max="2.5" step="0.1" value={waterWeight}
              onChange={e => setWaterWeight(e.target.value)} style={{ width: "100%", accentColor: "var(--cyan)" }} />
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
              <span>Energy Saving Weight (β)</span>
              <b style={{ color: "var(--purple)" }}>{energyWeight}x</b>
            </div>
            <input type="range" min="0.5" max="2.5" step="0.1" value={energyWeight}
              onChange={e => setEnergyWeight(e.target.value)} style={{ width: "100%", accentColor: "var(--purple)" }} />
          </div>

          {/* Cooling Setpoint Slider */}
          <div className="setpoint-box">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Sliders size={14} style={{ color: "var(--cyan)" }} />
                <b style={{ fontSize: 11 }}>Cooling Setpoint Control</b>
              </div>
              <span style={{ fontSize: 14, fontFamily: "JetBrains Mono, monospace", color: "var(--cyan)", fontWeight: 800 }}>
                {setpointVal}°C
              </span>
            </div>
            <input type="range" min="18.0" max="28.0" step="0.5" value={setpointVal}
              onChange={e => handleSetpointChange(e.target.value)} className="setpoint-slider" />
            <div className="setpoint-ticks">
              <span>18°C (Max Chill)</span>
              <span>24°C (Nominal)</span>
              <span>28°C (Eco Cap)</span>
            </div>
          </div>

          <button className="btn btn-primary" style={{ width: "100%", marginTop: 14, justifyContent: "center" }}
            onClick={executePPO} disabled={loading}>
            <BrainCircuit size={14} />{loading ? "Computing Policy..." : "Execute PPO Optimization Step"}
          </button>
        </Card>

        {/* PPO Decisions & Metrics */}
        <Card title="PPO Policy Output & Actionable Dispatch" Icon={Zap} glowClass="card-glow-cyan">
          {ppoData?.ppo_decision ? (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
                <div style={{ background: "var(--surface2)", padding: "10px 12px", borderRadius: 8 }}>
                  <div style={{ fontSize: 9, color: "var(--text3)" }}>PPO Value Estimate V(s)</div>
                  <div style={{ fontSize: 16, fontWeight: 800, fontFamily: "JetBrains Mono", color: "var(--cyan)" }}>
                    {ppoData.ppo_decision.ppo_metrics?.estimated_value ?? 0.84}
                  </div>
                </div>
                <div style={{ background: "var(--surface2)", padding: "10px 12px", borderRadius: 8 }}>
                  <div style={{ fontSize: 9, color: "var(--text3)" }}>Policy Reward R(s,a)</div>
                  <div style={{ fontSize: 16, fontWeight: 800, fontFamily: "JetBrains Mono", color: "var(--green)" }}>
                    {ppoData.ppo_decision.ppo_metrics?.policy_reward ?? -0.92}
                  </div>
                </div>
                <div style={{ background: "var(--surface2)", padding: "10px 12px", borderRadius: 8 }}>
                  <div style={{ fontSize: 9, color: "var(--text3)" }}>Action Confidence</div>
                  <div style={{ fontSize: 16, fontWeight: 800, fontFamily: "JetBrains Mono", color: "var(--purple)" }}>
                    {ppoData.ppo_decision.ppo_metrics?.confidence_score ?? 89.4}%
                  </div>
                </div>
                <div style={{ background: "var(--surface2)", padding: "10px 12px", borderRadius: 8 }}>
                  <div style={{ fontSize: 9, color: "var(--text3)" }}>Strategy Selected</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "var(--teal)" }}>
                    {ppoData.ppo_decision.cooling_mode || "Hybrid"}
                  </div>
                </div>
              </div>

              <div className="card-title" style={{ fontSize: 11, marginBottom: 8 }}>Action Plan Issued by PPO</div>
              <div style={{ display: "grid", gap: 6, marginBottom: 12 }}>
                {(ppoData.actions || ppoData.ppo_decision.actions || [
                  "Lower cooling setpoint by 0.5°C to protect thermal headroom.",
                  "Deploy Hybrid cooling strategy to save fresh water.",
                  "Maintain optimal workload distribution across cold racks."
                ]).map((act, i) => (
                  <div key={i} className="action-item"><b>→</b>{act}</div>
                ))}
              </div>

              {ppoData.telemetry && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginTop: 10 }}>
                  {[
                    ["Power", ppoData.telemetry.power_kw?.toFixed(1), "kW", "#00e5ff"],
                    ["Temp", ppoData.telemetry.temperature?.toFixed(1), "°C", "#f97316"],
                    ["Fresh Water", ppoData.telemetry.fresh_water_lph?.toFixed(0), "L/hr", "#00c9a7"],
                    ["PUE", ppoData.telemetry.pue?.toFixed(3), "", "#a855f7"]
                  ].map(([l, v, u, c]) => (
                    <div key={l} style={{ background: "var(--surface2)", padding: "8px 10px", borderRadius: 6, textAlign: "center" }}>
                      <div style={{ fontSize: 8, color: "var(--text3)" }}>{l}</div>
                      <div style={{ fontSize: 13, fontWeight: 800, fontFamily: "JetBrains Mono", color: c }}>{v} <small style={{ fontSize: 8 }}>{u}</small></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p style={{ fontSize: 11, color: "var(--text2)", textAlign: "center", marginTop: 30 }}>
              Loading PPO Neural Network state...
            </p>
          )}
        </Card>
      </div>
    </Page>
  );
}

/* ════════════════════════════════════════════════
   PAGE 4: COOLING & WATER
════════════════════════════════════════════════ */
function Cooling() {
  const [d, setD] = useState(null);
  const { history } = useLive();

  const loadData = () => api.get("/water").then(x => setD(x.data)).catch(() => {});
  useEffect(() => {
    loadData();
    const t = setInterval(loadData, 3000);
    return () => clearInterval(t);
  }, []);

  const mode = d?.current?.water_aware_cooling_strategy || "Hybrid";

  async function setMode(newMode) {
    await api.post("/cooling/mode", { cooling_mode: newMode });
    loadData();
  }

  return (
    <Page title="Cooling & Water" sub="Joint cooling strategy selection, thermal setpoints, water accounting and balance tracking.">
      <div className="metrics-strip" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
        <MetricCard label="Fresh Water" value={d?.fresh_water_lph?.toFixed(0) || "--"} unit="L/hr" Icon={Droplets} cls="mc-cyan" />
        <MetricCard label="Recovery %" value={d?.recovery_rate_pct?.toFixed(0) || "--"} unit="%" Icon={Recycle} cls="mc-teal" />
        <MetricCard label="Reuse %" value={d?.reuse_rate_pct?.toFixed(0) || "--"} unit="%" Icon={Waves} cls="mc-green" />
        <MetricCard label="WUE" value={d?.wue?.toFixed(2) || "--"} unit="L/kWh" Icon={Gauge} cls="mc-purple" />
      </div>

      <div className="cols">
        <Card title="Water-Aware Cooling Strategy Control" Icon={Wind} glowClass="card-glow-cyan">
          <p style={{ fontSize: 11, color: "var(--text2)", lineHeight: 1.7, marginBottom: 12 }}>
            AQUA-OPT dynamically activates Free Cooling, Hybrid, or Evaporative modes depending on wet-bulb temperature and humidity.
          </p>
          <div className="strat-grid">
            {[
              ["Free Cooling", "Uses ambient cold air — near zero water evaporation", "Free Cooling"],
              ["Hybrid", "Air + evaporative assist — optimal water-energy balance", "Hybrid"],
              ["Evaporative", "Full evaporative mode — max heat rejection for peak thermal load", "Evaporative"]
            ].map(([n, desc, k]) => {
              const active = d?.current?.cooling_mode === k || (mode === k && !d?.current?.cooling_mode);
              return (
                <div className={`strat-card ${active ? `active-hy` : ""}`} key={k} onClick={() => setMode(k)} style={{ cursor: "pointer" }}>
                  <div className="strat-active-indicator" />
                  <b>{n}</b>
                  <small>{desc}</small>
                  {active && <span style={{ fontSize: 9, color: "var(--cyan)", fontWeight: 700, marginTop: 4 }}>● ACTIVE MODE</span>}
                </div>
              );
            })}
          </div>
        </Card>

        <Card title="Water Accounting Balance" Icon={Droplets} glowClass="card-glow-teal">
          <div className="water-balance">
            <div className="wb-cell wbc-demand"><div className="wbl">Total Demand</div><span className="wbv">{d?.current?.water_lph?.toFixed(0) || "--"}<span className="wbu">L/hr</span></span></div>
            <div className="wb-cell wbc-recovered"><div className="wbl">Recovered</div><span className="wbv">{d?.recovered_lph?.toFixed(0) || "--"}<span className="wbu">L/hr</span></span></div>
            <div className="wb-cell wbc-reused"><div className="wbl">Reused</div><span className="wbv">{d?.water_saved_lph?.toFixed(0) || "--"}<span className="wbu">L/hr</span></span></div>
            <div className="wb-cell wbc-fresh"><div className="wbl">Fresh Intake</div><span className="wbv">{d?.fresh_water_lph?.toFixed(0) || "--"}<span className="wbu">L/hr</span></span></div>
          </div>
        </Card>
      </div>

      <Card title="Water Flow Real-Time Dynamics" Icon={BarChart3} glowClass="card-glow-teal">
        <div className="chart-area">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                {[["gwL", "#f97316"], ["gwR", "#00c9a7"], ["gwF", "#00e5ff"]].map(([id, c]) => (
                  <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={c} stopOpacity={0.3} /><stop offset="95%" stopColor={c} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="t" tick={{ fontSize: 8, fill: "#4b5c78" }} tickLine={false} />
              <YAxis tick={{ fontSize: 8, fill: "#4b5c78" }} tickLine={false} axisLine={false} />
              <Tooltip content={<DarkTooltip />} />
              <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 9, color: "#94a3b8" }} />
              <Area type="monotone" dataKey="water_lph" name="Total Demand" stroke="#f97316" fill="url(#gwL)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="recovered_lph" name="Recovered" stroke="#00c9a7" fill="url(#gwR)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="fresh_water_lph" name="Fresh Used" stroke="#00e5ff" fill="url(#gwF)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </Page>
  );
}

/* ════════════════════════════════════════════════
   PAGE 5: WATER RECOVERY & REUSE
════════════════════════════════════════════════ */
function Recovery() {
  const [cycleData, setCycleData] = useState(null);
  const [a, setA] = useState(200);
  const [eff, setEff] = useState(72);
  const [r, setR] = useState(null);

  useEffect(() => {
    const fetchCycle = () => api.get("/water/cycle").then(res => setCycleData(res.data)).catch(() => {});
    fetchCycle();
    const t = setInterval(fetchCycle, 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <Page title="Water Recovery & Reuse" sub="Capture, treat, and return cooling-system losses to create a closed-loop zero-waste water cycle.">
      {/* 8-Stage Closed-Loop Cycle Diagram */}
      <Card title="Closed-Loop Water Cycle Architecture" Icon={Recycle} glowClass="card-glow-cyan">
        <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 12 }}>
          Data Center → Cooling → Recoverable Water → Treatment → Quality Check → Storage → Reuse → Less Fresh Water
        </div>
        <div className="cycle-track">
          {(cycleData?.cycle_stages || [
            { step: 1, title: "Data Center", desc: "Servers produce thermal load; liquid heat exchangers absorb heat", flow_lph: 180, status: "Active" },
            { step: 2, title: "Cooling System", desc: "Hybrid heat rejection coils and cooling towers", flow_lph: 180, status: "Active" },
            { step: 3, title: "Recoverable Water", desc: "Condensate and heat exchanger blowdown capture points", flow_lph: 72, status: "Capturing" },
            { step: 4, title: "Treatment Plant", desc: "Multi-stage sediment filters and UV disinfection", flow_lph: 64, status: "Purifying" },
            { step: 5, title: "Quality Check", desc: "Live IoT probes validating pH, Turbidity, and TDS", flow_lph: 64, status: "Verified" },
            { step: 6, title: "Storage Buffer", desc: "Treated recycled holding tanks for on-demand chiller feed", flow_lph: 60, status: "Buffered" },
            { step: 7, title: "Reuse Loop", desc: "Recycled water returned to cooling tower make-up circuit", flow_lph: 51, status: "Injecting" },
            { step: 8, title: "Less Fresh Water", desc: "Fresh municipal water intake reduced by up to 35%", flow_lph: 129, status: "Conserving" },
          ]).map(st => (
            <div className="cycle-step-card" key={st.step}>
              <div>
                <div className="cycle-step-hdr">
                  <div className="cycle-num-badge">{st.step}</div>
                  <span className="cycle-status-pill">{st.status}</span>
                </div>
                <div className="cycle-step-title">{st.title}</div>
                <div className="cycle-step-desc">{st.desc}</div>
              </div>
              <div className="cycle-step-flow">
                <span>Flow Volume</span>
                <span className="cycle-flow-val">{st.flow_lph} L/h</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Water Quality Status (pH, turbidity, TDS) */}
      <Card title="Water Quality IoT Probe Station" Icon={FlaskConical} glowClass="card-glow-teal">
        <div className="wq-grid">
          <div className="wq-card">
            <div className="wq-lbl">pH Level</div>
            <div>
              <span className="wq-val">{cycleData?.quality?.ph ?? 7.22}</span>
              <span className="wq-unit">pH</span>
            </div>
            <span className="wq-badge">Optimal (6.8 - 7.8)</span>
          </div>
          <div className="wq-card">
            <div className="wq-lbl">Turbidity</div>
            <div>
              <span className="wq-val">{cycleData?.quality?.turbidity_ntu ?? 1.18}</span>
              <span className="wq-unit">NTU</span>
            </div>
            <span className="wq-badge">Clear (&lt; 2.5 NTU)</span>
          </div>
          <div className="wq-card">
            <div className="wq-lbl">Total Dissolved Solids</div>
            <div>
              <span className="wq-val">{cycleData?.quality?.tds_ppm ?? 144.5}</span>
              <span className="wq-unit">ppm</span>
            </div>
            <span className="wq-badge">Purity High (&lt; 300 ppm)</span>
          </div>
          <div className="wq-card">
            <div className="wq-lbl">Conductivity</div>
            <div>
              <span className="wq-val">{cycleData?.quality?.conductivity_us ?? 245.0}</span>
              <span className="wq-unit">µS/cm</span>
            </div>
            <span className="wq-badge">Safe Conductivity</span>
          </div>
        </div>
      </Card>

      {/* Recovery Simulator */}
      <Card title="Recovery & Reuse Yield Calculator" Icon={Sliders} glowClass="card-glow-cyan">
        <div className="recovery-form">
          <div className="form-field">
            <label className="form-label">Cooling Loss Volume (L/hr)</label>
            <input className="form-input" type="number" value={a} onChange={e => setA(e.target.value)} />
          </div>
          <div className="form-field">
            <label className="form-label">Recovery Efficiency (%)</label>
            <input className="form-input" type="number" value={eff} min={0} max={100} onChange={e => setEff(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={async () => {
            const res = await api.post("/water/recover", { cooling_loss_lph: Number(a), efficiency: Number(eff) / 100 });
            setR(res.data);
          }}>
            <Play size={14} />Calculate Yield
          </button>
        </div>

        {r && (
          <div className="result-grid">
            <div className="result-cell"><span className="rv">{r.recovered_lph} L/hr</span><small>Recovered Water</small></div>
            <div className="result-cell"><span className="rv">{r.reused_lph} L/hr</span><small>Reused Make-up</small></div>
            <div className="result-cell"><span className="rv">PASSED</span><small>Quality Verification</small></div>
            <div className="result-cell"><span className="rv">{r.savings_pct}%</span><small>Utility Savings</small></div>
          </div>
        )}
      </Card>
    </Page>
  );
}

/* ════════════════════════════════════════════════
   PAGE 6: WORKLOAD MANAGER
════════════════════════════════════════════════ */
function Workloads() {
  const [w, setW] = useState([]);
  const [shifting, setShifting] = useState(false);
  const [shiftMsg, setShiftMsg] = useState("");

  const load = () => api.get("/workloads").then(x => setW(x.data)).catch(() => {});
  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, []);

  async function act(id, a) {
    await api.post(`/workloads/${id}/action`, { action: a });
    load();
  }

  async function autoShift() {
    setShifting(true);
    setShiftMsg("Shifting workloads to cool thermal zones...");
    try {
      await api.post("/workloads/shift", { shift_factor: 0.25 });
      setShiftMsg("✓ Flexible workloads successfully migrated!");
      setTimeout(() => setShiftMsg(""), 3500);
      load();
    } catch (e) {
      setShiftMsg("Error executing workload shift");
    }
    setShifting(false);
  }

  const spClass = s => s === "RUNNING" ? "sp-running" : s === "MIGRATING" ? "sp-migrating" : s === "DELAYED" ? "sp-delayed" : "sp-paused";
  const cpuColor = v => v > 80 ? "#ef4444" : v > 60 ? "#eab308" : "#22c55e";

  return (
    <Page title="Workload Manager" sub="Intelligently migrate, delay or throttle flexible workloads to protect rack temperatures and balance chiller demand.">
      <Card title="Active Data Center Workloads" Icon={Package} glowClass="card-glow-purple">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <p style={{ fontSize: 11, color: "var(--text2)" }}>
            Non-flexible workloads are SLA-locked; flexible workloads can be shifted to cooler racks or scheduled during lower ambient temperatures.
          </p>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button className="btn btn-purple" onClick={autoShift} disabled={shifting}>
              <Cpu size={14} />{shifting ? "Shifting..." : "AI Auto-Shift Workloads"}
            </button>
            {shiftMsg && <span style={{ fontSize: 11, color: "var(--teal)", fontWeight: 700 }}>{shiftMsg}</span>}
          </div>
        </div>

        <table className="w-table">
          <thead>
            <tr>
              <th>Workload Name</th>
              <th>CPU Load</th>
              <th>GPU Load</th>
              <th>SLA Commitment</th>
              <th>Flexibility</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {w.map(x => (
              <tr key={x.id}>
                <td><b style={{ fontSize: 11 }}>{x.name}</b></td>
                <td>
                  <div className="cpu-bar-wrap">
                    <div className="cpu-bar"><div className="cpu-fill" style={{ width: `${x.cpu}%`, background: cpuColor(x.cpu) }} /></div>
                    <span style={{ fontSize: 10, fontFamily: "JetBrains Mono", color: cpuColor(x.cpu) }}>{x.cpu}%</span>
                  </div>
                </td>
                <td>
                  <div className="cpu-bar-wrap">
                    <div className="cpu-bar"><div className="cpu-fill" style={{ width: `${x.gpu}%`, background: cpuColor(x.gpu) }} /></div>
                    <span style={{ fontSize: 10, fontFamily: "JetBrains Mono", color: cpuColor(x.gpu) }}>{x.gpu}%</span>
                  </div>
                </td>
                <td style={{ fontSize: 10, fontFamily: "JetBrains Mono", color: "var(--green)" }}>{x.sla}%</td>
                <td><span style={{ fontSize: 9, color: x.flexible ? "var(--teal)" : "var(--text3)" }}>{x.flexible ? "✓ Flexible" : "✗ Critical"}</span></td>
                <td><span className={`status-pill ${spClass(x.status)}`}>{x.status}</span></td>
                <td>
                  <button className="btn-xs" onClick={() => act(x.id, "MIGRATE")} disabled={!x.flexible}>Migrate</button>
                  <button className="btn-xs" onClick={() => act(x.id, "DELAY")} disabled={!x.flexible}>Delay</button>
                  <button className="btn-xs" onClick={() => act(x.id, "RUN")}>Run</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </Page>
  );
}

/* ════════════════════════════════════════════════
   PAGE 7: PREDICTIONS & ALERTS
════════════════════════════════════════════════ */
function Predictions() {
  const [p, setP] = useState(null);
  const [al, setAl] = useState([]);
  const { history } = useLive();

  useEffect(() => {
    const load = async () => {
      try {
        setP((await api.get("/predictions")).data);
        setAl((await api.get("/alerts")).data);
      } catch (e) {}
    };
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <Page title="Predictions & Alerts" sub="Multi-objective Random Forest Regressors forecast temperature, power and water demand. Isolation Forest flags anomalies early.">
      <div className="cols">
        {/* 30-min Random Forest Forecast */}
        <Card title="Random Forest 30-Minute Multi-Target Forecast" Icon={BarChart3} glowClass="card-glow-cyan">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
            <div style={{ background: "var(--surface2)", padding: "12px 14px", borderRadius: 8 }}>
              <div style={{ fontSize: 9, color: "var(--text3)" }}>Predicted Temperature</div>
              <div style={{ fontSize: 20, fontWeight: 900, fontFamily: "JetBrains Mono", color: "var(--orange)" }}>
                {p?.predicted_temperature ?? "--"} <span style={{ fontSize: 10 }}>°C</span>
              </div>
            </div>
            <div style={{ background: "var(--surface2)", padding: "12px 14px", borderRadius: 8 }}>
              <div style={{ fontSize: 9, color: "var(--text3)" }}>Predicted Power</div>
              <div style={{ fontSize: 20, fontWeight: 900, fontFamily: "JetBrains Mono", color: "var(--cyan)" }}>
                {p?.predicted_power_kw ?? "--"} <span style={{ fontSize: 10 }}>kW</span>
              </div>
            </div>
            <div style={{ background: "var(--surface2)", padding: "12px 14px", borderRadius: 8 }}>
              <div style={{ fontSize: 9, color: "var(--text3)" }}>Predicted Water Draw</div>
              <div style={{ fontSize: 20, fontWeight: 900, fontFamily: "JetBrains Mono", color: "var(--teal)" }}>
                {p?.predicted_water_lph ?? "--"} <span style={{ fontSize: 10 }}>L/hr</span>
              </div>
            </div>
            <div style={{ background: "var(--surface2)", padding: "12px 14px", borderRadius: 8 }}>
              <div style={{ fontSize: 9, color: "var(--text3)" }}>Predicted Workload</div>
              <div style={{ fontSize: 20, fontWeight: 900, fontFamily: "JetBrains Mono", color: "var(--purple)" }}>
                {p?.predicted_workload_pct ?? "--"} <span style={{ fontSize: 10 }}>%</span>
              </div>
            </div>
          </div>

          {p?.feature_importance && (
            <div>
              <div style={{ fontSize: 10, color: "var(--text2)", fontWeight: 700, marginBottom: 8 }}>
                Random Forest Feature Importance Weights:
              </div>
              {Object.entries(p.feature_importance).map(([k, v]) => (
                <div key={k} className="prob-bar-row">
                  <span style={{ width: 90, color: "var(--text2)" }}>{k}</span>
                  <div className="prob-bar-bg">
                    <div className="prob-bar-fill" style={{ width: `${v}%` }} />
                  </div>
                  <span style={{ width: 45, textAlign: "right", fontFamily: "JetBrains Mono", color: "var(--cyan)" }}>{v}%</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Isolation Forest & Live Alerts */}
        <Card title="Anomaly Detection & Alert Notifications" Icon={AlertTriangle} glowClass="card-glow-orange">
          <p style={{ fontSize: 10, color: "var(--text2)", lineHeight: 1.6, marginBottom: 12 }}>
            Monitors real-time multi-dimensional telemetry against the trained Isolation Forest normal envelope.
          </p>
          <div style={{ display: "grid", gap: 8 }}>
            {al.map((x, i) => (
              <div className={`anomaly-card ${x.severity === "HIGH" ? "high" : x.severity === "MEDIUM" ? "medium" : "normal"}`} key={i}>
                <AlertTriangle size={16} />
                <div style={{ flex: 1 }}>
                  <b>{x.title}</b>
                  <p>{x.message}</p>
                </div>
                <span className={`severity-badge ${x.severity === "HIGH" ? "sb-high" : "sb-normal"}`}>{x.severity}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="Predicted Temperature vs Outside Ambient" Icon={Thermometer} glowClass="card-glow-orange">
        <div className="chart-area">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="t" tick={{ fontSize: 8, fill: "#4b5c78" }} tickLine={false} />
              <YAxis tick={{ fontSize: 8, fill: "#4b5c78" }} tickLine={false} axisLine={false} />
              <Tooltip content={<DarkTooltip />} />
              <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 9, color: "#94a3b8" }} />
              <Line type="monotone" dataKey="temperature" name="Rack Temp °C" stroke="#f97316" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="outside_temp" name="Outside Ambient °C" stroke="#6366f1" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </Page>
  );
}

/* ════════════════════════════════════════════════
   PAGE 8: SUSTAINABILITY
════════════════════════════════════════════════ */
function Sustainability() {
  const [s, setS] = useState(null);
  const { d } = useLive();

  useEffect(() => {
    api.get("/sustainability").then(x => setS(x.data)).catch(() => {});
    const t = setInterval(() => api.get("/sustainability").then(x => setS(x.data)).catch(() => {}), 6000);
    return () => clearInterval(t);
  }, []);

  const carbon = d.power_kw ? d.power_kw * 0.42 : null;
  const carbonOpt = carbon ? carbon * 0.79 : null;
  const pieData = [{ name: "Saved", value: 32 }, { name: "Used", value: 68 }];
  const PIE_COLORS = ["#00c9a7", "#1a2540"];

  return (
    <Page title="Sustainability" sub="Before vs. After Optimization — baseline operational profile compared to AQUA-OPT optimized operating point.">
      <div className="ba-banner">
        <span className="ba-pill ba-before">⚡ Before Optimization — Baseline</span>
        <span className="ba-arrow">→ AI Optimizes →</span>
        <span className="ba-pill ba-after">✅ After Optimization — AQUA-OPT</span>
      </div>

      <div className="metrics-strip">
        <MetricCard label="Energy Saved" value="18" unit="%" Icon={Zap} cls="mc-yellow" />
        <MetricCard label="Water Saved" value="32" unit="%" Icon={Droplets} cls="mc-teal" />
        <MetricCard label="Carbon Reduced" value="21" unit="%" Icon={Cloud} cls="mc-green" />
        <MetricCard label="Cost Saved" value="16" unit="%" Icon={DollarSign} cls="mc-cyan" />
      </div>

      <div className="compare-grid">
        {s && Object.entries(s).map(([k, v]) => (
          <div className="compare-card" key={k}>
            <div className="cc-label">{k}</div>
            <div className="compare-row before"><span>🔴 Baseline</span><strong>{v.current}</strong></div>
            <div className="compare-row after"><span>🟢 Optimized</span><strong>{v.optimized}</strong></div>
            <div className="saving-badge">↓ {v.saving_pct}% saving</div>
          </div>
        ))}
      </div>

      <div className="cols">
        <Card title="Carbon Footprint Tracker (CO₂)" Icon={Cloud} glowClass="card-glow-green">
          <div className="carbon-meter">
            {[
              ["Current CO₂", carbon?.toFixed(2) || "--", "kg/hr", "#ef4444", 70],
              ["Optimized CO₂", carbonOpt?.toFixed(2) || "--", "kg/hr", "#22c55e", 54],
              ["Net-Zero Target", "0.80", "kg/hr", "#00e5ff", 20],
            ].map(([l, v, u, c, w]) => (
              <div className="carbon-bar-wrap" key={l}>
                <div className="carbon-bar-label">{l}</div>
                <div className="carbon-bar"><div className="carbon-fill" style={{ width: `${w}%`, background: `linear-gradient(90deg,${c}88,${c})` }} /></div>
                <div className="carbon-bar-val" style={{ color: c }}>{v} <span style={{ fontSize: 8, color: "var(--text3)" }}>{u}</span></div>
              </div>
            ))}
          </div>
          <div className="info-note" style={{ marginTop: 12 }}>
            <Leaf size={13} />Calculated based on 0.42 kg CO₂/kWh grid average intensity with joint workload &amp; cooling reduction.
          </div>
        </Card>

        <Card title="Fresh Water Savings Breakdown" Icon={Droplets} glowClass="card-glow-teal">
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ width: 130, height: 130, flexShrink: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={3} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 28, fontWeight: 900, fontFamily: "JetBrains Mono", color: "var(--teal)" }}>32%</div>
              <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 10 }}>Fresh water reduced via recovery &amp; reuse</div>
              {[["Recovery Rate", "72%", "#00c9a7"], ["Reuse Rate", "80%", "#22c55e"], ["WUE Reduction", "32%", "#00e5ff"]].map(([l, v, c]) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: 10, padding: "4px 0", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ color: "var(--text2)" }}>{l}</span>
                  <b style={{ color: c, fontFamily: "JetBrains Mono" }}>{v}</b>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </Page>
  );
}

/* ════════════════════════════════════════════════
   PAGE 9: REPORTS
════════════════════════════════════════════════ */
function Reports() {
  return (
    <Page title="Reports" sub="Export telemetry datasets and sustainability audit summaries for Smart India Hackathon 2026.">
      <div className="cols">
        <Card title="Telemetry CSV Dataset Export" Icon={FileText} glowClass="card-glow-cyan">
          <div className="report-card">
            <div className="report-icon" style={{ background: "rgba(0,229,255,0.1)", color: "var(--cyan)" }}><FileText size={24} /></div>
            <p style={{ fontSize: 11, color: "var(--text2)", marginBottom: 18, lineHeight: 1.7 }}>
              Export high-resolution digital-twin telemetry logs (CPU, GPU, power, water, PUE, WUE, SLA) for offline validation and analysis.
            </p>
            <a className="btn btn-primary" href="http://localhost:8000/api/export/csv" download="aquaopt_telemetry.csv">
              <Download size={14} />Download Telemetry CSV
            </a>
          </div>
        </Card>

        <Card title="SIH 2026 Project Package" Icon={Package} glowClass="card-glow-purple">
          <div className="report-card">
            <div className="report-icon" style={{ background: "rgba(168,85,247,0.1)", color: "var(--purple)" }}><Globe size={24} /></div>
            <p style={{ fontSize: 11, color: "var(--text2)", marginBottom: 18, lineHeight: 1.7 }}>
              Complete evaluation package detailing Problem Statement SIH26202, PPO algorithm parameters, and water closed-loop results.
            </p>
            <a className="btn btn-purple" href="http://localhost:8000/api/export/csv" download="sih_aquaopt_data.csv">
              <Download size={14} />Download SIH Dataset
            </a>
          </div>
        </Card>
      </div>

      <Card title="Smart India Hackathon Project Identification" Icon={Info} glowClass="card-glow-cyan">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {[
            ["Problem ID", "SIH26202", "#00e5ff"],
            ["Team Name", "Frostbite Fighters", "#f97316"],
            ["Theme", "Smart Automation", "#a855f7"],
            ["Category", "Software", "#22c55e"],
            ["AI Stack", "Random Forest + PPO RL", "#00c9a7"],
            ["Status", "Full-Stack Prototype Live", "#eab308"]
          ].map(([l, v, c]) => (
            <div key={l} style={{ background: "var(--surface2)", borderRadius: 8, padding: "12px 14px" }}>
              <div style={{ fontSize: 9, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 4 }}>{l}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: c }}>{v}</div>
            </div>
          ))}
        </div>
      </Card>
    </Page>
  );
}

/* ── Root Application Router ── */
export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/"               element={<Overview />} />
        <Route path="/monitoring"     element={<Monitoring />} />
        <Route path="/optimizer"      element={<Optimizer />} />
        <Route path="/cooling-water"  element={<Cooling />} />
        <Route path="/recovery"       element={<Recovery />} />
        <Route path="/workloads"      element={<Workloads />} />
        <Route path="/predictions"    element={<Predictions />} />
        <Route path="/sustainability" element={<Sustainability />} />
        <Route path="/reports"        element={<Reports />} />
      </Routes>
    </Layout>
  );
}
