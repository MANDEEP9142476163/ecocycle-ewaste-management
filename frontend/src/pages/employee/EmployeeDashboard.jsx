import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import {
  ClipboardList, Clock, Truck, RefreshCw, XCircle, ArrowUpRight,
  Loader2, CheckCircle2, User, Phone, MapPin, Eye, ArrowRight
} from 'lucide-react';

const EmployeeDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/employee');
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load employee dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-forest-700 mb-2" />
        <p className="text-sm text-slate-500">Loading your assigned e-waste tasks...</p>
      </div>
    );
  }

  const stats = data?.stats || {};
  const assigned = data?.assigned_requests || [];

  const statCards = [
    { label: 'Assigned Requests', value: stats.total_assigned, icon: ClipboardList, color: 'text-blue-600 bg-blue-50', link: '/employee/assigned' },
    { label: 'Pending Investigation', value: stats.pending_investigation, icon: Clock, color: 'text-amber-600 bg-amber-50', link: '/employee/investigation' },
    { label: 'Collected Products', value: stats.collected, icon: Truck, color: 'text-teal-600 bg-teal-50', link: '/employee/send-recycling' },
    { label: 'Sent for Recycling', value: stats.sent_for_recycling, icon: RefreshCw, color: 'text-indigo-600 bg-indigo-50', link: '/employee/complete-recycling' },
    { label: 'Recycled Products', value: stats.recycled, icon: CheckCircle2, color: 'text-forest-700 bg-forest-50', link: '/employee/assigned' },
    { label: 'Rejected Products', value: stats.rejected, icon: XCircle, color: 'text-red-600 bg-red-50', link: '/employee/assigned' }
  ];

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-forest-900 via-forest-800 to-emerald-900 rounded-3xl p-6 sm:p-8 text-white shadow-md">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-400/20 text-emerald-300 text-xs font-semibold mb-3">
          <span>Field Inspection Operations</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Field Officer Workspace
        </h1>
        <p className="text-slate-300 text-sm mt-1 max-w-xl">
          Review your assigned product requests, verify electronic specifications on-site, manage doorstep collections, and advance recycling statuses.
        </p>
      </div>

      {/* 6 Required Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Link
              key={idx}
              to={card.link}
              className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${card.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-forest-700 transition-colors" />
              </div>
              <div className="mt-3">
                <span className="text-2xl font-extrabold text-slate-900">{card.value ?? 0}</span>
                <p className="text-[11px] font-medium text-slate-500 mt-0.5 line-clamp-1">{card.label}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Assigned Requests Queue */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Your Active Assigned Requests</h3>
            <p className="text-xs text-slate-500">Items assigned to you for inspection and processing</p>
          </div>
          <Link to="/employee/assigned" className="text-xs font-semibold text-forest-700 hover:underline">
            View All Assigned →
          </Link>
        </div>

        {assigned.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            You currently have no assigned products. When the administrator assigns items, they will appear here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Device Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Citizen & Mobile</th>
                  <th className="py-3 px-4">Pickup Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assigned.slice(0, 8).map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-forest-800">{p.product_code}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{p.product_name}</td>
                    <td className="py-3 px-4 text-slate-600">{p.category_name}</td>
                    <td className="py-3 px-4 text-slate-700">
                      <p className="font-medium">{p.user_name}</p>
                      <p className="text-[11px] text-slate-400">{p.contact_number || p.user_phone}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">{p.pickup_date}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        p.status === 'Recycled' ? 'bg-forest-100 text-forest-800' :
                        p.status === 'Collected' ? 'bg-teal-100 text-teal-800' :
                        p.status === 'Sent for Recycling' ? 'bg-indigo-100 text-indigo-800' :
                        p.status === 'Under Investigation' ? 'bg-purple-100 text-purple-800' :
                        p.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/employee/investigation?id=${p.id}`}
                        className="px-3 py-1.5 rounded-xl bg-forest-800 hover:bg-forest-900 text-white font-semibold text-xs inline-flex items-center gap-1 shadow-sm"
                      >
                        <span>Investigate</span>
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

export default EmployeeDashboard;
