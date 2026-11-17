import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  UserCheck, Plus, Edit2, Trash2, Loader2, AlertTriangle, X,
  Search, Phone, Mail, MapPin, Calendar, CheckCircle2, XCircle, Briefcase, Eye
} from 'lucide-react';

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [viewDetails, setViewDetails] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Form fields
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    contact_number: '',
    address: '',
    password: '',
    status: 'Active',
    joining_date: new Date().toISOString().split('T')[0]
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, [search, statusFilter]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await api.get('/employees', {
        params: { search, status: statusFilter }
      });
      if (res.data.success) {
        setEmployees(res.data.employees);
      }
    } catch (err) {
      toast.error('Failed to load employees.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingEmployee(null);
    setFormData({
      name: '',
      email: '',
      contact_number: '',
      address: '',
      password: '',
      status: 'Active',
      joining_date: new Date().toISOString().split('T')[0]
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (emp) => {
    setEditingEmployee(emp);
    setFormData({
      name: emp.name,
      email: emp.email,
      contact_number: emp.contact_number,
      address: emp.address || '',
      password: '',
      status: emp.status,
      joining_date: emp.joining_date ? emp.joining_date.split('T')[0] : ''
    });
    setModalOpen(true);
  };

  const handleOpenView = async (id) => {
    try {
      const res = await api.get(`/employees/${id}`);
      if (res.data.success) {
        setViewDetails(res.data.employee);
      }
    } catch {
      toast.error('Failed to fetch employee details.');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.contact_number) {
      toast.error('Name, email, and contact number are required.');
      return;
    }

    if (!editingEmployee && (!formData.password || formData.password.length < 6)) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    try {
      setSaving(true);
      if (editingEmployee) {
        const res = await api.put(`/employees/${editingEmployee.id}`, formData);
        if (res.data.success) toast.success('Employee updated successfully.');
      } else {
        const res = await api.post('/employees', formData);
        if (res.data.success) toast.success(`Employee ${formData.name} added successfully!`);
      }
      setModalOpen(false);
      fetchEmployees();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save employee.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await api.delete(`/employees/${id}`);
      if (res.data.success) {
        toast.success(res.data.message || 'Employee processed successfully.');
        setDeleteConfirmId(null);
        fetchEmployees();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete employee.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Employee Management</h1>
          <p className="text-xs text-slate-500 mt-1">Manage field investigation officers, inspectors, and collection personnel.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-forest-800 hover:bg-forest-900 text-white font-semibold text-xs shadow-sm flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Employee</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by code, name, email, phone..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-xs font-semibold text-slate-500">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="Active">Active Only</option>
            <option value="Inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-forest-700" />
          </div>
        ) : employees.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No employees found matching criteria. Click "Add New Employee" to register staff.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Code</th>
                  <th className="py-3.5 px-4">Officer Name</th>
                  <th className="py-3.5 px-4">Contact Info</th>
                  <th className="py-3.5 px-4">Joining Date</th>
                  <th className="py-3.5 px-4">Performance (Assigned/Recycled)</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-forest-800">{e.employee_code}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs">
                          {e.name.charAt(0)}
                        </div>
                        <div>
                          <p>{e.name}</p>
                          <p className="text-[11px] text-slate-400 font-normal">{e.address || 'Field Headquarters'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 space-y-0.5">
                      <p className="flex items-center gap-1.5"><Mail className="w-3 h-3 text-slate-400" /> {e.email}</p>
                      <p className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-slate-400" /> {e.contact_number}</p>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {e.joining_date ? new Date(e.joining_date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2 font-medium">
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700">{e.total_assigned || 0} assigned</span>
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">{e.total_recycled || 0} recycled</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        e.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'
                      }`}>
                        {e.status === 'Active' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        <span>{e.status}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1.5">
                      <button
                        onClick={() => handleOpenView(e.id)}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                        title="View Assigned Requests"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(e)}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-forest-800 hover:bg-slate-100"
                        title="Edit Officer Details"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(e.id)}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-red-600 hover:bg-red-50"
                        title="Delete or Deactivate"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Employee Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">
                {editingEmployee ? `Edit Employee (${editingEmployee.employee_code})` : 'Register New Field Employee'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Alex Mercer"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Official Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="alex@ecocycle.org"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone *</label>
                  <input
                    type="tel"
                    required
                    value={formData.contact_number}
                    onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                    placeholder="+1 415-555-0142"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Joining Date</label>
                  <input
                    type="date"
                    value={formData.joining_date}
                    onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Address / Hub Depot</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Street address or depot assignment"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {editingEmployee ? 'Reset Password (optional)' : 'Login Password *'}
                  </label>
                  <input
                    type="password"
                    required={!editingEmployee}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={editingEmployee ? 'Leave blank to retain' : 'Min 6 characters'}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Account Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-forest-800 hover:bg-forest-900 text-white text-xs font-semibold"
                >
                  {saving ? 'Saving...' : editingEmployee ? 'Update Officer' : 'Register Officer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details & Assigned Requests Drawer */}
      {viewDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl border border-slate-200 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-forest-800 text-white flex items-center justify-center font-bold">
                  {viewDetails.employee_code}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{viewDetails.name}</h3>
                  <p className="text-xs text-slate-500">{viewDetails.email} • {viewDetails.contact_number}</p>
                </div>
              </div>
              <button onClick={() => setViewDetails(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 flex-1 overflow-y-auto space-y-4">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Assigned Product Requests ({viewDetails.assignedProducts?.length || 0})
              </h4>

              {viewDetails.assignedProducts?.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No product requests currently assigned to this employee.</p>
              ) : (
                <div className="space-y-2">
                  {viewDetails.assignedProducts.map((p) => (
                    <div key={p.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs flex justify-between items-center">
                      <div>
                        <span className="font-mono font-bold text-forest-800">{p.product_code}</span>
                        <p className="font-semibold text-slate-800 mt-0.5">{p.product_name} ({p.category_name})</p>
                        <p className="text-slate-500 text-[11px]">User: {p.user_name} • {p.user_phone}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        p.status === 'Recycled' ? 'bg-forest-100 text-forest-800' :
                        p.status === 'Collected' ? 'bg-teal-100 text-teal-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {p.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setViewDetails(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete/Deactivate Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Remove or Deactivate Staff</h3>
            <p className="text-xs text-slate-500 mt-2">
              If this employee has assigned active tasks, their account will be set to Inactive to preserve audit history.
            </p>
            <div className="flex justify-center gap-2 mt-5">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
              >
                Proceed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeManagement;
