import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  FileBarChart2, Download, Calendar, Filter, Loader2,
  CheckCircle2, DollarSign, Layers, Package
} from 'lucide-react';

const Reports = () => {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [status, setStatus] = useState('All');
  const [categoryId, setCategoryId] = useState('All');

  const [categories, setCategories] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloadingCsv, setDownloadingCsv] = useState(false);

  useEffect(() => {
    // load categories
    api.get('/categories').then((res) => {
      if (res.data.success) setCategories(res.data.categories);
    }).catch(() => {});
    fetchReport();
  }, []);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reports/products', {
        params: {
          from_date: fromDate || undefined,
          to_date: toDate || undefined,
          status: status !== 'All' ? status : undefined,
          category_id: categoryId !== 'All' ? categoryId : undefined
        }
      });
      if (res.data.success) {
        setReportData(res.data);
      }
    } catch {
      toast.error('Failed to generate report.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCsv = async () => {
    try {
      setDownloadingCsv(true);
      const res = await api.get('/reports/export-csv', {
        params: {
          from_date: fromDate || undefined,
          to_date: toDate || undefined,
          status: status !== 'All' ? status : undefined,
          category_id: categoryId !== 'All' ? categoryId : undefined
        },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ecocycle_report_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Report CSV exported successfully!');
    } catch {
      toast.error('Failed to export CSV report.');
    } finally {
      setDownloadingCsv(false);
    }
  };

  const summary = reportData?.summary || {};
  const products = reportData?.products || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Audit & Analytics Reports</h1>
          <p className="text-xs text-slate-500 mt-1">Generate filtered regulatory and academic e-waste reports with CSV export.</p>
        </div>
        <button
          onClick={handleDownloadCsv}
          disabled={downloadingCsv || products.length === 0}
          className="px-4 py-2.5 rounded-xl bg-forest-800 hover:bg-forest-900 disabled:opacity-50 text-white font-semibold text-xs shadow-sm flex items-center gap-2 self-start sm:self-auto"
        >
          {downloadingCsv ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          <span>Download Report (CSV)</span>
        </button>
      </div>

      {/* Date & Filter Controls Card */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Lifecycle Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Assigned">Assigned</option>
              <option value="Collected">Collected</option>
              <option value="Sent for Recycling">Sent for Recycling</option>
              <option value="Recycled">Recycled</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Device Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="All">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.category_name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={fetchReport}
            disabled={loading}
            className="px-5 py-2 rounded-xl bg-forest-800 hover:bg-forest-900 text-white text-xs font-semibold flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Filter className="w-3.5 h-3.5" />}
            <span>Apply Filters & Refresh Report</span>
          </button>
        </div>
      </div>

      {/* Summary Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 text-center">
          <span className="text-xl font-extrabold text-slate-900">{summary.total || 0}</span>
          <p className="text-[10px] font-semibold text-slate-500 uppercase mt-0.5">Total Records</p>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 text-center">
          <span className="text-xl font-extrabold text-amber-600">{summary.pending || 0}</span>
          <p className="text-[10px] font-semibold text-slate-500 uppercase mt-0.5">Pending</p>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 text-center">
          <span className="text-xl font-extrabold text-blue-600">{summary.assigned || 0}</span>
          <p className="text-[10px] font-semibold text-slate-500 uppercase mt-0.5">Assigned</p>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 text-center">
          <span className="text-xl font-extrabold text-teal-600">{summary.collected || 0}</span>
          <p className="text-[10px] font-semibold text-slate-500 uppercase mt-0.5">Collected</p>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 text-center">
          <span className="text-xl font-extrabold text-indigo-600">{summary.sent_for_recycling || 0}</span>
          <p className="text-[10px] font-semibold text-slate-500 uppercase mt-0.5">In Recycling</p>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 text-center">
          <span className="text-xl font-extrabold text-forest-700">{summary.recycled || 0}</span>
          <p className="text-[10px] font-semibold text-slate-500 uppercase mt-0.5">Recycled</p>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 text-center">
          <span className="text-xl font-extrabold text-red-600">{summary.rejected || 0}</span>
          <p className="text-[10px] font-semibold text-slate-500 uppercase mt-0.5">Rejected</p>
        </div>
      </div>

      {/* Report Records Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-forest-700" />
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No report data for selected filter range.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Product ID</th>
                  <th className="py-3 px-4">Device Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Citizen</th>
                  <th className="py-3 px-4">Officer</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Est Value</th>
                  <th className="py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-forest-800">{p.product_code}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{p.product_name}</td>
                    <td className="py-3 px-4 text-slate-600">{p.category_name}</td>
                    <td className="py-3 px-4 text-slate-600">{p.user_name}</td>
                    <td className="py-3 px-4 text-slate-600">{p.employee_name || 'Unassigned'}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        p.status === 'Recycled' ? 'bg-forest-100 text-forest-800' :
                        p.status === 'Collected' ? 'bg-teal-100 text-teal-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">${p.expected_price || '0.00'}</td>
                    <td className="py-3 px-4 text-slate-500">{new Date(p.created_at).toLocaleDateString()}</td>
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

export default Reports;
