import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Recycle, Lock, Mail, Shield, ArrowRight, Eye, EyeOff, Loader2, Sparkles, User, Briefcase } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') || 'user';

  const [role, setRole] = useState(initialRole);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (['admin', 'employee', 'user'].includes(initialRole)) {
      setRole(initialRole);
    }
  }, [initialRole]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!identifier || !password) {
      setErrorMsg('Please enter both identifier and password.');
      return;
    }

    try {
      setLoading(true);
      const res = await login(role, identifier, password);
      if (res.success) {
        toast.success(`Welcome back, ${res.user.name || 'User'}!`);
        if (role === 'admin') navigate('/admin/dashboard');
        else if (role === 'employee') navigate('/employee/dashboard');
        else navigate('/user/dashboard');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid credentials. Please verify your details.';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Quick 1-click Demo Fill
  const fillDemo = (demoRole) => {
    setRole(demoRole);
    setErrorMsg('');
    if (demoRole === 'admin') {
      setIdentifier('admin');
      setPassword('Admin@123');
    } else if (demoRole === 'employee') {
      setIdentifier('alex.mercer@ecocycle.org');
      setPassword('Employee@123');
    } else {
      setIdentifier('user@ecocycle.org');
      setPassword('User@123');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex items-center justify-center gap-3 group">
          <div className="w-12 h-12 rounded-2xl bg-forest-800 flex items-center justify-center text-white shadow-lg shadow-forest-900/20 group-hover:scale-105 transition-transform">
            <Recycle className="w-7 h-7" />
          </div>
          <div>
            <span className="text-3xl font-extrabold text-forest-950 tracking-tight">EcoCycle</span>
            <span className="block text-[11px] font-semibold text-emerald-700 uppercase tracking-widest -mt-1">
              Smart E-Waste System
            </span>
          </div>
        </Link>
        <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-slate-900">
          Sign In to Your Workspace
        </h2>
        <p className="mt-1 text-center text-xs text-slate-600">
          Select your authorized access portal below
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 sm:rounded-3xl border border-slate-200 sm:px-10">
          {/* Role Switcher Tabs */}
          <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1.5 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => { setRole('user'); setErrorMsg(''); }}
              className={`py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                role === 'user' ? 'bg-white text-forest-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>User</span>
            </button>
            <button
              type="button"
              onClick={() => { setRole('employee'); setErrorMsg(''); }}
              className={`py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                role === 'employee' ? 'bg-white text-forest-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Employee</span>
            </button>
            <button
              type="button"
              onClick={() => { setRole('admin'); setErrorMsg(''); }}
              className={`py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                role === 'admin' ? 'bg-white text-forest-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>
          </div>

          {/* Quick Demo Credentials Bar */}
          <div className="mb-6 p-3 bg-emerald-50 rounded-2xl border border-emerald-200/60">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-900 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>1-Click Demo Logins:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => fillDemo('admin')}
                className="px-2.5 py-1 text-[11px] font-medium bg-white hover:bg-emerald-100 text-emerald-800 rounded-lg border border-emerald-200 transition-colors"
              >
                Admin (admin)
              </button>
              <button
                type="button"
                onClick={() => fillDemo('employee')}
                className="px-2.5 py-1 text-[11px] font-medium bg-white hover:bg-emerald-100 text-emerald-800 rounded-lg border border-emerald-200 transition-colors"
              >
                Staff (EMP001)
              </button>
              <button
                type="button"
                onClick={() => fillDemo('user')}
                className="px-2.5 py-1 text-[11px] font-medium bg-white hover:bg-emerald-100 text-emerald-800 rounded-lg border border-emerald-200 transition-colors"
              >
                Citizen User
              </button>
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {role === 'admin'
                  ? 'Admin Username or Email'
                  : role === 'employee'
                  ? 'Employee Code or Email'
                  : 'Email Address'}
              </label>
              <div className="relative">
                <input
                  type={role === 'user' ? 'email' : 'text'}
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={
                    role === 'admin'
                      ? 'admin or admin@ecocycle.org'
                      : role === 'employee'
                      ? 'EMP001 or alex.mercer@ecocycle.org'
                      : 'user@ecocycle.org'
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-forest-800 hover:bg-forest-900 text-white font-semibold text-sm shadow-md shadow-forest-900/10 hover:shadow-forest-900/20 transition-all flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to {role.charAt(0).toUpperCase() + role.slice(1)} Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {role === 'user' && (
            <div className="mt-6 text-center text-xs text-slate-600">
              Don't have a recycling account?{' '}
              <Link to="/register" className="font-semibold text-forest-800 hover:underline">
                Create Citizen Account
              </Link>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <Link to="/" className="text-xs text-slate-500 hover:text-slate-800">
              ← Return to EcoCycle Public Website
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
