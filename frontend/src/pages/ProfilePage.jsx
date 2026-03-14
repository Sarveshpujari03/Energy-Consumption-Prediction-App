import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { User, Home, Thermometer, Droplets, Clock, DollarSign, Save, X, Edit3, LineChart, Mail, ShieldCheck } from 'lucide-react';

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    householdSize: '',
    defaultAppliances: '',
    defaultUsageHours: '',
    defaultTemperature: '',
    defaultHumidity: '',
    defaultPerUnitRate: ''
  });
  const [originalData, setOriginalData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/profile/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data.user);
      setProfile(response.data.profile);
      if (response.data.profile) {
        const data = {
          householdSize: response.data.profile.householdSize?.toString() || '',
          defaultAppliances: response.data.profile.defaultAppliances?.toString() || '',
          defaultUsageHours: response.data.profile.defaultUsageHours?.toString() || '',
          defaultTemperature: response.data.profile.defaultTemperature?.toString() || '',
          defaultHumidity: response.data.profile.defaultHumidity?.toString() || '',
          defaultPerUnitRate: response.data.profile.defaultPerUnitRate?.toString() || ''
        };
        setFormData(data);
        setOriginalData(data);
      } else {
        const empty = { householdSize: '', defaultAppliances: '', defaultUsageHours: '', defaultTemperature: '', defaultHumidity: '', defaultPerUnitRate: '' };
        setFormData(empty);
        setOriginalData(null);
      }
    } catch (error) {
      toast.error('Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      if (originalData) {
        const orig = Object.keys(originalData).reduce((acc, key) => { acc[key] = originalData[key]?.toString() || ''; return acc; }, {});
        setIsEditing(JSON.stringify(newData) !== JSON.stringify(orig));
      } else {
        setIsEditing(Object.values(newData).some(val => val !== ''));
      }
      return newData;
    });
  };

  const handleCancel = () => {
    setFormData(originalData || { householdSize: '', defaultAppliances: '', defaultUsageHours: '', defaultTemperature: '', defaultHumidity: '', defaultPerUnitRate: '' });
    setIsEditing(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const submitData = {
        householdSize: parseInt(formData.householdSize) || 4,
        defaultAppliances: parseInt(formData.defaultAppliances) || 5,
        defaultUsageHours: parseFloat(formData.defaultUsageHours) || 8,
        defaultTemperature: parseFloat(formData.defaultTemperature) || 25,
        defaultHumidity: parseInt(formData.defaultHumidity) || 50,
        defaultPerUnitRate: parseFloat(formData.defaultPerUnitRate) || 7.5
      };
      if (profile) {
        await axios.put('http://localhost:5000/api/profile/update', submitData, { headers: { Authorization: `Bearer ${token}` } });
        toast.success('Profile updated successfully!');
      } else {
        await axios.post('http://localhost:5000/api/profile/create', submitData, { headers: { Authorization: `Bearer ${token}` } });
        toast.success('Profile created successfully!');
      }
      setOriginalData(submitData);
      setIsEditing(false);
      fetchProfile();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-indigo-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  const fields = [
    { name: 'householdSize',      label: 'Household Size',  icon: Home,        color: 'text-indigo-500', bgColor: 'bg-indigo-50',  placeholder: 'Enter the number of Appliances',   unit: 'members',  min: '1',              hint: 'Number of people living in your home' },
    { name: 'defaultAppliances',  label: 'Appliances',      icon: LineChart,   color: 'text-violet-500', bgColor: 'bg-violet-50',  placeholder: 'What is the expected temparature',   unit: 'devices',  min: '1',              hint: 'Total active electrical appliances' },
    { name: 'defaultUsageHours',  label: 'Usage Hours',     icon: Clock,       color: 'text-amber-500',  bgColor: 'bg-amber-50',   placeholder: 'What is the expected Humidity',   unit: 'hrs / day',min: '1', max: '24', step: '0.5', hint: 'Average daily electricity usage duration' },
    { name: 'defaultTemperature', label: 'Temperature',     icon: Thermometer, color: 'text-rose-500',   bgColor: 'bg-rose-50',    placeholder: 'Avg daily usage hours',  unit: '°C',       min: '15', max: '45', step: '0.1', hint: 'Typical ambient temperature in your area' },
    { name: 'defaultHumidity',    label: 'Humidity',        icon: Droplets,    color: 'text-cyan-500',   bgColor: 'bg-cyan-50',    placeholder: 'Enter the rate per unit',  unit: '%',        min: '0', max: '100', hint: 'Average relative humidity percentage' },
    { name: 'defaultPerUnitRate', label: 'Rate per Unit',   icon: DollarSign,  color: 'text-emerald-500',bgColor: 'bg-emerald-50', placeholder: 'Enter your allocated monthly budget', unit: '₹ / kWh',  min: '0', step: '0.1', hint: 'Your electricity tariff rate from provider' },
  ];

  return (
    <div className="flex gap-10 h-full">

      <div className="w-64 flex-shrink-0 flex flex-col gap-6 pt-2">
        <div className="flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-xl shadow-emerald-500/25 mb-4">
            <User size={40} className="text-white" strokeWidth={1.5} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">{user.name}</h2>
          <p className="text-sm text-gray-400 mt-0.5">{user.email}</p>
          <span className={`inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full text-xs font-semibold ${
            user.role === 'admin'
              ? 'bg-violet-50 text-violet-600 border border-violet-100'
              : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
          }`}>
            <ShieldCheck size={11} />
            {user.role?.charAt(0).toUpperCase() + user.role?.slice(1)}
          </span>
        </div>

        <div className="border-t border-gray-200/60 pt-5 space-y-4">
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <Mail size={15} className="text-gray-300 flex-shrink-0" />
            <span className="truncate text-xs">{user.email}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <Home size={15} className="text-gray-300 flex-shrink-0" />
            <span className="text-xs">{formData.householdSize ? `${formData.householdSize} member household` : 'Household not set'}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <DollarSign size={15} className="text-gray-300 flex-shrink-0" />
            <span className="text-xs">{formData.defaultPerUnitRate ? `₹${formData.defaultPerUnitRate} per kWh` : 'Tariff not set'}</span>
          </div>
        </div>

        <div className="border-t border-gray-200/60 pt-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Overview</p>
          <div className="space-y-3">
            {[
              { label: 'Appliances', value: formData.defaultAppliances || '—', suffix: formData.defaultAppliances ? ' devices' : '' },
              { label: 'Daily usage', value: formData.defaultUsageHours || '—', suffix: formData.defaultUsageHours ? ' hrs' : '' },
              { label: 'Temperature', value: formData.defaultTemperature || '—', suffix: formData.defaultTemperature ? ' °C' : '' },
              { label: 'Humidity', value: formData.defaultHumidity || '—', suffix: formData.defaultHumidity ? ' %' : '' },
            ].map((s, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-xs text-gray-400">{s.label}</span>
                <span className="text-xs font-semibold text-gray-700">{s.value}{s.suffix}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between mb-6 pb-5 border-b border-gray-200/60">
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Default Settings</h1>
            <p className="text-sm text-gray-400 mt-0.5">These values are used as defaults when making predictions</p>
          </div>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-xl transition-all duration-200 hover:-translate-y-px hover:shadow-lg hover:shadow-gray-900/15"
            >
              <Edit3 size={13} />
              Edit Settings
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm font-semibold rounded-xl transition-all duration-200 disabled:opacity-50"
              >
                <X size={13} />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !isEditing}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all duration-200 hover:-translate-y-px hover:shadow-lg hover:shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <Save size={13} />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>

        {!profile && !isEditing && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200/60 rounded-xl flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Edit3 size={14} className="text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-800">No defaults configured</p>
              <p className="text-xs text-amber-600 mt-0.5">Click Edit Settings to set up your prediction defaults.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 flex-1">
          {fields.map((f) => (
            <div
              key={f.name}
              className={`rounded-2xl border p-5 flex flex-col gap-3 transition-all duration-200 ${
                isEditing
                  ? 'bg-white border-gray-200 shadow-sm'
                  : 'bg-white/60 border-gray-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 ${f.bgColor} rounded-lg flex items-center justify-center`}>
                    <f.icon size={15} className={f.color} />
                  </div>
                  <span className="text-sm font-semibold text-gray-700">{f.label}</span>
                </div>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md font-medium">{f.unit}</span>
              </div>

              <div className={`rounded-xl px-4 py-3 transition-all duration-200 ${isEditing ? 'bg-gray-50 border border-gray-200 focus-within:border-indigo-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-500/10' : 'bg-gray-50/50'}`}>
                <input
                  name={f.name}
                  type={f.type || 'number'}
                  value={formData[f.name]}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  min={f.min}
                  max={f.max}
                  step={f.step}
                  placeholder={f.placeholder}
                  className="w-full text-2xl font-bold text-gray-900 bg-transparent outline-none placeholder-gray-300 disabled:cursor-default [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>

              <p className="text-xs text-gray-400 leading-relaxed">{f.hint}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}