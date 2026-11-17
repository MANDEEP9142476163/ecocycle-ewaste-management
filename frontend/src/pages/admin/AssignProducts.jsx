import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { UserCheck, Search, Loader2, CheckCircle2, Clock, X, ArrowRight } from 'lucide-react';

const AssignProducts = () => {
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
        api.get('/products'),
        api.get('/employees', { params: { status: 'Active' } })
      ]);
      if (prodsRes.data.success) {
        // Show pending or unassigned or products ready for assignment/reassignment
        setProducts(prodsRes.data.products);
      }
      if (empsRes.data.success) {
        setEmployees(empsRes.data.employees);
      }
    } catch {
      toast.error('Failed to load data for assignment.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (p) => {
    setSelectedProduct(p);
    setSelectedEmployeeId(p.assigned_employee_id || employees[0]?.id || '');
    setRemarks('');
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!selectedEmployeeId) {
      toast.error('Please select an employee.');
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
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Assign Field Employees</h1>
        <p className="text-xs text-slate-500 mt-1">Designate authorized officers to investigate and collect citizen e-waste submissions.</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-forest-700" />
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No products requiring assignment at this time.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Product Code</th>
                  <th className="py-3.5 px-4">Device & Category</th>
                  <th className="py-3.5 px-4">Citizen Contact</th>
                  <th className="py-3.5 px-4">Pickup Address</th>
                  <th className="py-3.5 px-4">Current Status</th>
                  <th className="py-3.5 px-4">Assigned Staff</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-forest-800">{p.product_code}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <p>{p.product_name}</p>
                      <p className="text-[11px] text-slate-400 font-normal">{p.category_name}</p>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <p className="font-medium text-slate-800">{p.user_name}</p>
                      <p className="text-[11px] text-slate-400">{p.contact_number}</p>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                      {p.pickup_address}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        p.status === 'Pending' ? 'bg-amber-100 text-amber-800' :
                        p.status === 'Assigned' ? 'bg-blue-100 text-blue-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {p.employee_name ? (
                        <span className="font-semibold text-blue-700">{p.employee_name} ({p.employee_code})</span>
                      ) : (
                        <span className="text-amber-600 font-semibold italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenModal(p)}
                        className="px-3.5 py-1.5 rounded-xl bg-forest-800 hover:bg-forest-900 text-white font-semibold text-xs inline-flex items-center gap-1.5 shadow-sm"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>{p.assigned_employee_id ? 'Reassign' : 'Assign Officer'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assignment Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Assign Field Officer</h3>
              <button onClick={() => setSelectedProduct(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssign} className="mt-4 space-y-4">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                <span className="font-mono font-bold text-forest-800">{selectedProduct.product_code}</span>
                <p className="font-semibold text-slate-800 mt-0.5">{selectedProduct.product_name}</p>
                <p className="text-slate-500 mt-1">Pickup Location: {selectedProduct.pickup_address}</p>
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Remarks for Officer</label>
                <textarea
                  rows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Schedule investigation within 48 hours."
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

export default AssignProducts;
