import { useState } from 'react';
import axios from 'axios';
import { Mail, Lock, UserPlus, ArrowRight, TrendingDown, Shield, BarChart3, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const features = [
  {
    icon: BarChart3,
    title: 'Smart Consumption Tracking',
    desc: 'Monitor your electricity usage in real-time with intelligent analytics.',
  },
  {
    icon: TrendingDown,
    title: 'Budget Forecasting',
    desc: 'Stay within your monthly budget with AI-powered predictions.',
  },
  {
    icon: Shield,
    title: 'Cost Optimization',
    desc: 'Get actionable insights to reduce your electricity bills.',
  },
];

export default function AuthPage({ setUser }) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const navigate = useNavigate();

  const switchMode = (toLogin) => {
    setIsLogin(toLogin);
    setShowPassword(false);
    setFormData({ name: '', email: '', password: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = isLogin
        ? 'http://localhost:5000/api/auth/login'
        : 'http://localhost:5000/api/auth/register';
      const body = isLogin
        ? { email: formData.email, password: formData.password }
        : formData;
      const response = await axios.post(url, body);
      localStorage.setItem('token', response.data.token);
      if (!isLogin) {
        toast.success('Account created! Please sign in.');
        switchMode(true);
      } else {
        setUser({ token: response.data.token });
        toast.success('Welcome back!');
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex">

      <div className="w-1/3 min-h-screen flex items-center justify-center px-12 py-16 bg-white border-r border-gray-100">
        <div className="w-full max-w-xs">

          <div className="mb-9">
            <span className="text-xl font-bold tracking-tight text-gray-900">Ener</span>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">lytics</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-1">
            {isLogin ? 'Welcome back' : 'Create account'}
          </h1>
          <p className="text-sm text-gray-400 mb-7">
            {isLogin ? 'Sign in to your Enerlytics account' : 'Start managing your energy budget today'}
          </p>

          <div className="flex bg-gray-50 border border-gray-100 rounded-xl p-1 mb-7">
            <button
              onClick={() => switchMode(true)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                isLogin
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => switchMode(false)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                !isLogin
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Full Name</label>
                <div className="relative">
                  <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 w-4 h-4 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required={!isLogin}
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-300 outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 w-4 h-4 pointer-events-none" />
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-300 outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 w-4 h-4 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="w-full pl-9 pr-10 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-300 outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-indigo-500 transition-colors"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 mt-1 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-lg transition-all duration-200 hover:-translate-y-px hover:shadow-lg hover:shadow-gray-900/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{isLogin ? 'Signing in...' : 'Creating account...'}</span>
                </>
              ) : (
                <>
                  <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          <p className="text-center mt-5 text-xs text-gray-400">
            {isLogin ? 'New to Enerlytics?' : 'Already have an account?'}
            <button
              onClick={() => switchMode(!isLogin)}
              className="ml-1 text-indigo-500 font-semibold hover:text-indigo-600 transition-colors"
            >
              {isLogin ? 'Create account' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>

      <div className="w-2/3 min-h-screen flex flex-col justify-center px-20 py-16 bg-gradient-to-br from-slate-50 via-indigo-50 to-violet-50 relative overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-violet-400/10 rounded-full blur-3xl" />

        <div className="flex items-center gap-2.5 mb-12 relative z-10">
          <span className="text-base font-bold tracking-tight text-gray-900">
            Ener<span className="bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">lytics</span>
          </span>
          <span className="text-xs bg-gradient-to-r from-indigo-500 to-violet-500 text-white px-2 py-0.5 rounded-full font-semibold tracking-wide">
            AI
          </span>
        </div>

        <h2 className="font-serif text-[42px] font-extrabold text-gray-900 leading-tight tracking-tight mb-4 relative z-10">
          Predict your<br />
          electricity costs,<br />
          <span className="bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">
            stay on budget.
          </span>
        </h2>

        <p className="text-[15px] text-gray-500 leading-relaxed mb-12 max-w-md relative z-10">
          Harness AI to forecast your monthly electricity consumption and align spending with your allocated budget — before the bill arrives.
        </p>

        <div className="space-y-2.5 relative z-10">
          {features.map((f, i) => (
            <div
              key={i}
              className="flex items-start gap-4 p-4 bg-white/70 backdrop-blur-sm border border-white/90 rounded-2xl transition-all duration-200 hover:translate-x-1 hover:shadow-lg hover:shadow-indigo-500/5"
            >
              <div className="w-9 h-9 bg-gradient-to-br from-indigo-50 to-violet-100 rounded-xl flex items-center justify-center shrink-0">
                <f.icon size={16} className="text-indigo-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-0.5">{f.title}</p>
                <p className="text-xs text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-7 p-4 bg-white/50 backdrop-blur-sm border border-white/90 rounded-2xl relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex">
              {['bg-indigo-500', 'bg-violet-500', 'bg-violet-300'].map((c, i) => (
                <div
                  key={i}
                  className={`w-6 h-6 ${c} rounded-full border-2 border-white ${i ? '-ml-1.5' : ''}`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500 font-medium">Joined by 2,400+ users this month</span>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed italic">
            "Reduced my electricity bill by 23% in just two months using the budget forecasting tool."
          </p>
          <p className="text-xs text-indigo-500 font-semibold mt-1.5">— Priya M., Mumbai</p>
        </div>
      </div>
    </div>
  );
}