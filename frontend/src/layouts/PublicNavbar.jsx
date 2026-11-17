import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Recycle, Menu, X, ArrowRight, User, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const PublicNavbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const getDashboardLink = () => {
    if (!user) return '/login';
    if (user.role === 'admin') return '/admin/dashboard';
    if (user.role === 'employee') return '/employee/dashboard';
    return '/user/dashboard';
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-header border-b border-emerald-100 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-forest-800 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Recycle className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <span className="text-2xl font-bold bg-gradient-to-r from-forest-900 via-forest-800 to-emerald-700 bg-clip-text text-transparent tracking-tight">
                EcoCycle
              </span>
              <span className="block text-[10px] uppercase tracking-widest font-semibold text-emerald-700 -mt-1">
                Smart E-Waste System
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-700">
            <Link to="/" className="hover:text-forest-700 transition-colors">Home</Link>
            <a href="#about" className="hover:text-forest-700 transition-colors">About Us</a>
            <a href="#how-it-works" className="hover:text-forest-700 transition-colors">How It Works</a>
            <a href="#categories" className="hover:text-forest-700 transition-colors">Categories</a>
            <a href="#impact" className="hover:text-forest-700 transition-colors">Environmental Impact</a>
            <a href="#contact" className="hover:text-forest-700 transition-colors">Contact</a>
          </div>

          {/* Action Buttons */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  to={getDashboardLink()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-forest-800 hover:bg-forest-900 text-white font-medium text-sm shadow-sm transition-all"
                >
                  <User className="w-4 h-4" />
                  <span>My Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => { logout(); navigate('/'); }}
                  title="Sign out"
                  className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:text-forest-800 hover:border-forest-700 font-medium text-sm transition-all"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-forest-800 to-emerald-600 hover:from-forest-900 hover:to-emerald-700 text-white font-semibold text-sm shadow-md shadow-emerald-700/20 hover:shadow-emerald-700/30 transition-all flex items-center gap-2"
                >
                  <span>Schedule Pickup</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-700 hover:bg-emerald-50 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-md border-b border-emerald-100 px-4 pt-3 pb-6 space-y-3 shadow-lg">
          <Link to="/" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-700 hover:text-forest-800 font-medium">Home</Link>
          <a href="#about" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-700 hover:text-forest-800 font-medium">About Us</a>
          <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-700 hover:text-forest-800 font-medium">How It Works</a>
          <a href="#categories" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-700 hover:text-forest-800 font-medium">Categories</a>
          <a href="#impact" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-700 hover:text-forest-800 font-medium">Environmental Impact</a>
          <a href="#contact" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-700 hover:text-forest-800 font-medium">Contact</a>

          <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
            {user ? (
              <>
                <Link
                  to={getDashboardLink()}
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-lg bg-forest-800 text-white font-medium text-sm"
                >
                  Go to Dashboard ({user.name})
                </Link>
                <button
                  onClick={() => { logout(); setMobileMenuOpen(false); navigate('/'); }}
                  className="w-full text-center py-2.5 rounded-lg border border-red-200 text-red-600 font-medium text-sm hover:bg-red-50"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium text-sm"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-lg bg-emerald-600 text-white font-semibold text-sm"
                >
                  Schedule Pickup
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default PublicNavbar;
