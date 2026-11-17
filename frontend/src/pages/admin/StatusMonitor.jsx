import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  Activity, Clock, CheckCircle2, AlertCircle, Truck, RefreshCw,
  XCircle, Eye, Loader2, X, Image
} from 'lucide-react';

const StatusMonitor = () => {
  const [products, setProducts] = useState([]);
  const [activeTab, setActiveTab] = useState('All');
  const [loading, setLoading] = useState(true);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [trackingHistory, setTrackingHistory] = useState([]);
  const [loadingModal, setLoadingModal] = useState(false);

  const statuses = [
    'All',
    'Pending',
    'Assigned',
    'Under Investigation',
    'Collected',
    'Sent for Recycling',
    'Recycled',
    'Rejected'
  ];

  useEffect(() => {
    fetchProducts();
  }, [activeTab]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/products', {
        params: { status: activeTab === 'All' ? undefined : activeTab }
      });
      if (res.data.success) {
        setProducts(res.data.products);
      }
    } catch {
      toast.error('Failed to load status records.');
    } finally {
      setLoading(false);
    }
  };

  const handleInspect = async (id) => {
    try {
      setLoadingModal(true);
      const res = await api.get(`/products/${id}`);
      if (res.data.success) {
        setSelectedProduct(res.data.product);
        setTrackingHistory(res.data.tracking_history || []);
      }
    } catch {
      toast.error('Failed to load audit history.');
    } finally {
      setLoadingModal(false);
    }
  };

  const getStatusIcon = (st) => {
    switch (st) {
      case 'Pending': return <Clock className="w-4 h-4 text-amber-500" />;
      case 'Assigned': return <CheckCircle2 className="w-4 h-4 text-blue-500" />;
      case 'Under Investigation': return <Activity className="w-4 h-4 text-purple-500" />;
      case 'Collected': return <Truck className="w-4 h-4 text-teal-500" />;
      case 'Sent for Recycling': return <RefreshCw className="w-4 h-4 text-indigo-500" />;
      case 'Recycled': return <RefreshCw className="w-4 h-4 text-emerald-600" />;
      case 'Rejected': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Activity className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Lifecycle Status Monitor</h1>
        <p className="text-xs text-slate-500 mt-1">Multi-stage pipeline tracking all 7 official e-waste stages.</p>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none bg-white p-2 rounded-2xl border border-slate-200">
        {statuses.map((st) => (
          <button
            key={st}
            onClick={() => setActiveTab(st)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === st
                ? 'bg-forest-800 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {st !== 'All' && getStatusIcon(st)}
            <span>{st}</span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-forest-700" />
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No products in status "{activeTab}".
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Code</th>
                  <th className="py-3.5 px-4">Product Name</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Citizen</th>
                  <th className="py-3.5 px-4">Inspector / Officer</th>
                  <th className="py-3.5 px-4">Current Status</th>
                  <th className="py-3.5 px-4">Updated At</th>
                  <th className="py-3.5 px-4 text-right">Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-forest-800">{p.product_code}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{p.product_name}</td>
                    <td className="py-3.5 px-4 text-slate-600">{p.category_name}</td>
                    <td className="py-3.5 px-4 text-slate-600">{p.user_name}</td>
                    <td className="py-3.5 px-4 text-slate-700">
                      {p.employee_name ? (
                        <span className="font-semibold text-blue-700">{p.employee_name}</span>
                      ) : (
                        <span className="text-amber-600">Pending Assignment</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        p.status === 'Recycled' ? 'bg-forest-100 text-forest-800' :
                        p.status === 'Collected' ? 'bg-teal-100 text-teal-800' :
                        p.status === 'Sent for Recycling' ? 'bg-indigo-100 text-indigo-800' :
                        p.status === 'Under Investigation' ? 'bg-purple-100 text-purple-800' :
                        p.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                        p.status === 'Assigned' ? 'bg-blue-100 text-blue-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {getStatusIcon(p.status)}
                        <span>{p.status}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(p.updated_at || p.created_at).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleInspect(p.id)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:text-forest-800 hover:bg-emerald-50 text-xs font-semibold inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Timeline</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Audit History Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl border border-slate-200 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="font-mono font-bold text-forest-800 text-sm">{selectedProduct.product_code}</span>
                <h3 className="font-bold text-slate-900 text-base">{selectedProduct.product_name}</h3>
              </div>
              <button onClick={() => setSelectedProduct(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 flex-1 overflow-y-auto space-y-4">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Full Immutable State History
              </h4>
              <div className="relative pl-6 border-l-2 border-emerald-500 space-y-4 text-xs">
                {trackingHistory.map((h) => (
                  <div key={h.id} className="relative">
                    <div className="w-3 h-3 rounded-full bg-emerald-600 absolute -left-[31px] top-1 ring-4 ring-white" />
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm">{h.new_status}</span>
                      <span className="text-[10px] text-slate-400">{new Date(h.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-slate-600 mt-1 leading-relaxed">{h.remarks}</p>
                    <p className="text-[11px] text-emerald-800 font-semibold mt-1">Logged by: {h.updated_by}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedProduct(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatusMonitor;
