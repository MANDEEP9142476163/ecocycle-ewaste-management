import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import {
  ClipboardList, Clock, CheckCircle2, Truck, RefreshCw, XCircle,
  Plus, ArrowRight, Loader2, Calendar, MapPin, Sparkles, AlertCircle
} from 'lucide-react';

const UserDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/user');
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load user dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-forest-700 mb-2" />
        <p className="text-sm text-slate-500">Loading your green recycling dashboard...</p>
      </div>
    );
  }

  const stats = data?.stats || {};
  const recent = data?.recent_products || [];

  const statCards = [
    { label: 'Total Listed Products', value: stats.total_listed, icon: ClipboardList, color: 'text-emerald-700 bg-emerald-50', link: '/user/products' },
    { label: 'Pending Requests', value: stats.pending_requests, icon: Clock, color: 'text-amber-600 bg-amber-50', link: '/user/products' },
    { label: 'Assigned Requests', value: stats.assigned_requests, icon: CheckCircle2, color: 'text-blue-600 bg-blue-50', link: '/user/products' },
    { label: 'Collected Products', value: stats.collected, icon: Truck, color: 'text-teal-600 bg-teal-50', link: '/user/products' },
    { label: 'Sent for Recycling', value: stats.sent_for_recycling, icon: RefreshCw, color: 'text-indigo-600 bg-indigo-50', link: '/user/products' },
    { label: 'Recycled Products', value: stats.recycled, icon: Sparkles, color: 'text-forest-700 bg-forest-50', link: '/user/products' },
    { label: 'Rejected Products', value: stats.rejected, icon: XCircle, color: 'text-red-600 bg-red-50', link: '/user/products' }
  ];

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-forest-900 via-forest-800 to-emerald-900 rounded-3xl p-6 sm:p-8 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-400/20 text-emerald-300 text-xs font-semibold mb-3">
            <span>Responsible Electronics Disposal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome to Your EcoCycle Hub
          </h1>
          <p className="text-slate-300 text-sm mt-1 max-w-xl">
            Track your electronic items from doorstep pickup to verified materials extraction and certified circular recycling.
          </p>
        </div>

        <Link
          to="/user/submit-product"
          className="px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all flex items-center gap-2 self-start sm:self-auto shrink-0"
        >
          <Plus className="w-5 h-5" />
          <span>List New E-Waste</span>
        </Link>
      </div>

      {/* 7 Required Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Link
              key={idx}
              to={card.link}
              className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between"
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${card.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="mt-3">
                <span className="text-xl font-extrabold text-slate-900">{card.value ?? 0}</span>
                <p className="text-[10px] font-semibold text-slate-500 uppercase mt-0.5 line-clamp-1">{card.label}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Recent Submissions */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Your Recent E-Waste Submissions</h3>
            <p className="text-xs text-slate-500">Track current status of your submitted electronic items</p>
          </div>
          <Link to="/user/products" className="text-xs font-semibold text-forest-700 hover:underline">
            View All Items →
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <p className="font-semibold text-slate-700">No electronic items listed yet.</p>
            <p className="text-xs text-slate-500 mt-1 mb-4">Have an old laptop, phone, or television? Recycle it responsibly.</p>
            <Link
              to="/user/submit-product"
              className="px-4 py-2 rounded-xl bg-forest-800 text-white font-semibold text-xs inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>List Your First E-Waste Product</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Product Code</th>
                  <th className="py-3 px-4">Device Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Est Value</th>
                  <th className="py-3 px-4">Pickup Date</th>
                  <th className="py-3 px-4">Inspector</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Track</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recent.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-forest-800">{p.product_code}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{p.product_name}</td>
                    <td className="py-3 px-4 text-slate-600">{p.category_name}</td>
                    <td className="py-3 px-4 font-semibold text-emerald-700">${p.expected_price || '0.00'}</td>
                    <td className="py-3 px-4 text-slate-600">{p.pickup_date}</td>
                    <td className="py-3 px-4 text-slate-600">
                      {p.employee_name || <span className="text-amber-600">Pending Assignment</span>}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        p.status === 'Recycled' ? 'bg-forest-100 text-forest-800' :
                        p.status === 'Collected' ? 'bg-teal-100 text-teal-800' :
                        p.status === 'Sent for Recycling' ? 'bg-indigo-100 text-indigo-800' :
                        p.status === 'Under Investigation' ? 'bg-purple-100 text-purple-800' :
                        p.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                        p.status === 'Assigned' ? 'bg-blue-100 text-blue-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/user/track?id=${p.id}`}
                        className="text-xs font-semibold text-forest-700 hover:text-emerald-600 inline-flex items-center gap-1"
                      >
                        <span>Timeline</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;
