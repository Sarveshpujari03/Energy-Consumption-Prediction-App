import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  Zap, Thermometer, Droplets, Clock, DollarSign,
  Wallet, Home, LineChart, Sparkles, History,
  CheckCircle2, AlertTriangle, ChevronRight, ArrowRight,
  RotateCcw, TrendingUp, TrendingDown, Minus, Calendar,
  BrainCircuit
} from 'lucide-react';

const PREDICTION_TYPES = [
  {
    id: 'full',
    label: 'Full Prediction',
    icon: BrainCircuit,
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    activeRing: 'ring-indigo-400',
    desc: 'Complete forecast using all parameters',
    fields: ['appliancesCount', 'temperature', 'humidity', 'usageHours', 'perUnitRate', 'budget'],
  },
  {
    id: 'quick',
    label: 'Quick Predict',
    icon: Zap,
    color: 'text-amber-500',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    activeRing: 'ring-amber-400',
    desc: 'Fast estimate with core inputs only',
    fields: ['appliancesCount', 'temperature', 'perUnitRate'],
  },
  {
    id: 'budget',
    label: 'Budget Check',
    icon: Wallet,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    activeRing: 'ring-emerald-400',
    desc: 'Check if usage fits within your budget',
    fields: ['appliancesCount', 'usageHours', 'perUnitRate', 'budget'],
  },
  {
    id: 'seasonal',
    label: 'Seasonal',
    icon: Thermometer,
    color: 'text-rose-500',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-200',
    activeRing: 'ring-rose-400',
    desc: 'Factor in temperature & humidity patterns',
    fields: ['appliancesCount', 'temperature', 'humidity', 'usageHours', 'perUnitRate'],
  },
];

const ALL_FIELDS = [
  { name: 'appliancesCount', label: 'Appliances',      icon: Home,        color: 'text-violet-500', bgColor: 'bg-violet-50',  unit: 'devices', min: '1',  step: '1',   placeholder: 'Enter the number of Appliances',   profileKey: 'defaultAppliances' },
  { name: 'temperature',     label: 'Temperature',     icon: Thermometer, color: 'text-rose-500',   bgColor: 'bg-rose-50',    unit: '°C',      min: '15', max: '45', step: '0.1', placeholder: 'What is the expected temparature', profileKey: 'defaultTemperature' },
  { name: 'humidity',        label: 'Humidity',        icon: Droplets,    color: 'text-cyan-500',   bgColor: 'bg-cyan-50',    unit: '%',       min: '0',  max: '100', step: '1',  placeholder: 'What is the expected Humidity', profileKey: 'defaultHumidity' },
  { name: 'usageHours',      label: 'Usage Hours',     icon: Clock,       color: 'text-amber-500',  bgColor: 'bg-amber-50',   unit: 'hrs/day', min: '1',  max: '24', step: '0.5', placeholder: 'Avg daily usage hours',  profileKey: 'defaultUsageHours' },
  { name: 'perUnitRate',     label: 'Rate per Unit',   icon: DollarSign,  color: 'text-emerald-500',bgColor: 'bg-emerald-50', unit: '₹/kWh',   min: '0',  step: '0.1', placeholder: 'Enter the rate per unit', profileKey: 'defaultPerUnitRate' },
  { name: 'budget',          label: 'Monthly Budget',  icon: Wallet,      color: 'text-indigo-500', bgColor: 'bg-indigo-50',  unit: '₹',       min: '0',  step: '100', placeholder: 'Enter your allocated monthly budget', profileKey: null },
];

const emptyForm = { appliancesCount: '', temperature: '', humidity: '', usageHours: '', perUnitRate: '', budget: '' };

export default function PredictPage() {
  const [selectedType, setSelectedType] = useState('full');
  const [formData, setFormData] = useState(emptyForm);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [autofilled, setAutofilled] = useState(false);

  const activeType = PREDICTION_TYPES.find(t => t.id === selectedType);
  const visibleFields = ALL_FIELDS.filter(f => activeType.fields.includes(f.name));

  useEffect(() => {
    fetchProfile();
    fetchHistory();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/profile/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(res.data.profile);
    } catch {}
  };

  const fetchHistory = async () => {
    try {
      setHistoryLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/prediction/history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistory(res.data.predictions || []);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleAutofill = () => {
    if (!profile) return;
    const filled = { ...formData };
    ALL_FIELDS.forEach(f => {
      if (f.profileKey && profile[f.profileKey] !== undefined) {
        filled[f.name] = profile[f.profileKey].toString();
      }
    });
    setFormData(filled);
    setAutofilled(true);
    toast.success('Profile defaults loaded');
  };

  const handleReset = () => {
    setFormData(emptyForm);
    setResult(null);
    setAutofilled(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {};
      visibleFields.forEach(f => {
        payload[f.name] = parseFloat(formData[f.name]);
      });

      const endpointMap = {
        full:     '/api/prediction/predict',
        quick:    '/api/prediction/predictPublic',
        budget:   '/api/prediction/budgetCheck',
        seasonal: '/api/prediction/seasonal',
      };

      const res = await axios.post(
        `http://localhost:5000${endpointMap[selectedType]}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResult(res.data);
      toast.success('Prediction complete!');
      fetchHistory();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Prediction failed');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="flex flex-col gap-6 h-full">

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Energy Prediction</h1>
          <p className="text-sm text-gray-400 mt-0.5">Forecast your electricity consumption and costs</p>
        </div>
        <div className="flex items-center gap-2">
          {profile && (
            <button
              onClick={handleAutofill}
              className={`flex items-center gap-2 px-3.5 py-2 text-sm font-semibold rounded-xl border transition-all duration-200 ${
                autofilled
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Sparkles size={13} className={autofilled ? 'text-emerald-500' : 'text-gray-400'} />
              {autofilled ? 'Profile loaded' : 'Load from profile'}
            </button>
          )}
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-3.5 py-2 text-sm font-semibold rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 transition-all duration-200"
          >
            <RotateCcw size={13} />
            Reset
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {PREDICTION_TYPES.map(type => (
          <button
            key={type.id}
            onClick={() => { setSelectedType(type.id); setResult(null); }}
            className={`flex flex-col items-start gap-2 p-4 rounded-2xl border-2 text-left transition-all duration-200 ${
              selectedType === type.id
                ? `${type.bgColor} ${type.borderColor} ring-2 ${type.activeRing} ring-offset-1`
                : 'bg-white/70 border-gray-100 hover:border-gray-200 hover:bg-white'
            }`}
          >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              selectedType === type.id ? 'bg-white shadow-sm' : type.bgColor
            }`}>
              <type.icon size={15} className={type.color} />
            </div>
            <div>
              <p className={`text-sm font-bold leading-tight ${selectedType === type.id ? 'text-gray-900' : 'text-gray-700'}`}>
                {type.label}
              </p>
              <p className="text-xs text-gray-400 mt-0.5 leading-snug">{type.desc}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="flex gap-6 flex-1 min-h-0">

        <div className="flex-1 flex flex-col gap-4 min-w-0">
          <div className="bg-white/70 backdrop-blur-sm border border-white/80 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-5">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${activeType.bgColor}`}>
                <activeType.icon size={14} className={activeType.color} />
              </div>
              <h2 className="text-sm font-bold text-gray-800">{activeType.label} Parameters</h2>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {visibleFields.map(f => (
                  <div
                    key={f.name}
                    className="rounded-xl border border-gray-100 bg-gray-50/60 p-3.5 focus-within:bg-white focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all duration-200"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center ${f.bgColor}`}>
                          <f.icon size={11} className={f.color} />
                        </div>
                        <span className="text-xs font-semibold text-gray-500">{f.label}</span>
                      </div>
                      <span className="text-[10px] text-gray-400 bg-white border border-gray-100 px-1.5 py-0.5 rounded-md font-medium">{f.unit}</span>
                    </div>
                    <input
                      type="number"
                      value={formData[f.name]}
                      onChange={e => setFormData({ ...formData, [f.name]: e.target.value })}
                      min={f.min}
                      max={f.max}
                      step={f.step}
                      placeholder={f.placeholder}
                      required
                      className="w-full text-xl font-bold text-gray-900 bg-transparent outline-none placeholder-gray-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                ))}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-xl transition-all duration-200 hover:-translate-y-px hover:shadow-lg hover:shadow-gray-900/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Predicting...</span></>
                ) : (
                  <><span>Run Prediction</span><ArrowRight size={14} /></>
                )}
              </button>
            </form>
          </div>

          {result && (
            <div className="bg-white/70 backdrop-blur-sm border border-white/80 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <LineChart size={14} className="text-emerald-500" />
                </div>
                <h2 className="text-sm font-bold text-gray-800">Prediction Results</h2>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-3">
                {result.predicted_daily_kwh !== undefined && (
                  <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-4 text-center">
                    <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wide mb-1">Daily</p>
                    <p className="text-2xl font-bold text-indigo-700">{result.predicted_daily_kwh?.toFixed(2)}</p>
                    <p className="text-xs text-indigo-400 mt-0.5">kWh</p>
                  </div>
                )}
                {result.predicted_monthly_kwh !== undefined && (
                  <div className="rounded-xl bg-violet-50 border border-violet-100 p-4 text-center">
                    <p className="text-xs font-semibold text-violet-400 uppercase tracking-wide mb-1">Monthly</p>
                    <p className="text-2xl font-bold text-violet-700">{result.predicted_monthly_kwh?.toFixed(2)}</p>
                    <p className="text-xs text-violet-400 mt-0.5">kWh</p>
                  </div>
                )}
                {result.predicted_monthly_cost !== undefined && (
                  <div className="rounded-xl bg-amber-50 border border-amber-100 p-4 text-center">
                    <p className="text-xs font-semibold text-amber-400 uppercase tracking-wide mb-1">Cost</p>
                    <p className="text-2xl font-bold text-amber-700">₹{result.predicted_monthly_cost?.toFixed(0)}</p>
                    <p className="text-xs text-amber-400 mt-0.5">/ month</p>
                  </div>
                )}
              </div>

              {result.budget_exceeded !== undefined && (
                <div className={`rounded-xl border p-4 flex items-center justify-between ${
                  result.budget_exceeded
                    ? 'bg-red-50 border-red-100'
                    : 'bg-emerald-50 border-emerald-100'
                }`}>
                  <div className="flex items-center gap-3">
                    {result.budget_exceeded
                      ? <AlertTriangle size={18} className="text-red-500 flex-shrink-0" />
                      : <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" />
                    }
                    <div>
                      <p className={`text-sm font-bold ${result.budget_exceeded ? 'text-red-700' : 'text-emerald-700'}`}>
                        {result.budget_exceeded ? 'Over Budget' : 'Within Budget'}
                      </p>
                      {result.budget_exceeded && result.predicted_monthly_cost && formData.budget && (
                        <p className="text-xs text-red-500 mt-0.5">
                          Exceeds by ₹{(result.predicted_monthly_cost - parseFloat(formData.budget)).toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                  {formData.budget && (
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Budget</p>
                      <p className="text-sm font-bold text-gray-700">₹{parseFloat(formData.budget).toFixed(0)}</p>
                    </div>
                  )}
                </div>
              )}

              {result.recommendations && result.recommendations.length > 0 && (
                <div className="mt-3 rounded-xl bg-blue-50 border border-blue-100 p-4">
                  <p className="text-xs font-semibold text-blue-500 uppercase tracking-wide mb-2">Recommendations</p>
                  <ul className="space-y-1.5">
                    {result.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-blue-700">
                        <ChevronRight size={12} className="mt-0.5 flex-shrink-0 text-blue-400" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="w-80 flex-shrink-0 flex flex-col gap-4">
          <div className="bg-white/70 backdrop-blur-sm border border-white/80 rounded-2xl p-5 flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
                  <History size={14} className="text-gray-500" />
                </div>
                <h2 className="text-sm font-bold text-gray-800">Prediction History</h2>
              </div>
              <button
                onClick={fetchHistory}
                className="text-xs text-gray-400 hover:text-indigo-500 transition-colors"
              >
                <RotateCcw size={12} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
              {historyLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-5 h-5 border-2 border-gray-200 border-t-indigo-400 rounded-full animate-spin" />
                </div>
              ) : history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-10 h-10 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
                    <History size={18} className="text-gray-300" />
                  </div>
                  <p className="text-sm font-semibold text-gray-400">No predictions yet</p>
                  <p className="text-xs text-gray-300 mt-1">Run your first prediction above</p>
                </div>
              ) : (
                history.map((item, i) => {
                  const cost = item.predicted_monthly_cost;
                  const budget = item.budget;
                  const exceeded = item.budget_exceeded;
                  return (
                    <div
                      key={item._id || i}
                      className="rounded-xl border border-gray-100 bg-gray-50/60 p-3.5 hover:bg-white hover:border-gray-200 hover:shadow-sm transition-all duration-150"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-5 h-5 rounded-md flex items-center justify-center ${
                            exceeded === false ? 'bg-emerald-50' : exceeded ? 'bg-red-50' : 'bg-indigo-50'
                          }`}>
                            {exceeded === false
                              ? <TrendingDown size={11} className="text-emerald-500" />
                              : exceeded
                                ? <TrendingUp size={11} className="text-red-500" />
                                : <Minus size={11} className="text-indigo-400" />
                            }
                          </div>
                          <span className="text-xs font-semibold text-gray-700">
                            {item.predictionType || 'Prediction'}
                          </span>
                        </div>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                          exceeded === false
                            ? 'bg-emerald-50 text-emerald-600'
                            : exceeded
                              ? 'bg-red-50 text-red-600'
                              : 'bg-gray-100 text-gray-500'
                        }`}>
                          {exceeded === false ? 'In budget' : exceeded ? 'Over' : '—'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {cost !== undefined && (
                          <div>
                            <p className="text-[10px] text-gray-400">Monthly cost</p>
                            <p className="text-sm font-bold text-gray-800">₹{cost?.toFixed(0)}</p>
                          </div>
                        )}
                        {item.predicted_monthly_kwh !== undefined && (
                          <div>
                            <p className="text-[10px] text-gray-400">Monthly kWh</p>
                            <p className="text-sm font-bold text-gray-800">{item.predicted_monthly_kwh?.toFixed(1)}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1 mt-2">
                        <Calendar size={10} className="text-gray-300" />
                        <span className="text-[10px] text-gray-400">{formatDate(item.createdAt)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}