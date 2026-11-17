import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  ClipboardList, Search, Filter, Eye, UserCheck, X, Loader2,
  Calendar, MapPin, Phone, User, CheckCircle2, AlertCircle, Clock,
  Truck, RefreshCw, XCircle, DollarSign, Image
} from 'lucide-react';

const ListedProducts = () => {
  const [searchParams] = useSearchParams();
  const initialViewId = searchParams.get('view');

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Modals
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [trackingHistory, setTrackingHistory] = useState([]);
  const [loadingModal, setLoadingModal] = useState(false);

  // Assign Modal
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assigningProduct, setAssigningProduct] = useState(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [assignRemarks, setAssignRemarks] = useState('');
  const [savingAssign, setSavingAssign] = useState(false);

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [search, statusFilter, categoryFilter]);

  useEffect(() => {
    if (initialViewId) {
      handleViewDetails(initialViewId);
    }
  }, [initialViewId]);

  const fetchMetadata = async () => {
    try {
      const [catsRes, empsRes] = await Promise.all([
        api.get('/categories'),
        api.get('/employees', { params: { status: 'Active' } })
      ]);
      if (catsRes.data.success) setCategories(catsRes.data.categories);
      if (empsRes.data.success) setEmployees(empsRes.data.employees);
    } catch {}
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/products', {
        params: { search, status: statusFilter, category_id: categoryFilter }
      });
      if (res.data.success) {
        setProducts(res.data.products);
      }
    } catch {
      toast.error('Failed to load listed products.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (id) => {
    try {
      setLoadingModal(true);
      const res = await api.get(`/products/${id}`);
      if (res.data.success) {
        setSelectedProduct(res.data.product);
        setTrackingHistory(res.data.tracking_history || []);
      }
    } catch {
      toast.error('Failed to load product details.');
    } finally {
      setLoadingModal(false);
    }
  };

  const handleOpenAssign = (product) => {
    setAssigningProduct(product);
    setSelectedEmployeeId(employees[0]?.id || '');
    setAssignRemarks('');
    setAssignModalOpen(true);
  };

  const handleSaveAssign = async (e) => {
    e.preventDefault();
    if (!selectedEmployeeId) {
      toast.error('Please select an active employee.');
      return;
    }

    try {
      setSavingAssign(true);
      const res = await api.post(`/products/${assigningProduct.id}/assign`, {
        employee_id: selectedEmployeeId,
        remarks: assignRemarks
      });

      if (res.data.success) {
        toast.success(res.data.message);
        setAssignModalOpen(false);
        fetchProducts();
        if (selectedProduct && selectedProduct.id === assigningProduct.id) {
          handleViewDetails(assigningProduct.id);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign product.');
    } finally {
      setSavingAssign(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">Pending</span>;
      case 'Assigned':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">Assigned</span>;
      case 'Under Investigation':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">Under Investigation</span>;
      case 'Collected':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800">Collected</span>;
      case 'Sent for Recycling':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">Sent for Recycling</span>;
      case 'Recycled':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-forest-100 text-forest-800">Recycled</span>;
      case 'Rejected':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">Rejected</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Listed Products Repository</h1>
          <p className="text-xs text-slate-500 mt-1">Review all user-submitted electronic waste, photos, inspection logs, and pickup statuses.</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Product ID, item name, user phone..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Assigned">Assigned</option>
            <option value="Under Investigation">Under Investigation</option>
            <option value="Collected">Collected</option>
            <option value="Sent for Recycling">Sent for Recycling</option>
            <option value="Recycled">Recycled</option>
            <option value="Rejected">Rejected</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 focus:outline-none"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.category_name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-forest-700" />
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No e-waste product requests found matching selected criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Product ID</th>
                  <th className="py-3.5 px-4">Device Details</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Citizen / User</th>
                  <th className="py-3.5 px-4">Pickup Date & Loc</th>
                  <th className="py-3.5 px-4">Assigned Officer</th>
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
                    <td className="py-3.5 px-4 text-slate-700">
                      <div>
                        <p className="font-medium">{p.user_name}</p>
                        <p className="text-[11px] text-slate-400">{p.contact_number || p.user_phone}</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <p className="font-medium text-slate-800">{p.pickup_date || 'TBD'}</p>
                      <p className="text-[11px] text-slate-400 truncate max-w-[140px]">{p.city_name || p.pickup_address}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      {p.employee_name ? (
                        <span className="font-semibold text-blue-700">{p.employee_name}</span>
                      ) : (
                        <button
                          onClick={() => handleOpenAssign(p)}
                          className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-200 inline-flex items-center gap-1"
                        >
                          <UserCheck className="w-3 h-3" />
                          <span>Assign</span>
                        </button>
                      )}
                    </td>
                    <td className="py-3.5 px-4">{getStatusBadge(p.status)}</td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleViewDetails(p.id)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:text-forest-800 hover:bg-emerald-50 text-xs font-semibold inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Product Details & Lifecycle Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-3xl w-full shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-forest-800 text-lg">{selectedProduct.product_code}</span>
                  {getStatusBadge(selectedProduct.status)}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mt-1">{selectedProduct.product_name}</h3>
              </div>
              <button onClick={() => setSelectedProduct(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="py-4 flex-1 overflow-y-auto space-y-6">
              {/* Product Specifications & Logistics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                <div>
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider mb-2">Device Information</h4>
                  <p><span className="text-slate-500">Category:</span> <span className="font-semibold text-slate-800">{selectedProduct.category_name}</span></p>
                  <p className="mt-1"><span className="text-slate-500">Brand / Maker:</span> <span className="font-semibold text-slate-800">{selectedProduct.brand || 'N/A'}</span></p>
                  <p className="mt-1"><span className="text-slate-500">Model / Type:</span> <span className="font-semibold text-slate-800">{selectedProduct.model_type || 'N/A'}</span></p>
                  <p className="mt-1"><span className="text-slate-500">Expected Scrap Value:</span> <span className="font-semibold text-emerald-700">${selectedProduct.expected_price || '0.00'}</span></p>
                  <p className="mt-1"><span className="text-slate-500">Device Description:</span> <span className="text-slate-700 block mt-0.5">{selectedProduct.description || 'None provided.'}</span></p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider mb-2">Pickup & Citizen Logistics</h4>
                  <p><span className="text-slate-500">Citizen:</span> <span className="font-semibold text-slate-800">{selectedProduct.user_name}</span></p>
                  <p className="mt-1"><span className="text-slate-500">Contact Number:</span> <span className="font-semibold text-slate-800">{selectedProduct.contact_number || selectedProduct.user_phone}</span></p>
                  <p className="mt-1"><span className="text-slate-500">Pickup Date:</span> <span className="font-semibold text-slate-800">{selectedProduct.pickup_date}</span></p>
                  <p className="mt-1"><span className="text-slate-500">Region:</span> <span className="font-semibold text-slate-800">{selectedProduct.city_name}, {selectedProduct.state_name}</span></p>
                  <p className="mt-1"><span className="text-slate-500">Address:</span> <span className="text-slate-700 block mt-0.5">{selectedProduct.pickup_address}</span></p>
                </div>
              </div>

              {/* Uploaded Photographs */}
              <div>
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Image className="w-4 h-4 text-emerald-600" />
                  <span>Uploaded Photographs</span>
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center h-48">
                    {selectedProduct.image_1 ? (
                      <a href={selectedProduct.image_1} target="_blank" rel="noreferrer" className="w-full h-full">
                        <img src={selectedProduct.image_1} alt="Product view 1" className="w-full h-full object-cover hover:scale-105 transition-transform" />
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400">Photo 1 not uploaded</span>
                    )}
                  </div>
                  <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center h-48">
                    {selectedProduct.image_2 ? (
                      <a href={selectedProduct.image_2} target="_blank" rel="noreferrer" className="w-full h-full">
                        <img src={selectedProduct.image_2} alt="Product view 2" className="w-full h-full object-cover hover:scale-105 transition-transform" />
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400">Photo 2 not uploaded</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Lifecycle Tracking Timeline */}
              <div>
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-3">
                  Audit Tracking History ({trackingHistory.length} events)
                </h4>
                <div className="relative pl-6 border-l-2 border-emerald-500 space-y-4">
                  {trackingHistory.map((step) => (
                    <div key={step.id} className="relative text-xs">
                      <div className="w-3 h-3 rounded-full bg-emerald-600 absolute -left-[31px] top-1 ring-4 ring-white" />
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{step.new_status}</span>
                        <span className="text-[10px] text-slate-400">{new Date(step.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-slate-600 mt-0.5 leading-relaxed">{step.remarks}</p>
                      <p className="text-[10px] text-emerald-800 font-semibold mt-1">Updated by: {step.updated_by}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              {(!selectedProduct.assigned_employee_id || selectedProduct.status === 'Pending') && (
                <button
                  onClick={() => handleOpenAssign(selectedProduct)}
                  className="px-4 py-2 rounded-xl bg-forest-800 hover:bg-forest-900 text-white text-xs font-semibold flex items-center gap-2"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Assign Field Employee</span>
                </button>
              )}
              <button
                onClick={() => setSelectedProduct(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 ml-auto"
              >
                Close Inspection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Employee Modal */}
      {assignModalOpen && assigningProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Assign Product to Inspector</h3>
              <button onClick={() => setAssignModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAssign} className="mt-4 space-y-4">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <span className="font-mono font-bold text-forest-800">{assigningProduct.product_code}</span>
                <p className="font-semibold text-slate-800 mt-0.5">{assigningProduct.product_name}</p>
                <p className="text-slate-500">Citizen: {assigningProduct.user_name} • {assigningProduct.pickup_address}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Available Officer *</label>
                <select
                  required
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Select Field Staff</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({e.employee_code}) - {e.contact_number}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assignment Remarks</label>
                <textarea
                  rows={2}
                  value={assignRemarks}
                  onChange={(e) => setAssignRemarks(e.target.value)}
                  placeholder="e.g. Please verify battery integrity and schedule on-site collection."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAssignModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAssign}
                  className="px-5 py-2 rounded-xl bg-forest-800 hover:bg-forest-900 text-white text-xs font-semibold"
                >
                  {savingAssign ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListedProducts;
