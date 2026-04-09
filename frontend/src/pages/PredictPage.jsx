import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  Zap, Thermometer, Droplets, DollarSign,
  Wallet, LineChart, Sparkles, History,
  ArrowRight, RotateCcw, BrainCircuit,
  Search, X, Trash2, Users, CheckCircle2,
  AlertTriangle, TrendingUp, TrendingDown,
  ChevronRight, Lock, Edit2, Calendar,
  Activity, BarChart3, Lightbulb, Clock,
  Home, Power, Cpu, Database, Settings,
  Sun, Moon, CloudRain, Wind, Loader2,
  Minimize2, Maximize2, Grid3x3, List,
  TrendingUp as TrendingUpIcon, Award, Shield,
  Hash, Plug, Save, Eye, EyeOff
} from 'lucide-react';

const APPLIANCES_DB = [
  { name: 'LED Bulb (9W)', category: 'Lighting', wattage: 9, typicalHH: 1 },
  { name: 'CFL Bulb (15W)', category: 'Lighting', wattage: 15, typicalHH: 1 },
  { name: 'Tube Light (36W)', category: 'Lighting', wattage: 36, typicalHH: 0.5 },
  { name: 'Ceiling Fan', category: 'Fans', wattage: 75, typicalHH: 1 },
  { name: 'Table Fan', category: 'Fans', wattage: 50, typicalHH: 0.5 },
  { name: 'Exhaust Fan', category: 'Fans', wattage: 25, typicalHH: 0.3 },
  { name: 'AC (1 Ton)', category: 'Cooling', wattage: 1000, typicalHH: 0.3 },
  { name: 'AC (1.5 Ton)', category: 'Cooling', wattage: 1500, typicalHH: 0.2 },
  { name: 'Desert Cooler', category: 'Cooling', wattage: 200, typicalHH: 0.4 },
  { name: 'Refrigerator (200L)', category: 'Kitchen', wattage: 150, typicalHH: 1 },
  { name: 'Refrigerator (400L)', category: 'Kitchen', wattage: 250, typicalHH: 0.8 },
  { name: 'Microwave', category: 'Kitchen', wattage: 800, typicalHH: 0.6 },
  { name: 'Induction Stove', category: 'Kitchen', wattage: 1800, typicalHH: 0.7 },
  { name: 'Mixer Grinder', category: 'Kitchen', wattage: 500, typicalHH: 0.5 },
  { name: 'Water Heater/Geyser', category: 'Heating', wattage: 2000, typicalHH: 0.4 },
  { name: 'Washing Machine', category: 'Laundry', wattage: 400, typicalHH: 0.6 },
  { name: 'Iron', category: 'Laundry', wattage: 1000, typicalHH: 0.3 },
  { name: 'TV (32 inch)', category: 'Entertainment', wattage: 60, typicalHH: 0.8 },
  { name: 'TV (43 inch)', category: 'Entertainment', wattage: 80, typicalHH: 0.6 },
  { name: 'Laptop', category: 'Electronics', wattage: 65, typicalHH: 1 },
  { name: 'Desktop PC', category: 'Electronics', wattage: 300, typicalHH: 0.3 },
  { name: 'Mobile Charger', category: 'Electronics', wattage: 10, typicalHH: 2 },
];

const PREDICTION_TYPES = [
  {
    id: 'full',
    label: 'Full Prediction',
    icon: BrainCircuit,
    desc: 'Complete ML forecast',
    endpoint: '/api/prediction/predict',
    fields: ['householdSize', 'temperature', 'humidity', 'perUnitRate', 'budget'],
  },
  {
    id: 'quick',
    label: 'Quick Predict',
    icon: Zap,
    desc: 'Fast appliance estimate',
    endpoint: '/api/prediction/predict',
    fields: ['householdSize', 'perUnitRate'],
  },
  {
    id: 'budget',
    label: 'Budget Check',
    icon: Wallet,
    desc: 'Budget vs consumption',
    endpoint: '/api/prediction/budgetCheck',
    fields: ['householdSize', 'perUnitRate', 'budget'],
  },
  {
    id: 'seasonal',
    label: 'Seasonal',
    icon: Thermometer,
    desc: 'Weather-adjusted',
    endpoint: '/api/prediction/seasonal',
    fields: ['householdSize', 'temperature', 'humidity', 'perUnitRate'],
  },
];

const ALL_FIELDS = [
  { name: 'householdSize', label: 'Household', icon: Users, unit: 'people', min: '1', max: '10', step: '1', placeholder: '4', profileKey: 'HouseholdSize' },
  { name: 'temperature', label: 'Temp', icon: Thermometer, unit: '°C', min: '15', max: '45', step: '0.1', placeholder: '25', profileKey: 'DefaultTemperature' },
  { name: 'humidity', label: 'Humidity', icon: Droplets, unit: '%', min: '0', max: '100', step: '1', placeholder: '60', profileKey: 'DefaultHumidity' },
  { name: 'perUnitRate', label: 'Rate', icon: DollarSign, unit: '₹/kWh', min: '0', step: '0.1', placeholder: '7.5', profileKey: 'DefaultPerUnitRate' },
  { name: 'budget', label: 'Budget', icon: Wallet, unit: '₹', min: '0', step: '100', placeholder: '2000', profileKey: null },
];

const emptyForm = { householdSize: '', temperature: '', humidity: '', perUnitRate: '', budget: '' };

export default function PredictPage() {
  const [selectedType, setSelectedType] = useState('full');
  const [formData, setFormData] = useState(emptyForm);
  const [appliancesList, setAppliancesList] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
  const [compactView, setCompactView] = useState(false);
  const [showResults, setShowResults] = useState(true);
  const searchRef = useRef(null);

  const activeType = PREDICTION_TYPES.find(t => t.id === selectedType);
  const visibleFields = ALL_FIELDS.filter(f => activeType.fields.includes(f.name));

  useEffect(() => {
    fetchProfile();
    fetchHistory();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/profile/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const profileData = res.data.profile;
      setProfile(profileData);
      
      if (profileData) {
        const filled = { ...emptyForm };
        ALL_FIELDS.forEach(f => {
          if (f.profileKey && profileData[f.profileKey] !== undefined && profileData[f.profileKey] !== null) {
            filled[f.name] = profileData[f.profileKey].toString();
          }
        });
        setFormData(filled);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  const fetchHistory = async () => {
    try {
      setHistoryLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/prediction/history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const predictions = res.data.predictions || [];
      const formattedPredictions = predictions.map(p => ({
        ...p,
        recommendations: p.RecommendationsJson ? JSON.parse(p.RecommendationsJson) : p.Recommendations || []
      }));
      setHistory(formattedPredictions);
    } catch (error) {
      console.error('Failed to fetch history:', error);
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleLoadFromProfile = async () => {
    if (!profile) {
      toast.error('No profile data found');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const appliancesRes = await axios.get('http://localhost:5000/api/profile/appliances', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const profileAppliances = appliancesRes.data.map(app => ({
        name: app.ApplianceName,
        category: getCategoryFromName(app.ApplianceName),
        wattage: app.Watts,
        quantity: app.Quantity,
        hours: app.UsageHours,
        fromProfile: true,
        id: app.Id
      }));

      const filled = { ...emptyForm };
      ALL_FIELDS.forEach(f => {
        if (f.profileKey && profile[f.profileKey] !== undefined && profile[f.profileKey] !== null) {
          filled[f.name] = profile[f.profileKey].toString();
        }
      });

      if (!filled.householdSize && profileAppliances.length > 0) {
        const estimatedHH = Math.max(1, Math.round(
          profileAppliances.reduce((sum, a) => sum + (a.typicalHH || 0.5) * (a.quantity || 1), 1)
        ));
        filled.householdSize = estimatedHH.toString();
      }

      setFormData(filled);
      setAppliancesList(profileAppliances);
      setProfileLoaded(true);
      toast.success(`Loaded ${profileAppliances.length} appliances and profile settings`);
    } catch (error) {
      console.error('Failed to load appliances:', error);
      toast.error(error.response?.data?.error || 'Failed to load profile appliances');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryFromName = (name) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('fan')) return 'Fans';
    if (lowerName.includes('light') || lowerName.includes('bulb')) return 'Lighting';
    if (lowerName.includes('ac') || lowerName.includes('cooler')) return 'Cooling';
    if (lowerName.includes('fridge') || lowerName.includes('refrigerator')) return 'Kitchen';
    if (lowerName.includes('heater') || lowerName.includes('geyser')) return 'Heating';
    if (lowerName.includes('washer') || lowerName.includes('iron')) return 'Laundry';
    if (lowerName.includes('tv') || lowerName.includes('laptop') || lowerName.includes('computer')) return 'Electronics';
    if (lowerName.includes('microwave') || lowerName.includes('stove') || lowerName.includes('grinder')) return 'Kitchen';
    return 'Other';
  };

  const handleReset = () => {
    if (profile) {
      const filled = { ...emptyForm };
      ALL_FIELDS.forEach(f => {
        if (f.profileKey && profile[f.profileKey] !== undefined && profile[f.profileKey] !== null) {
          filled[f.name] = profile[f.profileKey].toString();
        }
      });
      setFormData(filled);
    } else {
      setFormData(emptyForm);
    }
    setAppliancesList([]);
    setResult(null);
    setProfileLoaded(false);
    setSearchTerm('');
    setSearchOpen(false);
    setSelectedHistoryItem(null);
    toast.success('Reset to profile defaults');
  };

  const addApplianceFromSearch = (app) => {
    setAppliancesList(prev => [...prev, { 
      ...app, 
      quantity: 1, 
      hours: app.typicalHH || 4, 
      fromProfile: false 
    }]);
    setSearchTerm('');
    setSearchOpen(false);
  };

  const updateApplianceField = (index, field, value) => {
    setAppliancesList(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: parseFloat(value) || 0 };
      return next;
    });
  };

  const removeAppliance = (index) => {
    setAppliancesList(prev => prev.filter((_, i) => i !== index));
  };

  const getTotalCount = () => appliancesList.reduce((s, a) => s + (a.quantity || 0), 0);
  const getTotalDailyKwh = () =>
    appliancesList.reduce((s, a) => s + ((a.wattage || 0) * (a.quantity || 0) * (a.hours || 0)) / 1000, 0);

  const isFieldLocked = (fieldName) => profileLoaded && fieldName !== 'budget';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (appliancesList.length === 0) { 
      toast.error('Add at least one appliance'); 
      return; 
    }
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        appliancesList: appliancesList.map(a => ({
          name: a.name, 
          wattage: a.wattage, 
          quantity: a.quantity, 
          hours: a.hours, 
          category: a.category
        })),
        totalAppliances: getTotalCount(),
        estimatedDailyKwh: getTotalDailyKwh(),
        householdSize: parseInt(formData.householdSize) || 4,
      };
      
      visibleFields.forEach(f => {
        if (formData[f.name] !== '' && formData[f.name] !== null && formData[f.name] !== undefined) {
          payload[f.name] = parseFloat(formData[f.name]);
        }
      });
      
      const res = await axios.post(
        `http://localhost:5000${activeType.endpoint}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setResult(res.data);
      setSelectedHistoryItem(null);
      toast.success('Prediction complete');
      fetchHistory();
    } catch (error) {
      console.error('Prediction error:', error);
      toast.error(error.response?.data?.error || 'Prediction failed');
    } finally {
      setLoading(false);
    }
  };

  const filteredAppliances = APPLIANCES_DB.filter(a =>
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const formatCurrency = (val) => val != null && !isNaN(val) ? `₹${Number(val).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '—';
  const formatNumber = (val) => val != null && !isNaN(val) ? Number(val).toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '—';

  const loadHistoryItem = (item) => {
    setSelectedHistoryItem(item);
    setResult(null);
  };

  const getBudgetStatus = (predictedMonthlyCost, budget) => {
    if (!budget || !predictedMonthlyCost) return null;
    const pct = (predictedMonthlyCost / budget) * 100;
    if (pct > 100) return { color: 'text-red-600', bg: 'bg-red-50', label: 'Over Budget', icon: AlertTriangle };
    if (pct > 80) return { color: 'text-amber-600', bg: 'bg-amber-50', label: 'Near Limit', icon: TrendingUp };
    return { color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Within Budget', icon: CheckCircle2 };
  };

  const displayData = selectedHistoryItem || result;

  return (
    <div className="h-full bg-gray-50 font-sans overflow-hidden">
      <div className="flex h-full">
        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Compact Header */}
          <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h1 className="text-base font-semibold text-gray-800">EnerLytics</h1>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowResults(!showResults)}
                  className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
                  title={showResults ? "Hide results" : "Show results"}
                >
                  {showResults ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                <button
                  onClick={() => setCompactView(!compactView)}
                  className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
                  title={compactView ? "Expanded view" : "Compact view"}
                >
                  {compactView ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
                </button>
              </div>
            </div>
          </div>

          <div className={`p-4 space-y-4 ${compactView ? 'max-w-6xl mx-auto' : ''}`}>
            {/* Prediction Type Tabs - Modern */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
              {PREDICTION_TYPES.map(type => (
                <button
                  key={type.id}
                  onClick={() => { setSelectedType(type.id); setResult(null); setSelectedHistoryItem(null); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    selectedType === type.id
                      ? 'bg-white shadow-sm text-gray-900'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <type.icon size={12} />
                  <span>{type.label}</span>
                </button>
              ))}
            </div>

            {/* Two Column Layout for Appliances and Parameters */}
            <div className="grid grid-cols-2 gap-4">
              {/* Appliances Section */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <Power size={12} className="text-gray-400" />
                    <span className="text-xs font-medium text-gray-600">Appliances</span>
                    {appliancesList.length > 0 && (
                      <span className="text-xs text-gray-400">
                        {getTotalCount()} units · {getTotalDailyKwh().toFixed(1)} kWh/day
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {profile && (
                      <button
                        onClick={handleLoadFromProfile}
                        disabled={loading}
                        className={`text-xs px-2 py-1 rounded-md transition-colors ${
                          profileLoaded
                            ? 'bg-blue-50 text-blue-600'
                            : 'text-gray-500 hover:bg-gray-100'
                        }`}
                      >
                        {loading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                        <span className="ml-1">Profile</span>
                      </button>
                    )}
                    <button
                      onClick={handleReset}
                      className="text-xs text-gray-500 hover:bg-gray-100 px-2 py-1 rounded-md transition-colors"
                    >
                      <RotateCcw size={12} />
                      <span className="ml-1">Reset</span>
                    </button>
                  </div>
                </div>

                {/* Appliance List - Compact Table */}
                {appliancesList.length > 0 ? (
                  <div className="overflow-x-auto max-h-64 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr className="border-b border-gray-100">
                          <th className="text-left font-medium text-gray-500 px-3 py-2">Device</th>
                          <th className="text-right font-medium text-gray-500 px-2 py-2">W</th>
                          <th className="text-right font-medium text-gray-500 px-2 py-2">Qty</th>
                          <th className="text-right font-medium text-gray-500 px-2 py-2">Hrs</th>
                          <th className="text-right font-medium text-gray-500 px-3 py-2">kWh</th>
                          <th className="w-6 px-1 py-2"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {appliancesList.map((app, index) => {
                          const kwh = (app.wattage * app.quantity * app.hours) / 1000;
                          return (
                            <tr key={index} className="border-b border-gray-50 hover:bg-gray-50">
                              <td className="px-3 py-2">
                                <div className="flex items-center gap-1.5">
                                  {app.fromProfile && (
                                    <span className="text-[10px] bg-blue-50 text-blue-500 px-1 rounded">P</span>
                                  )}
                                  <span className="font-medium text-gray-700 truncate max-w-[120px]">{app.name}</span>
                                </div>
                              </td>
                              <td className="px-2 py-2 text-right">
                                <input
                                  type="number"
                                  value={app.wattage}
                                  onChange={(e) => updateApplianceField(index, 'wattage', e.target.value)}
                                  className="w-14 text-right bg-transparent border border-gray-200 rounded px-1 py-0.5 text-xs focus:border-gray-400 focus:outline-none"
                                />
                              </td>
                              <td className="px-2 py-2 text-right">
                                <input
                                  type="number"
                                  value={app.quantity}
                                  onChange={(e) => updateApplianceField(index, 'quantity', e.target.value)}
                                  className="w-12 text-right bg-transparent border border-gray-200 rounded px-1 py-0.5 text-xs focus:border-gray-400 focus:outline-none"
                                />
                              </td>
                              <td className="px-2 py-2 text-right">
                                <input
                                  type="number"
                                  value={app.hours}
                                  onChange={(e) => updateApplianceField(index, 'hours', e.target.value)}
                                  step="0.5"
                                  className="w-12 text-right bg-transparent border border-gray-200 rounded px-1 py-0.5 text-xs focus:border-gray-400 focus:outline-none"
                                />
                              </td>
                              <td className="px-3 py-2 text-right font-mono text-gray-600">{kwh.toFixed(2)}</td>
                              <td className="px-1 py-2 text-center">
                                <button onClick={() => removeAppliance(index)} className="text-gray-300 hover:text-red-500">
                                  <Trash2 size={12} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-8 text-center border-b border-gray-100">
                    <Database size={24} className="mx-auto text-gray-300 mb-1" />
                    <p className="text-xs text-gray-400">No appliances added</p>
                  </div>
                )}

                {/* Search */}
                <div className="p-2 border-t border-gray-100" ref={searchRef}>
                  <div className="relative">
                    <div className="flex items-center gap-1.5 bg-gray-50 rounded-md px-2 py-1.5 border border-gray-200 focus-within:border-gray-400">
                      <Search size={12} className="text-gray-400" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setSearchOpen(true); }}
                        onFocus={() => setSearchOpen(true)}
                        placeholder="Search appliances..."
                        className="flex-1 text-xs bg-transparent outline-none text-gray-700 placeholder-gray-400"
                      />
                      {searchTerm && (
                        <button onClick={() => setSearchTerm('')} className="text-gray-400 hover:text-gray-600">
                          <X size={10} />
                        </button>
                      )}
                    </div>
                    {searchOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-20 max-h-48 overflow-y-auto">
                        {(searchTerm ? filteredAppliances : APPLIANCES_DB).slice(0, 8).map((app, i) => (
                          <button
                            key={i}
                            onMouseDown={() => addApplianceFromSearch(app)}
                            className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-gray-50 border-b border-gray-100 last:border-0 text-left"
                          >
                            <div>
                              <span className="text-xs text-gray-700">{app.name}</span>
                              <span className="text-[10px] text-gray-400 ml-1.5">{app.category}</span>
                            </div>
                            <span className="text-[10px] font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{app.wattage}W</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Parameters Section */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <Settings size={12} className="text-gray-400" />
                    <span className="text-xs font-medium text-gray-600">Parameters</span>
                    {profileLoaded && (
                      <span className="text-[10px] text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <Lock size={8} /> Locked
                      </span>
                    )}
                    {profile && !profileLoaded && (
                      <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                        Profile values available
                      </span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 divide-x divide-gray-100">
                  {visibleFields.map((f, idx) => {
                    const locked = isFieldLocked(f.name);
                    return (
                      <div key={f.name} className={`p-2.5 ${locked ? 'bg-gray-50' : ''}`}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1">
                            <f.icon size={10} className={locked ? 'text-blue-400' : 'text-gray-400'} />
                            <span className={`text-[10px] font-medium ${locked ? 'text-blue-500' : 'text-gray-500'}`}>
                              {f.label}
                            </span>
                          </div>
                          <span className="text-[9px] text-gray-400">{f.unit}</span>
                        </div>
                        <input
                          type="number"
                          value={formData[f.name] || ''}
                          onChange={e => !locked && setFormData({ ...formData, [f.name]: e.target.value })}
                          readOnly={locked}
                          min={f.min} max={f.max} step={f.step}
                          placeholder={f.placeholder}
                          className={`w-full text-base font-semibold bg-transparent outline-none placeholder-gray-200 ${
                            locked ? 'text-blue-600' : 'text-gray-800'
                          }`}
                        />
                        {f.name === 'householdSize' && profile && !profileLoaded && (
                          <p className="text-[9px] text-gray-400 mt-0.5">
                            Profile: {profile.HouseholdSize || 'Not set'}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="p-2 border-t border-gray-100 bg-gray-50">
                  <button
                    onClick={handleSubmit}
                    disabled={loading || appliancesList.length === 0}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-gray-800 text-white text-xs font-medium rounded-md hover:bg-gray-700 transition-all disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <BrainCircuit size={12} />
                    )}
                    {loading ? 'Processing...' : `Generate ${activeType.label}`}
                    {!loading && <ArrowRight size={12} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Results Section - Collapsible */}
            {showResults && (result || selectedHistoryItem) && (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BarChart3 size={12} className="text-gray-400" />
                      <span className="text-xs font-medium text-gray-600">
                        {selectedHistoryItem ? 'Historical Analysis' : 'Prediction Results'}
                      </span>
                    </div>
                    {selectedHistoryItem && (
                      <button onClick={() => setSelectedHistoryItem(null)} className="text-[10px] text-gray-400 hover:text-gray-600">
                        View Current →
                      </button>
                    )}
                  </div>
                </div>

                {(() => {
                  const predictedMonthlyCost = displayData?.predicted_monthly_cost || displayData?.PredictedMonthlyCost;
                  const predictedMonthlyKwh = displayData?.predicted_monthly_kwh || displayData?.PredictedMonthlyKwh;
                  const predictedDailyKwh = displayData?.predicted_daily_kwh || displayData?.PredictedDailyKwh;
                  const budget = selectedHistoryItem ? displayData?.Budget : parseFloat(formData.budget);
                  const recommendations = displayData?.recommendations || [];
                  const inputSummary = displayData?.input_summary;
                  const perUnitRate = displayData?.per_unit_rate || displayData?.PerUnitRate;
                  const householdSize = displayData?.householdSize || displayData?.HouseholdSize || formData.householdSize;
                  const budgetExceeded = displayData?.budget_exceeded || displayData?.BudgetExceeded;
                  const budgetStatus = getBudgetStatus(predictedMonthlyCost, budget);

                  return (
                    <>
                      {/* Key Metrics Grid */}
                      <div className="grid grid-cols-4 divide-x divide-gray-100">
                        <div className="px-3 py-2.5 text-center">
                          <p className="text-[10px] font-medium text-gray-400 uppercase">Monthly Cost</p>
                          <p className="text-base font-bold text-gray-800">{formatCurrency(predictedMonthlyCost)}</p>
                          <p className="text-[9px] text-gray-400">@{formatCurrency(perUnitRate)}/kWh</p>
                        </div>
                        <div className="px-3 py-2.5 text-center">
                          <p className="text-[10px] font-medium text-gray-400 uppercase">Consumption</p>
                          <p className="text-base font-bold text-gray-800">{formatNumber(predictedMonthlyKwh)} <span className="text-xs font-normal text-gray-400">kWh</span></p>
                          <p className="text-[9px] text-gray-400">{formatNumber(predictedDailyKwh)} kWh/day</p>
                        </div>
                        <div className="px-3 py-2.5 text-center">
                          <p className="text-[10px] font-medium text-gray-400 uppercase">Daily Avg</p>
                          <p className="text-base font-bold text-gray-800">{formatCurrency(predictedMonthlyCost / 30)}</p>
                          <p className="text-[9px] text-gray-400">Per day estimate</p>
                        </div>
                        <div className="px-3 py-2.5 text-center">
                          <p className="text-[10px] font-medium text-gray-400 uppercase">Household</p>
                          <p className="text-base font-bold text-gray-800">{householdSize || '—'}</p>
                          <p className="text-[9px] text-gray-400">Family members</p>
                        </div>
                      </div>

                      {/* Budget Status Bar */}
                      {budget && predictedMonthlyCost && (
                        <div className={`mx-3 mb-3 p-2.5 rounded-md ${budgetStatus?.bg || 'bg-gray-50'}`}>
                          <div className="flex items-center justify-between text-[10px] mb-1.5">
                            <div className="flex items-center gap-1.5">
                              {budgetStatus && <budgetStatus.icon size={10} className={budgetStatus.color} />}
                              <span className={`font-medium ${budgetStatus?.color || 'text-gray-600'}`}>
                                {budgetStatus?.label || 'Budget Status'}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-gray-500">Budget: {formatCurrency(budget)}</span>
                              <span className={`font-medium ${budgetExceeded ? 'text-red-500' : predictedMonthlyCost > budget * 0.8 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                {formatCurrency(predictedMonthlyCost)} spent
                              </span>
                            </div>
                          </div>
                          <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${budgetExceeded ? 'bg-red-500' : predictedMonthlyCost > budget * 0.8 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                              style={{ width: `${Math.min((predictedMonthlyCost / budget) * 100, 100)}%` }}
                            />
                          </div>
                          {budgetExceeded && displayData?.savings_needed_kwh && (
                            <p className="text-[9px] text-red-500 mt-1.5 flex items-center gap-1">
                              <AlertTriangle size={9} />
                              Need to reduce {formatNumber(displayData.savings_needed_kwh)} kWh/month
                            </p>
                          )}
                        </div>
                      )}

                      {/* Input Analysis */}
                      {inputSummary && (
                        <div className="px-3 pb-2">
                          <p className="text-[9px] font-medium text-gray-400 uppercase mb-1.5">Input Analysis</p>
                          <div className="grid grid-cols-4 gap-2">
                            <div className="p-1.5 bg-gray-50 rounded text-center">
                              <p className="text-[9px] text-gray-400">Appliances</p>
                              <p className="text-xs font-bold text-gray-700">{inputSummary.total_appliance_count || inputSummary.AppliancesCount}</p>
                            </div>
                            <div className="p-1.5 bg-gray-50 rounded text-center">
                              <p className="text-[9px] text-gray-400">Load (W)</p>
                              <p className="text-xs font-bold text-gray-700">{formatNumber(inputSummary.estimated_connected_load_watts)}</p>
                            </div>
                            <div className="p-1.5 bg-gray-50 rounded text-center">
                              <p className="text-[9px] text-gray-400">Appliance kWh</p>
                              <p className="text-xs font-bold text-gray-700">{formatNumber(inputSummary.appliance_based_daily_kwh)}</p>
                            </div>
                            <div className="p-1.5 bg-gray-50 rounded text-center">
                              <p className="text-[9px] text-gray-400">ML kWh</p>
                              <p className="text-xs font-bold text-gray-700">{formatNumber(inputSummary.model_based_daily_kwh)}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Recommendations */}
                      {recommendations.length > 0 && (
                        <div className="border-t border-gray-100 px-3 py-2 mt-2">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <Lightbulb size={10} className="text-amber-400" />
                            <span className="text-[9px] font-medium text-gray-500 uppercase">AI Recommendations</span>
                          </div>
                          <div className="space-y-1">
                            {recommendations.slice(0, 2).map((rec, i) => (
                              <div key={i} className="flex items-start gap-1.5 text-[10px] text-gray-600">
                                <ChevronRight size={9} className="text-amber-400 flex-shrink-0 mt-0.5" />
                                <span>{rec}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Timestamp for history items */}
                      {selectedHistoryItem && (
                        <div className="border-t border-gray-100 px-3 py-1.5 flex items-center gap-2 text-[9px] text-gray-400">
                          <Calendar size={9} />
                          <span>Generated on {formatDate(selectedHistoryItem.CreatedAt)}</span>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </div>

        {/* History Sidebar - Compact */}
        <div className="w-64 flex-shrink-0 border-l border-gray-200 bg-white flex flex-col">
          <div className="px-3 py-2.5 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-1.5">
              <History size={12} className="text-gray-400" />
              <span className="text-xs font-medium text-gray-600">Prediction History</span>
              <span className="text-[10px] text-gray-400 ml-auto">{history.length}</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {historyLoading ? (
              <div className="p-6 text-center">
                <Loader2 size={20} className="mx-auto text-gray-300 animate-spin" />
              </div>
            ) : history.length === 0 ? (
              <div className="p-6 text-center">
                <Database size={20} className="mx-auto text-gray-200 mb-2" />
                <p className="text-[11px] text-gray-400">No predictions yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {history.map((pred, i) => {
                  const cost = pred.PredictedMonthlyCost;
                  const isSelected = selectedHistoryItem?.Id === pred.Id;
                  return (
                    <button
                      key={i}
                      onClick={() => loadHistoryItem(pred)}
                      className={`w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50 border-l-2 border-blue-400' : ''}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-800">{formatCurrency(cost)}</p>
                          <p className="text-[10px] text-gray-400">{formatNumber(pred.PredictedMonthlyKwh)} kWh/mo</p>
                          <p className="text-[9px] text-gray-300 mt-0.5 truncate">{formatDate(pred.CreatedAt)}</p>
                        </div>
                        {pred.BudgetExceeded ? (
                          <AlertTriangle size={10} className="text-red-400 flex-shrink-0" />
                        ) : (
                          <CheckCircle2 size={10} className="text-emerald-400 flex-shrink-0" />
                        )}
                      </div>
                      {pred.recommendations && pred.recommendations.length > 0 && (
                        <p className="text-[9px] text-gray-400 mt-1 truncate">
                          {pred.recommendations[0].substring(0, 50)}...
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}