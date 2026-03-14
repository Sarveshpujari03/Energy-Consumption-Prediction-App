import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Zap, TrendingUp, BarChart3, Wallet,
  ArrowRight, AlertTriangle, CheckCircle2,
  Calendar, TrendingDown, Minus, LineChart,
  BrainCircuit, Thermometer, Clock
} from "lucide-react";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [statsRes, historyRes, profileRes] = await Promise.allSettled([
        axios.get("http://localhost:5000/api/prediction/stats", { headers }),
        axios.get("http://localhost:5000/api/prediction/history", { headers }),
        axios.get("http://localhost:5000/api/profile/", { headers }),
      ]);
      if (statsRes.status === "fulfilled") setStats(statsRes.value.data);
      if (historyRes.status === "fulfilled") setHistory(historyRes.value.data?.predictions || []);
      if (profileRes.status === "fulfilled") setProfile(profileRes.value.data?.profile);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  const typeLabel = (type) => {
    const map = { full: "Full", quick: "Quick", budget: "Budget Check", seasonal: "Seasonal" };
    return map[type] || type || "Prediction";
  };

  const typeIcon = (type) => {
    const map = { full: BrainCircuit, quick: Zap, budget: Wallet, seasonal: Thermometer };
    return map[type] || LineChart;
  };

  const typeColor = (type) => {
    const map = {
      full: { text: "text-indigo-500", bg: "bg-indigo-50" },
      quick: { text: "text-amber-500", bg: "bg-amber-50" },
      budget: { text: "text-emerald-500", bg: "bg-emerald-50" },
      seasonal: { text: "text-rose-500", bg: "bg-rose-50" },
    };
    return map[type] || { text: "text-gray-500", bg: "bg-gray-100" };
  };

  const recent = history.slice(0, 5);

  const statCards = [
    {
      label: "Avg Daily Usage",
      value: stats?.avgDailyKwh != null ? `${Number(stats.avgDailyKwh).toFixed(1)} kWh` : "—",
      sub: "based on all predictions",
      icon: Zap,
      color: "text-indigo-500",
      bg: "bg-indigo-50",
    },
    {
      label: "Avg Monthly Cost",
      value: stats?.avgMonthlyCost != null ? `₹${Number(stats.avgMonthlyCost).toFixed(0)}` : "—",
      sub: "predicted monthly spend",
      icon: Wallet,
      color: "text-emerald-500",
      bg: "bg-emerald-50",
    },
    {
      label: "Total Predictions",
      value: stats?.totalPredictions != null ? stats.totalPredictions : "—",
      sub: "all time",
      icon: BarChart3,
      color: "text-violet-500",
      bg: "bg-violet-50",
    },
    {
      label: "Budget Exceeded",
      value: stats?.budgetExceededCount != null
        ? `${stats.budgetExceededCount} / ${stats.totalPredictions ?? "—"}`
        : "—",
      sub: "predictions over budget",
      icon: TrendingUp,
      color: "text-rose-500",
      bg: "bg-rose-50",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-indigo-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 h-full">

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">Your energy overview at a glance</p>
        </div>
        <button
          onClick={() => navigate("/predict")}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-xl transition-all duration-200 hover:-translate-y-px hover:shadow-lg hover:shadow-gray-900/20"
        >
          <Zap size={13} />
          New Prediction
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <div
            key={i}
            className="bg-white/70 backdrop-blur-sm border border-white/80 rounded-2xl p-5 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{card.label}</span>
              <div className={`w-8 h-8 ${card.bg} rounded-xl flex items-center justify-center`}>
                <card.icon size={15} className={card.color} />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 tracking-tight">{card.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{card.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-6 flex-1 min-h-0">

        <div className="flex-1 flex flex-col gap-4 min-w-0">

          {profile && (
            <div className="bg-white/70 backdrop-blur-sm border border-white/80 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-gray-800">Your Defaults</h2>
                <button
                  onClick={() => navigate("/profile")}
                  className="text-xs text-indigo-500 hover:text-indigo-600 font-semibold flex items-center gap-1 transition-colors"
                >
                  Edit <ArrowRight size={11} />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "Appliances", value: profile.defaultAppliances, unit: "devices", icon: Zap, color: "text-violet-500", bg: "bg-violet-50" },
                  { label: "Usage Hours", value: profile.defaultUsageHours, unit: "hrs/day", icon: Clock, color: "text-amber-500", bg: "bg-amber-50" },
                  { label: "Temperature", value: profile.defaultTemperature, unit: "°C", icon: Thermometer, color: "text-rose-500", bg: "bg-rose-50" },
                  { label: "Rate", value: profile.defaultPerUnitRate, unit: "₹/kWh", icon: Wallet, color: "text-emerald-500", bg: "bg-emerald-50" },
                ].map((d, i) => (
                  <div key={i} className="rounded-xl bg-gray-50/70 border border-gray-100 p-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className={`w-5 h-5 ${d.bg} rounded-md flex items-center justify-center`}>
                        <d.icon size={11} className={d.color} />
                      </div>
                      <span className="text-xs text-gray-400 font-medium">{d.label}</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">
                      {d.value != null ? d.value : "—"}
                      <span className="text-xs font-normal text-gray-400 ml-1">{d.unit}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex-1 bg-white/70 backdrop-blur-sm border border-white/80 rounded-2xl p-5 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center">
                  <BarChart3 size={14} className="text-gray-500" />
                </div>
                <h2 className="text-sm font-bold text-gray-800">Recent Predictions</h2>
              </div>
              <button
                onClick={() => navigate("/predict")}
                className="text-xs text-indigo-500 hover:text-indigo-600 font-semibold flex items-center gap-1 transition-colors"
              >
                View all <ArrowRight size={11} />
              </button>
            </div>

            {recent.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
                  <LineChart size={20} className="text-gray-300" />
                </div>
                <p className="text-sm font-semibold text-gray-400">No predictions yet</p>
                <p className="text-xs text-gray-300 mt-1 mb-4">Run your first prediction to see it here</p>
                <button
                  onClick={() => navigate("/predict")}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-xs font-semibold rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <Zap size={11} /> Get started
                </button>
              </div>
            ) : (
              <div className="space-y-2 overflow-y-auto flex-1">
                {recent.map((item, i) => {
                  const colors = typeColor(item.predictionType);
                  const Icon = typeIcon(item.predictionType);
                  const exceeded = item.budget_exceeded;
                  return (
                    <div
                      key={item._id || i}
                      className="flex items-center gap-4 p-3.5 rounded-xl bg-gray-50/60 border border-gray-100 hover:bg-white hover:border-gray-200 hover:shadow-sm transition-all duration-150"
                    >
                      <div className={`w-8 h-8 ${colors.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                        <Icon size={14} className={colors.text} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-gray-800">{typeLabel(item.predictionType)}</p>
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                            exceeded === false
                              ? "bg-emerald-50 text-emerald-600"
                              : exceeded
                                ? "bg-red-50 text-red-500"
                                : "bg-gray-100 text-gray-400"
                          }`}>
                            {exceeded === false ? "In budget" : exceeded ? "Over budget" : "No budget"}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {item.predicted_monthly_kwh != null ? `${Number(item.predicted_monthly_kwh).toFixed(1)} kWh` : "—"}
                          {item.predicted_monthly_kwh != null && item.predicted_monthly_cost != null && " · "}
                          {item.predicted_monthly_cost != null ? `₹${Number(item.predicted_monthly_cost).toFixed(0)}/mo` : ""}
                        </p>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <div className="flex items-center gap-1 justify-end">
                          {exceeded === false
                            ? <TrendingDown size={12} className="text-emerald-400" />
                            : exceeded
                              ? <TrendingUp size={12} className="text-red-400" />
                              : <Minus size={12} className="text-gray-300" />
                          }
                          <span className="text-xs font-bold text-gray-700">
                            {item.predicted_monthly_cost != null ? `₹${Number(item.predicted_monthly_cost).toFixed(0)}` : "—"}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1 justify-end">
                          <Calendar size={9} />
                          {formatDate(item.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="w-72 flex-shrink-0 flex flex-col gap-4">

          {stats?.budgetExceededCount != null && stats?.totalPredictions > 0 && (
            <div className="bg-white/70 backdrop-blur-sm border border-white/80 rounded-2xl p-5">
              <h2 className="text-sm font-bold text-gray-800 mb-4">Budget Health</h2>

              <div className={`rounded-xl border p-4 mb-3 flex items-center gap-3 ${
                stats.budgetExceededCount === 0
                  ? "bg-emerald-50 border-emerald-100"
                  : stats.budgetExceededCount / stats.totalPredictions > 0.5
                    ? "bg-red-50 border-red-100"
                    : "bg-amber-50 border-amber-100"
              }`}>
                {stats.budgetExceededCount === 0
                  ? <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" />
                  : <AlertTriangle size={18} className="text-amber-500 flex-shrink-0" />
                }
                <div>
                  <p className={`text-sm font-bold ${
                    stats.budgetExceededCount === 0 ? "text-emerald-700"
                      : stats.budgetExceededCount / stats.totalPredictions > 0.5 ? "text-red-700"
                        : "text-amber-700"
                  }`}>
                    {stats.budgetExceededCount === 0
                      ? "All within budget"
                      : `${stats.budgetExceededCount} over budget`}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">out of {stats.totalPredictions} predictions</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>In budget</span>
                  <span className="font-semibold text-gray-700">
                    {stats.totalPredictions - stats.budgetExceededCount} / {stats.totalPredictions}
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-400 to-green-400 rounded-full transition-all duration-500"
                    style={{ width: `${((stats.totalPredictions - stats.budgetExceededCount) / stats.totalPredictions) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 bg-white/70 backdrop-blur-sm border border-white/80 rounded-2xl p-5 flex flex-col">
            <h2 className="text-sm font-bold text-gray-800 mb-4">Energy Tips</h2>
            <div className="space-y-2.5 flex-1">
              {[
                { icon: Clock, color: "text-amber-500", bg: "bg-amber-50", title: "Shift peak usage", body: "Run heavy appliances before 6 PM or after 10 PM to avoid peak tariffs." },
                { icon: Thermometer, color: "text-rose-500", bg: "bg-rose-50", title: "AC sweet spot", body: "Set air conditioning to 24–26 °C — every degree lower adds ~6% to consumption." },
                { icon: Zap, color: "text-indigo-500", bg: "bg-indigo-50", title: "Idle power drain", body: "Devices on standby can account for up to 10% of your monthly bill." },
                { icon: BarChart3, color: "text-violet-500", bg: "bg-violet-50", title: "Track monthly", body: "Run a prediction each month to catch usage spikes before your bill arrives." },
              ].map((tip, i) => (
                <div key={i} className="flex gap-3 p-3 rounded-xl bg-gray-50/60 border border-gray-100">
                  <div className={`w-7 h-7 ${tip.bg} rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    <tip.icon size={13} className={tip.color} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-700">{tip.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{tip.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}