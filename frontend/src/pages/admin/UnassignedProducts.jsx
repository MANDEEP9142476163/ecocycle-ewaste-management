import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Inbox, UserCheck, Loader2, Calendar, MapPin, X, ArrowRight } from 'lucide-react';

const UnassignedProducts = () => {
  const [products, setProducts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [prodsRes, empsRes] = await Promise.all([
        api.get('/products', { params: { unassigned: 'true' } }),
        api.get('/employees', { params: { status: 'Active' } })
      ]);
      if (prodsRes.data.success) setProducts(prodsRes.data.products);
      if (empsRes.data.success) setEmployees(empsRes.data.employees);
    } catch {
      toast.error('Failed to load unassigned products.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAssign = (p) => {
    setSelectedProduct(p);
    setSelectedEmployeeId(employees[0]?.id || '');
    setRemarks('');
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!selectedEmployeeId) {
      toast.error('Please choose an employee.');
      return;
    }

    try {
      setSaving(true);
      const res = await api.post(`/products/${selectedProduct.id}/assign`, {
        employee_id: selectedEmployeeId,
        remarks
      });
      if (res.data.success) {
        toast.success(res.data.message);
        setSelectedProduct(null);
        loadData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Assignment failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Unassigned Product Requests</h1>
          <p className="text-xs text-slate-500 mt-1">Pending citizen requests waiting for field inspector assignment.</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-amber-800 flex items-center gap-2">
          <Inbox className="w-4 h-4 text-amber-600" />
          <span>{products.length} Pending Assignments</span>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-forest-700" />
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            <p className="font-semibold text-slate-700">All caught up! 🎉</p>
            <p className="text-xs text-slate-400 mt-1">No unassigned product requests pending at this time.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Code</th>
                  <th className="py-3.5 px-4">Product Name</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Citizen Name</th>
                  <th className="py-3.5 px-4">Pickup Address</th>
                  <th className="py-3.5 px-4">Submission Date</th>
                  <th className="py-3.5 px-4 text-right">Assign Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-forest-800">{p.product_code}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{p.product_name}</td>
                    <td className="py-3.5 px-4 text-slate-600">{p.category_name}</td>
                    <td className="py-3.5 px-4 text-slate-700">
                      <p className="font-medium">{p.user_name}</p>
                      <p className="text-[11px] text-slate-400">{p.contact_number}</p>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                      {p.pickup_address}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenAssign(p)}
                        className="px-3.5 py-1.5 rounded-xl bg-forest-800 hover:bg-forest-900 text-white font-semibold text-xs inline-flex items-center gap-1.5 shadow-sm"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Assign Now</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assign Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Assign Product to Inspector</h3>
              <button onClick={() => setSelectedProduct(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssign} className="mt-4 space-y-4">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <span className="font-mono font-bold text-forest-800">{selectedProduct.product_code}</span>
                <p className="font-semibold text-slate-800 mt-0.5">{selectedProduct.product_name}</p>
                <p className="text-slate-500">Citizen: {selectedProduct.user_name} • {selectedProduct.contact_number}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Field Officer *</label>
                <select
                  required
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Select Employee</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({e.employee_code}) - {e.contact_number}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Remarks for Inspector</label>
                <textarea
                  rows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Please verify hardware specifications on-site."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-forest-800 hover:bg-forest-900 text-white text-xs font-semibold"
                >
                  {saving ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnassignedProducts;
