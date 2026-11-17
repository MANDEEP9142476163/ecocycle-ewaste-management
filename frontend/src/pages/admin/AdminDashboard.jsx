import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import {
  Users, UserCheck, ClipboardList, Clock, CheckCircle2, AlertCircle,
  Truck, RefreshCw, XCircle, Inbox, ArrowUpRight, Loader2, Calendar,
  Layers, TrendingUp
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/admin');
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load admin dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-forest-700 mb-2" />
        <p className="text-sm text-slate-500">Loading comprehensive platform analytics...</p>
      </div>
    );
  }

  const stats = data?.stats || {};
  const charts = data?.charts || {};
  const recent = data?.recent_submissions || [];

  const statCards = [
    { label: 'Total Registered Users', value: stats.total_users, icon: Users, color: 'text-blue-600 bg-blue-50 border-blue-100', link: '/admin/users' },
    { label: 'Total Employees', value: stats.total_employees, icon: UserCheck, color: 'text-indigo-600 bg-indigo-50 border-indigo-100', link: '/admin/employees' },
    { label: 'Total Listed Products', value: stats.total_products, icon: ClipboardList, color: 'text-emerald-700 bg-emerald-50 border-emerald-100', link: '/admin/products' },
    { label: 'New Product Requests', value: stats.pending_requests, icon: Clock, color: 'text-amber-600 bg-amber-50 border-amber-100', link: '/admin/unassigned' },
    { label: 'Unassigned Products', value: stats.unassigned_products, icon: Inbox, color: 'text-rose-600 bg-rose-50 border-rose-100', link: '/admin/unassigned' },
    { label: 'Assigned Products', value: stats.assigned_products, icon: CheckCircle2, color: 'text-cyan-600 bg-cyan-50 border-cyan-100', link: '/admin/assign' },
    { label: 'Collected Products', value: stats.collected_products, icon: Truck, color: 'text-teal-600 bg-teal-50 border-teal-100', link: '/admin/status-monitor' },
    { label: 'Sent for Recycling', value: stats.sent_for_recycling, icon: RefreshCw, color: 'text-purple-600 bg-purple-50 border-purple-100', link: '/admin/status-monitor' },
    { label: 'Recycled Products', value: stats.recycled_products, icon: RefreshCw, color: 'text-forest-700 bg-forest-50 border-forest-200', link: '/admin/status-monitor' },
    { label: 'Rejected Products', value: stats.rejected_products, icon: XCircle, color: 'text-red-600 bg-red-50 border-red-100', link: '/admin/status-monitor' }
  ];

  // Colors for charts
  const PIE_COLORS = ['#059669', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#64748b'];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-forest-900 via-forest-800 to-emerald-900 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-400/20 text-emerald-300 text-xs font-semibold mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Central Management Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            EcoCycle Operations Intelligence
          </h1>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl">
            Live overview of citizen e-waste submissions, field employee assignments, material recovery logistics, and recycling status across all regions.
          </p>
        </div>
      </div>

      {/* 10 Required Stat Cards */}
      <div>
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">System Statistics</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {statCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <Link
                key={idx}
                to={card.link}
                className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between group"
              >
                <div className="flex items-center justify-between">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${card.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-forest-700 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-extrabold text-slate-900">{card.value ?? 0}</span>
                  <p className="text-[11px] font-medium text-slate-500 mt-0.5 line-clamp-1">{card.label}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Submissions & Collection Trends */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Monthly Submissions & Collections</h3>
              <p className="text-xs text-slate-500">Historical performance trends</p>
            </div>
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.monthly_trends || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="submissions" name="Submissions" fill="#059669" radius={[4, 4, 0, 0]} />
                <Bar dataKey="collected" name="Collected" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recycling Status Distribution */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Recycling Lifecycle Distribution</h3>
              <p className="text-xs text-slate-500">Breakdown of all requests by current status</p>
            </div>
            <Layers className="w-5 h-5 text-purple-600" />
          </div>
          <div className="h-64 flex items-center justify-center">
            {charts.status_distribution?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.status_distribution}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={75}
                    innerRadius={40}
                    paddingAngle={4}
                  >
                    {charts.status_distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-400">No status records available.</p>
            )}
          </div>
        </div>
      </div>

      {/* Category Breakdown & Recent Submissions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Breakdown (1 col) */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-900 text-base mb-1">E-Waste Categories</h3>
          <p className="text-xs text-slate-500 mb-4">Submissions by electronic device type</p>
          <div className="space-y-3">
            {(charts.category_distribution || []).map((cat, i) => (
              <div key={i} className="text-xs">
                <div className="flex justify-between font-medium text-slate-700 mb-1">
                  <span>{cat.category_name}</span>
                  <span className="font-semibold text-slate-900">{cat.count}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-600 h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, Math.max(5, (cat.count / (stats.total_products || 1)) * 100))}%`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Submissions (2 cols) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Recent Product Submissions</h3>
              <p className="text-xs text-slate-500">Newly registered e-waste disposal requests</p>
            </div>
            <Link to="/admin/products" className="text-xs font-semibold text-forest-700 hover:underline">
              View All Products →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-y border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">Product ID</th>
                  <th className="py-2.5 px-3">Device Name</th>
                  <th className="py-2.5 px-3">User</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Assigned To</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recent.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">
                      No submissions recorded yet.
                    </td>
                  </tr>
                ) : (
                  recent.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 font-mono font-semibold text-forest-800">{p.product_code}</td>
                      <td className="py-3 px-3 font-medium text-slate-800">{p.product_name}</td>
                      <td className="py-3 px-3 text-slate-600">{p.user_name}</td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          p.status === 'Recycled' ? 'bg-forest-100 text-forest-800' :
                          p.status === 'Collected' ? 'bg-teal-100 text-teal-800' :
                          p.status === 'Assigned' ? 'bg-blue-100 text-blue-800' :
                          p.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {p.employee_name || <span className="text-amber-600 font-medium">Unassigned</span>}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Link
                          to={`/admin/products?view=${p.id}`}
                          className="text-forest-700 hover:text-emerald-600 font-semibold text-xs"
                        >
                          Details
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
