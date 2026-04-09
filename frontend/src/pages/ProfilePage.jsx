import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  User, Home, Thermometer, Droplets, DollarSign, Save,
  Plus, Trash2, Plug, Mail, ShieldCheck, Search, AlertCircle,
  Zap, Clock, Hash
} from 'lucide-react';

const APPLIANCE_DB = [
  { name: 'LED Bulb', watts: 10, category: 'Lighting' },
  { name: 'Ceiling Fan', watts: 75, category: 'Cooling' },
  { name: 'Table Fan', watts: 50, category: 'Cooling' },
  { name: 'Air Conditioner (1 Ton)', watts: 1000, category: 'Cooling' },
  { name: 'Air Conditioner (1.5 Ton)', watts: 1500, category: 'Cooling' },
  { name: 'Refrigerator (Single Door)', watts: 150, category: 'Kitchen' },
  { name: 'Refrigerator (Double Door)', watts: 200, category: 'Kitchen' },
  { name: 'Washing Machine', watts: 400, category: 'Laundry' },
  { name: 'Television (32")', watts: 60, category: 'Entertainment' },
  { name: 'Television (43")', watts: 80, category: 'Entertainment' },
  { name: 'Laptop', watts: 65, category: 'Electronics' },
  { name: 'Desktop PC', watts: 300, category: 'Electronics' },
  { name: 'Water Heater/Geyser', watts: 2000, category: 'Heating' },
  { name: 'Microwave Oven', watts: 800, category: 'Kitchen' },
  { name: 'Induction Stove', watts: 1800, category: 'Kitchen' },
  { name: 'Iron', watts: 1000, category: 'Household' },
  { name: 'Mixie/Blender', watts: 500, category: 'Kitchen' },
  { name: 'Room Heater', watts: 1500, category: 'Heating' },
  { name: 'Aquaguard/Water Purifier', watts: 60, category: 'Water Purifier' },
  { name: 'Exhaust Fan', watts: 30, category: 'Ventilation' },
];

const EMPTY_APPLIANCE = { name: '', quantity: '', usageHours: '', watts: '' };

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const [formData, setFormData] = useState({
    householdSize: '',
    defaultTemperature: '',
    defaultHumidity: '',
    defaultPerUnitRate: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [savedFormData, setSavedFormData] = useState(null);

  const [appliances, setAppliances] = useState([]);
  const [savedAppliances, setSavedAppliances] = useState([]);

  const [applianceForm, setApplianceForm] = useState(EMPTY_APPLIANCE);
  const [applianceErrors, setApplianceErrors] = useState({});
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef(null);
  const quantityRef = useRef(null);

  const searchResults = search.trim()
    ? APPLIANCE_DB.filter(a =>
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.category.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 7)
    : APPLIANCE_DB.slice(0, 7);

  useEffect(() => { fetchProfile(); }, []);

  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!savedFormData) return;
    const formChanged = JSON.stringify(formData) !== JSON.stringify(savedFormData);
    const appsChanged = JSON.stringify(appliances) !== JSON.stringify(savedAppliances);
    setIsDirty(formChanged || appsChanged);
  }, [formData, appliances, savedFormData, savedAppliances]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/profile/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data.user);
      setProfile(res.data.profile);
      const normalized = (res.data.appliances || []).map(a => ({
        applianceName: a.ApplianceName || a.applianceName,
        quantity: a.Quantity ?? a.quantity,
        usageHours: a.UsageHours ?? a.usageHours,
        watts: a.Watts ?? a.watts ?? null,
      }));
      setAppliances(normalized);
      setSavedAppliances(normalized);
      if (res.data.profile) {
        const data = {
          householdSize: res.data.profile.HouseholdSize?.toString() || '',
          defaultTemperature: res.data.profile.DefaultTemperature?.toString() || '',
          defaultHumidity: res.data.profile.DefaultHumidity?.toString() || '',
          defaultPerUnitRate: res.data.profile.DefaultPerUnitRate?.toString() || '',
        };
        setFormData(data);
        setSavedFormData(data);
      } else {
        const empty = { householdSize: '', defaultTemperature: '', defaultHumidity: '', defaultPerUnitRate: '' };
        setFormData(empty);
        setSavedFormData(empty);
      }
    } catch {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.householdSize || parseInt(formData.householdSize) < 1) errs.householdSize = 'Required';
    if (!formData.defaultTemperature) errs.defaultTemperature = 'Required';
    if (!formData.defaultHumidity || parseFloat(formData.defaultHumidity) < 0 || parseFloat(formData.defaultHumidity) > 100) errs.defaultHumidity = '0–100';
    if (!formData.defaultPerUnitRate || parseFloat(formData.defaultPerUnitRate) <= 0) errs.defaultPerUnitRate = 'Required';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) { toast.error('Fix the errors before saving'); return; }
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        householdSize: parseInt(formData.householdSize) || 4,
        defaultTemperature: parseFloat(formData.defaultTemperature) || 25,
        defaultHumidity: parseFloat(formData.defaultHumidity) || 50,
        defaultPerUnitRate: parseFloat(formData.defaultPerUnitRate) || 7.5,
        appliances,
      };
      if (profile) {
        await axios.put('http://localhost:5000/api/profile/update', payload, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      } else {
        await axios.post('http://localhost:5000/api/profile/create', payload, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      }
      toast.success('Profile saved');
      setIsDirty(false);
      fetchProfile();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    if (savedFormData) setFormData(savedFormData);
    setAppliances(savedAppliances);
    setFormErrors({});
    setIsDirty(false);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateAppliance = () => {
    const errs = {};
    if (!applianceForm.name.trim()) errs.name = 'Select or type an appliance name';
    if (!applianceForm.quantity || parseFloat(applianceForm.quantity) < 1) errs.quantity = 'Enter quantity';
    if (applianceForm.usageHours === '' || parseFloat(applianceForm.usageHours) < 0) errs.usageHours = 'Enter daily hours';
    setApplianceErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const addAppliance = () => {
    if (!validateAppliance()) return;
    setAppliances(prev => [...prev, {
      applianceName: applianceForm.name,
      quantity: parseFloat(applianceForm.quantity),
      usageHours: parseFloat(applianceForm.usageHours),
      watts: applianceForm.watts ? parseFloat(applianceForm.watts) : null,
    }]);
    setApplianceForm(EMPTY_APPLIANCE);
    setSearch('');
    setApplianceErrors({});
  };

  const removeAppliance = (i) => setAppliances(prev => prev.filter((_, idx) => idx !== i));

  const selectSuggestion = (item) => {
    setApplianceForm(p => ({ ...p, name: item.name, watts: item.watts.toString() }));
    setSearch(item.name);
    setSearchOpen(false);
    if (applianceErrors.name) setApplianceErrors(p => ({ ...p, name: '' }));
    setTimeout(() => quantityRef.current?.focus(), 50);
  };

  const totalLoad = appliances.reduce((s, a) => {
    const w = a.watts || APPLIANCE_DB.find(d => d.name === a.applianceName)?.watts || 0;
    return s + w * a.quantity;
  }, 0);

  const totalDailyKwh = appliances.reduce((s, a) => {
    const w = a.watts || APPLIANCE_DB.find(d => d.name === a.applianceName)?.watts || 0;
    return s + (w * a.quantity * a.usageHours) / 1000;
  }, 0);

  const previewKwh = applianceForm.watts && applianceForm.quantity && applianceForm.usageHours
    ? ((parseFloat(applianceForm.watts) || 0) * parseFloat(applianceForm.quantity) * parseFloat(applianceForm.usageHours) / 1000).toFixed(2)
    : null;

  if (loading || !user) {
    return (
      <div className="min-h-full flex items-center justify-center bg-zinc-50">
        <div className="w-5 h-5 border-2 border-zinc-200 border-t-zinc-700 rounded-full animate-spin" />
      </div>
    );
  }

  const inputCls = (err) =>
    `w-full px-3 py-2 text-sm bg-white border rounded-lg outline-none transition-all placeholder:text-zinc-300
    [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
    ${err ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-50 text-red-700' : 'border-zinc-200 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-100 text-zinc-800'}`;

  return (
    <div className="flex h-full bg-zinc-50" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      <aside className="w-64 flex-shrink-0 bg-white border-r border-zinc-200 flex flex-col overflow-y-auto">
        <div className="p-5 border-b border-zinc-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center flex-shrink-0">
              <User size={17} className="text-white" strokeWidth={1.5} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-zinc-900 truncate leading-tight">{user.name}</p>
              <p className="text-[11px] text-zinc-400 truncate mt-0.5">{user.email}</p>
            </div>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
            user.role === 'admin' ? 'bg-violet-50 text-violet-700' : 'bg-emerald-50 text-emerald-700'
          }`}>
            <ShieldCheck size={10} />
            {user.role?.charAt(0).toUpperCase() + user.role?.slice(1)}
          </span>
        </div>

        <div className="p-5 border-b border-zinc-100">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Current Config</p>
          <div className="space-y-2.5">
            {[
              { icon: Home, label: formData.householdSize ? `${formData.householdSize} members` : 'Not set' },
              { icon: Thermometer, label: formData.defaultTemperature ? `${formData.defaultTemperature}°C` : 'Not set' },
              { icon: Droplets, label: formData.defaultHumidity ? `${formData.defaultHumidity}% RH` : 'Not set' },
              { icon: DollarSign, label: formData.defaultPerUnitRate ? `₹${formData.defaultPerUnitRate}/kWh` : 'Not set' },
            ].map(({ icon: Icon, label }, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <Icon size={13} className="text-zinc-300 flex-shrink-0" />
                <span className={`text-xs ${label === 'Not set' ? 'text-zinc-300 italic' : 'text-zinc-600'}`}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Inventory Summary</p>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-zinc-400">Devices</span>
              <span className="text-xs font-bold text-zinc-700 tabular-nums">{appliances.length || '—'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-zinc-400">Total load</span>
              <span className="text-xs font-bold text-zinc-700 tabular-nums">{appliances.length ? `${totalLoad.toLocaleString()} W` : '—'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-zinc-400">Daily usage</span>
              <span className="text-xs font-bold text-zinc-700 tabular-nums">{appliances.length ? `${totalDailyKwh.toFixed(1)} kWh` : '—'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-zinc-400">Monthly est.</span>
              <span className="text-xs font-bold text-zinc-700 tabular-nums">
                {appliances.length && formData.defaultPerUnitRate
                  ? `₹${(totalDailyKwh * 30 * parseFloat(formData.defaultPerUnitRate)).toFixed(0)}`
                  : '—'}
              </span>
            </div>
          </div>
        </div>

        {isDirty && (
          <div className="mx-4 mb-4 mt-auto p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <p className="text-[11px] font-bold text-amber-700">Unsaved changes</p>
            </div>
            <p className="text-[10px] text-amber-600">Click Save Changes to persist</p>
          </div>
        )}
      </aside>

      <main className="flex-1 min-w-0 flex flex-col overflow-y-auto">

        <div className="bg-white border-b border-zinc-200 px-7 py-4 flex items-center justify-between sticky top-0 z-20">
          <div>
            <h1 className="text-sm font-bold text-zinc-900 tracking-tight">Household Profile</h1>
            <p className="text-xs text-zinc-400 mt-0.5">All changes are batched — save when ready</p>
          </div>
          <div className="flex items-center gap-2">
            {isDirty && (
              <button onClick={handleDiscard} disabled={saving}
                className="px-3.5 py-1.5 text-xs font-semibold text-zinc-500 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors">
                Discard
              </button>
            )}
            <button onClick={handleSave} disabled={saving || !isDirty}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-zinc-900 text-white text-xs font-semibold rounded-lg hover:bg-zinc-800 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:scale-100">
              <Save size={12} />
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>

        <div className="p-7 grid grid-cols-3 gap-6 items-start">

          <div className="col-span-1 flex flex-col gap-4">
            <div>
              <h2 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Default Parameters</h2>
              <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden divide-y divide-zinc-100">

                {[
                  { name: 'householdSize', label: 'Household Size', icon: Home, unit: 'members', placeholder: '4', type: 'number', min: '1' },
                  { name: 'defaultPerUnitRate', label: 'Tariff Rate', icon: DollarSign, unit: '₹/kWh', placeholder: '7.50', type: 'number', min: '0', step: '0.1' },
                  { name: 'defaultTemperature', label: 'Temperature', icon: Thermometer, unit: '°C', placeholder: '28', type: 'number', step: '0.1' },
                  { name: 'defaultHumidity', label: 'Humidity', icon: Droplets, unit: '%', placeholder: '60', type: 'number', min: '0', max: '100' },
                ].map(({ name, label, icon: Icon, unit, placeholder, ...rest }) => (
                  <div key={name} className="px-4 py-3.5">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon size={13} className="text-zinc-400" />
                        <span className="text-xs font-semibold text-zinc-600">{label}</span>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded">{unit}</span>
                    </div>
                    <input
                      name={name}
                      value={formData[name]}
                      onChange={handleFormChange}
                      placeholder={placeholder}
                      {...rest}
                      className={`w-full px-3 py-2 text-sm bg-zinc-50 border rounded-lg outline-none transition-all placeholder:text-zinc-300
                        [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
                        ${formErrors[name] ? 'border-red-300 focus:ring-2 focus:ring-red-50 text-red-700' : 'border-zinc-200 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-100 text-zinc-800'}`}
                    />
                    {formErrors[name] && (
                      <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle size={9} />{formErrors[name]}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-zinc-900 rounded-2xl p-4 text-white">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-3">Quick Stats</p>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-zinc-400">Total load</span>
                  <span className="text-sm font-bold tabular-nums">{totalLoad ? `${totalLoad.toLocaleString()} W` : '—'}</span>
                </div>
                <div className="w-full h-px bg-zinc-800" />
                <div className="flex justify-between items-center">
                  <span className="text-xs text-zinc-400">Daily</span>
                  <span className="text-sm font-bold tabular-nums">{totalDailyKwh ? `${totalDailyKwh.toFixed(2)} kWh` : '—'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-zinc-400">Monthly</span>
                  <span className="text-sm font-bold tabular-nums">
                    {totalDailyKwh ? `${(totalDailyKwh * 30).toFixed(1)} kWh` : '—'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-zinc-400">Est. cost</span>
                  <span className="text-sm font-bold text-emerald-400 tabular-nums">
                    {totalDailyKwh && formData.defaultPerUnitRate
                      ? `₹${(totalDailyKwh * 30 * parseFloat(formData.defaultPerUnitRate)).toFixed(0)}/mo`
                      : '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-2 flex flex-col gap-4">
            <div>
              <h2 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Appliance Inventory</h2>

              <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-zinc-100 bg-zinc-50/50">
                  <p className="text-xs font-bold text-zinc-700 mb-4">Add New Appliance</p>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="col-span-2" ref={searchRef}>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                        Appliance Name
                      </label>
                      <div className="relative">
                        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                        <input
                          value={search}
                          onChange={(e) => {
                            setSearch(e.target.value);
                            setApplianceForm(p => ({ ...p, name: e.target.value, watts: '' }));
                            setSearchOpen(true);
                            if (applianceErrors.name) setApplianceErrors(p => ({ ...p, name: '' }));
                          }}
                          onFocus={() => setSearchOpen(true)}
                          placeholder="e.g. Air Conditioner, Ceiling Fan, LED Bulb…"
                          className={`w-full pl-9 pr-3 py-2.5 text-sm border rounded-lg outline-none transition-all placeholder:text-zinc-300
                            ${applianceErrors.name ? 'border-red-300 focus:ring-2 focus:ring-red-50 bg-red-50' : 'border-zinc-200 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-100 bg-white'}`}
                        />
                        {applianceErrors.name && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <AlertCircle size={14} className="text-red-400" />
                          </div>
                        )}
                      </div>
                      {applianceErrors.name && (
                        <p className="text-[11px] text-red-500 mt-1">{applianceErrors.name}</p>
                      )}
                      {searchOpen && searchResults.length > 0 && (
                        <div className="absolute z-30 mt-1 w-full max-w-lg bg-white border border-zinc-200 rounded-xl shadow-xl overflow-hidden">
                          <div className="px-3 py-2 border-b border-zinc-100">
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Suggestions</p>
                          </div>
                          {searchResults.map(item => (
                            <button key={item.name} onMouseDown={() => selectSuggestion(item)}
                              className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-zinc-50 border-b border-zinc-100 last:border-0 transition-colors text-left">
                              <div>
                                <p className="text-xs font-semibold text-zinc-800">{item.name}</p>
                                <p className="text-[10px] text-zinc-400">{item.category}</p>
                              </div>
                              <div className="flex items-center gap-1.5 flex-shrink-0 ml-3">
                                <Zap size={10} className="text-amber-500" />
                                <span className="text-[11px] font-bold text-zinc-600 font-mono">{item.watts}W</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                        <Hash size={10} />
                        Quantity
                      </label>
                      <input
                        ref={quantityRef}
                        type="number" min="1"
                        placeholder="How many units do you have?"
                        value={applianceForm.quantity}
                        onChange={(e) => {
                          setApplianceForm(p => ({ ...p, quantity: e.target.value }));
                          if (applianceErrors.quantity) setApplianceErrors(p => ({ ...p, quantity: '' }));
                        }}
                        className={inputCls(applianceErrors.quantity)}
                      />
                      {applianceErrors.quantity && (
                        <p className="text-[11px] text-red-500 mt-1">{applianceErrors.quantity}</p>
                      )}
                    </div>

                    <div>
                      <label className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                        <Clock size={10} />
                        Daily Usage Hours
                      </label>
                      <input
                        type="number" min="0" max="24" step="0.5"
                        placeholder="Hours used per day (0–24)"
                        value={applianceForm.usageHours}
                        onChange={(e) => {
                          setApplianceForm(p => ({ ...p, usageHours: e.target.value }));
                          if (applianceErrors.usageHours) setApplianceErrors(p => ({ ...p, usageHours: '' }));
                        }}
                        className={inputCls(applianceErrors.usageHours)}
                      />
                      {applianceErrors.usageHours && (
                        <p className="text-[11px] text-red-500 mt-1">{applianceErrors.usageHours}</p>
                      )}
                    </div>

                    <div>
                      <label className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                        <Zap size={10} />
                        Power Rating
                        <span className="normal-case font-normal text-zinc-300">(optional — auto-filled)</span>
                      </label>
                      <input
                        type="number" min="1"
                        placeholder="Wattage, e.g. 1000"
                        value={applianceForm.watts}
                        onChange={(e) => setApplianceForm(p => ({ ...p, watts: e.target.value }))}
                        className={inputCls(false)}
                      />
                    </div>

                    <div className="flex items-end">
                      {previewKwh !== null ? (
                        <div className="w-full h-full flex flex-col justify-end">
                          <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2.5 flex items-center justify-between">
                            <div>
                              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Daily consumption</p>
                              <p className="text-lg font-bold text-emerald-700 tabular-nums leading-tight">{previewKwh} <span className="text-xs font-semibold">kWh</span></p>
                            </div>
                            <Zap size={16} className="text-emerald-400" />
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-full flex flex-col justify-end">
                          <div className="bg-zinc-100 border border-zinc-200 rounded-lg px-3 py-2.5">
                            <p className="text-[10px] text-zinc-400">Fill wattage + qty + hours to preview consumption</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <button onClick={addAppliance}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-zinc-900 text-white text-xs font-bold rounded-xl hover:bg-zinc-800 active:scale-[0.99] transition-all">
                    <Plus size={13} />
                    Add to Inventory
                  </button>
                </div>

                {appliances.length === 0 ? (
                  <div className="py-16 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto mb-3">
                      <Plug size={20} className="text-zinc-400" />
                    </div>
                    <p className="text-sm font-semibold text-zinc-500">No appliances yet</p>
                    <p className="text-xs text-zinc-400 mt-1">Add devices using the form above</p>
                  </div>
                ) : (
                  <div>
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-zinc-100">
                          <th className="text-left text-[10px] font-bold text-zinc-400 uppercase tracking-wider px-5 py-3">Device</th>
                          <th className="text-center text-[10px] font-bold text-zinc-400 uppercase tracking-wider px-3 py-3">Qty</th>
                          <th className="text-center text-[10px] font-bold text-zinc-400 uppercase tracking-wider px-3 py-3">Power</th>
                          <th className="text-center text-[10px] font-bold text-zinc-400 uppercase tracking-wider px-3 py-3">Hrs/Day</th>
                          <th className="text-right text-[10px] font-bold text-zinc-400 uppercase tracking-wider px-5 py-3">Daily kWh</th>
                          <th className="w-10 px-3 py-3" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-50">
                        {appliances.map((a, idx) => {
                          const w = a.watts || APPLIANCE_DB.find(d => d.name === a.applianceName)?.watts || 0;
                          const kwh = (w * a.quantity * a.usageHours) / 1000;
                          return (
                            <tr key={idx} className="hover:bg-zinc-50/80 group transition-colors">
                              <td className="px-5 py-3">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-7 h-7 rounded-lg bg-zinc-100 flex items-center justify-center flex-shrink-0">
                                    <Plug size={12} className="text-zinc-400" />
                                  </div>
                                  <span className="text-sm font-semibold text-zinc-800">{a.applianceName}</span>
                                </div>
                              </td>
                              <td className="px-3 py-3 text-center">
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-zinc-100 text-xs font-bold text-zinc-600 tabular-nums">{a.quantity}</span>
                              </td>
                              <td className="px-3 py-3 text-center">
                                <span className="text-xs font-semibold text-zinc-600 tabular-nums">{w ? `${w}W` : '—'}</span>
                              </td>
                              <td className="px-3 py-3 text-center">
                                <span className="text-xs font-semibold text-zinc-600 tabular-nums">{a.usageHours}h</span>
                              </td>
                              <td className="px-5 py-3 text-right">
                                <span className="text-sm font-bold text-zinc-800 tabular-nums">{kwh.toFixed(2)}</span>
                              </td>
                              <td className="px-3 py-3 text-right">
                                <button onClick={() => removeAppliance(idx)}
                                  className="p-1.5 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                                  <Trash2 size={12} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-zinc-200 bg-zinc-50">
                          <td className="px-5 py-3 text-xs font-bold text-zinc-500">
                            {appliances.length} device{appliances.length !== 1 ? 's' : ''}
                          </td>
                          <td colSpan={2} className="px-3 py-3 text-center">
                            <span className="text-xs font-bold text-zinc-600 tabular-nums">{totalLoad.toLocaleString()} W total</span>
                          </td>
                          <td />
                          <td className="px-5 py-3 text-right">
                            <span className="text-sm font-bold text-zinc-900 tabular-nums">{totalDailyKwh.toFixed(2)} kWh</span>
                          </td>
                          <td />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}