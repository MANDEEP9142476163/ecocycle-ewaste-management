import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  Inbox, Plus, Eye, Trash2, ArrowRight, Loader2, Calendar,
  AlertTriangle, CheckCircle2, Clock, Truck, RefreshCw, XCircle
} from 'lucide-react';

const UserProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  useEffect(() => {
    fetchMyProducts();
  }, []);

  const fetchMyProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/products');
      if (res.data.success) {
        setProducts(res.data.products);
      }
    } catch {
      toast.error('Failed to load your products.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await api.delete(`/products/${id}`);
      if (res.data.success) {
        toast.success('Product request deleted.');
        setDeleteConfirmId(null);
        fetchMyProducts();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete request.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Listed E-Waste Products</h1>
          <p className="text-xs text-slate-500 mt-1">Review all electronic items submitted from your citizen account.</p>
        </div>
        <Link
          to="/user/submit-product"
          className="px-4 py-2.5 rounded-xl bg-forest-800 hover:bg-forest-900 text-white font-semibold text-xs shadow-sm flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>List Another Product</span>
        </Link>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-forest-700" />
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <p className="font-semibold text-slate-700">You haven't listed any e-waste products yet.</p>
            <p className="text-xs text-slate-500 mt-1 mb-4">Help the environment by scheduling collection for old devices.</p>
            <Link
              to="/user/submit-product"
              className="px-4 py-2 rounded-xl bg-forest-800 text-white font-semibold text-xs inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>List E-Waste Now</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Product ID</th>
                  <th className="py-3.5 px-4">Device Details</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Submission Date</th>
                  <th className="py-3.5 px-4">Target Pickup</th>
                  <th className="py-3.5 px-4">Assigned Inspector</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-forest-800">{p.product_code}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <div>
                        <p>{p.product_name}</p>
                        <p className="text-[11px] text-slate-400 font-normal">
                          {p.brand ? `${p.brand} ` : ''}{p.model_type || ''}
                        </p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{p.category_name}</td>
                    <td className="py-3.5 px-4 text-slate-500">{new Date(p.created_at).toLocaleDateString()}</td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">{p.pickup_date}</td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {p.employee_name ? (
                        <span className="font-semibold text-blue-700">{p.employee_name}</span>
                      ) : (
                        <span className="text-amber-600">Pending Assignment</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
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
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <Link
                        to={`/user/track?id=${p.id}`}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:text-forest-800 hover:bg-emerald-50 text-xs font-semibold inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Track</span>
                      </Link>

                      {p.status === 'Pending' && (
                        <button
                          onClick={() => setDeleteConfirmId(p.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete Request"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Cancel Pickup Request?</h3>
            <p className="text-xs text-slate-500 mt-2">
              Are you sure you want to delete this e-waste submission? This action cannot be undone.
            </p>
            <div className="flex justify-center gap-2 mt-5">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                Keep Request
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProducts;
