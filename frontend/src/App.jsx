import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useState, useEffect } from 'react';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import PredictPage from './pages/PredictPage';
import ProfilePage from './pages/ProfilePage';
import Layout from './components/Layout';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setUser({ token });
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <Toaster position="top-right" />
        <Routes>
          <Route
            path="/auth"
            element={!user ? <AuthPage setUser={setUser} /> : <Navigate to="/dashboard" />}
          />

          <Route
            element={user ? <Layout user={user} setUser={setUser}><Outlet /></Layout> : <Navigate to="/auth" />}
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/predict" element={<PredictPage />} />
            <Route path="/profile" element={<ProfilePage />} />
]          </Route>

          <Route path="/" element={<Navigate to={user ? "/dashboard" : "/auth"} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;