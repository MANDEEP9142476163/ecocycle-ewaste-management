import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  Activity, CheckCircle2, XCircle, Loader2, ArrowLeft, Image,
  Calendar, MapPin, Phone, User, DollarSign, Clock, Truck, AlertTriangle
} from 'lucide-react';

const ProductInvestigation = () => {
  const [searchParams] = useSearchParams();
  const productId = searchParams.get('id');
  const navigate = useNavigate();

  const [assignedList, setAssignedList] = useState([]);
  const [selectedId, setSelectedId] = useState(productId || '');
  const [product, setProduct] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Actions
  const [actionType, setActionType] = useState(''); // 'investigate', 'collect', 'reject'
  const [remarks, setRemarks] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [collectionDate, setCollectionDate] = useState(new Date().toISOString().split('T')[0]);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchAssignedList();
  }, []);

  useEffect(() => {
    if (selectedId) {
      loadProductDetails(selectedId);
    }
  }, [selectedId]);

  const fetchAssignedList = async () => {
    try {
      setLoading(true);
      const res = await api.get('/products');
      if (res.data.success) {
        setAssignedList(res.data.products);
        if (!selectedId && res.data.products.length > 0) {
          setSelectedId(res.data.products[0].id);
        }
      }
    } catch {
      toast.error('Failed to load assigned products list.');
    } finally {
      setLoading(false);
    }
  };

  const loadProductDetails = async (id) => {
    try {
      setLoading(true);
      const res = await api.get(`/products/${id}`);
      if (res.data.success) {
        setProduct(res.data.product);
        setHistory(res.data.tracking_history || []);
        setActionType('');
        setRemarks('');
        setRejectionReason('');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Access denied or product not found.');
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  // 1. Mark Under Investigation
  const handleStartInvestigation = async () => {
    try {
      setProcessing(true);
      const res = await api.post(`/products/${product.id}/investigate`, { remarks });
      if (res.data.success) {
        toast.success('Investigation started. Device status updated to Under Investigation.');
        loadProductDetails(product.id);
        fetchAssignedList();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update investigation.');
    } finally {
      setProcessing(false);
    }
  };

  // 2. Accept Collection
  const handleCollect = async (e) => {
    e.preventDefault();
    try {
      setProcessing(true);
      const res = await api.post(`/products/${product.id}/collect`, {
        remarks: remarks || 'Product inspected on-site and successfully collected from user location.',
        collection_date: collectionDate
      });
      if (res.data.success) {
        toast.success('Product successfully collected and added to logistics queue!');
        loadProductDetails(product.id);
        fetchAssignedList();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Collection update failed.');
    } finally {
      setProcessing(false);
    }
  };

  // 3. Reject Product (Mandatory rejection reason)
  const handleReject = async (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      toast.error('Rejection reason is mandatory.');
      return;
    }

    try {
      setProcessing(true);
      const res = await api.post(`/products/${product.id}/reject`, {
        rejection_reason: rejectionReason
      });
      if (res.data.success) {
        toast.success('Product marked as Rejected.');
        loadProductDetails(product.id);
        fetchAssignedList();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject product.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Product Investigation & Verification Desk</h1>
          <p className="text-xs text-slate-500 mt-1">Conduct electronic component verification and decide whether to Collect or Reject the item.</p>
        </div>

        {/* Item Switcher Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600">Select Item:</span>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-semibold focus:ring-2 focus:ring-emerald-500 shadow-sm"
          >
            {assignedList.map((p) => (
              <option key={p.id} value={p.id}>
                {p.product_code} - {p.product_name} ({p.status})
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="min-h-[50vh] flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-forest-700 mb-2" />
          <p className="text-xs text-slate-500">Loading product verification file...</p>
        </div>
      ) : !product ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-400 text-sm">
          No product currently selected or assigned. Please choose an item from your queue.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Inspection View (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-forest-800 text-lg">{product.product_code}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      product.status === 'Recycled' ? 'bg-forest-100 text-forest-800' :
                      product.status === 'Collected' ? 'bg-teal-100 text-teal-800' :
                      product.status === 'Under Investigation' ? 'bg-purple-100 text-purple-800' :
                      product.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {product.status}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mt-1">{product.product_name}</h2>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-400">Expected Value</span>
                  <p className="text-lg font-extrabold text-emerald-700">${product.expected_price || '0.00'}</p>
                </div>
              </div>

              {/* Specs & Citizen Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 text-xs">
                <div className="space-y-1.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider mb-2">Item Specifications</h4>
                  <p><span className="text-slate-500">Category:</span> <span className="font-semibold text-slate-800">{product.category_name}</span></p>
                  <p><span className="text-slate-500">Brand:</span> <span className="font-semibold text-slate-800">{product.brand || 'Generic'}</span></p>
                  <p><span className="text-slate-500">Model:</span> <span className="font-semibold text-slate-800">{product.model_type || 'N/A'}</span></p>
                  <p className="pt-1"><span className="text-slate-500">Defects / Description:</span></p>
                  <p className="text-slate-700 italic bg-white p-2 rounded-lg border border-slate-200">{product.description || 'No description provided by user.'}</p>
                </div>

                <div className="space-y-1.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider mb-2">Citizen Location & Contact</h4>
                  <p><span className="text-slate-500">Citizen:</span> <span className="font-semibold text-slate-800">{product.user_name}</span></p>
                  <p><span className="text-slate-500">Contact Number:</span> <span className="font-semibold text-slate-800">{product.contact_number || product.user_phone}</span></p>
                  <p><span className="text-slate-500">Target Pickup Date:</span> <span className="font-semibold text-slate-800">{product.pickup_date}</span></p>
                  <p><span className="text-slate-500">Region:</span> <span className="font-semibold text-slate-800">{product.city_name}, {product.state_name}</span></p>
                  <p className="pt-1"><span className="text-slate-500">Address:</span></p>
                  <p className="text-slate-700 bg-white p-2 rounded-lg border border-slate-200">{product.pickup_address}</p>
                </div>
              </div>

              {/* Photos */}
              <div className="mt-5">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2">Uploaded Item Photos</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-44 rounded-2xl border border-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center">
                    {product.image_1 ? (
                      <a href={product.image_1} target="_blank" rel="noreferrer" className="w-full h-full">
                        <img src={product.image_1} alt="Product Photo 1" className="w-full h-full object-cover hover:scale-105 transition-transform" />
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400">Photo 1 Not Uploaded</span>
                    )}
                  </div>
                  <div className="h-44 rounded-2xl border border-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center">
                    {product.image_2 ? (
                      <a href={product.image_2} target="_blank" rel="noreferrer" className="w-full h-full">
                        <img src={product.image_2} alt="Product Photo 2" className="w-full h-full object-cover hover:scale-105 transition-transform" />
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400">Photo 2 Not Uploaded</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ACTION PANEL */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 text-base mb-1">Field Decision & Workflow Actions</h3>
              <p className="text-xs text-slate-500 mb-4">
                Record your physical inspection results and advance the item status.
              </p>

              {product.status === 'Assigned' && (
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-between">
                  <div>
                    <h5 className="font-bold text-blue-900 text-xs">Step 1: Start Investigation</h5>
                    <p className="text-blue-700 text-[11px] mt-0.5">Let the user and administrator know you are investigating this item.</p>
                  </div>
                  <button
                    onClick={handleStartInvestigation}
                    disabled={processing}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5"
                  >
                    {processing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Activity className="w-3.5 h-3.5" />}
                    <span>Mark Under Investigation</span>
                  </button>
                </div>
              )}

              {['Assigned', 'Under Investigation'].includes(product.status) && (
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setActionType('collect')}
                      className={`flex-1 py-3 px-4 rounded-2xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                        actionType === 'collect'
                          ? 'bg-teal-600 text-white border-teal-600 shadow-md shadow-teal-600/20'
                          : 'bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Accept Collection</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActionType('reject')}
                      className={`flex-1 py-3 px-4 rounded-2xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                        actionType === 'reject'
                          ? 'bg-red-600 text-white border-red-600 shadow-md shadow-red-600/20'
                          : 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100'
                      }`}
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject Product</span>
                    </button>
                  </div>

                  {/* Accept Collection Form */}
                  {actionType === 'collect' && (
                    <form onSubmit={handleCollect} className="p-4 rounded-2xl bg-teal-50/50 border border-teal-200 space-y-3 text-xs animate-in fade-in">
                      <h4 className="font-bold text-teal-950">Record Collection Receipt & Remarks</h4>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Collection Date</label>
                        <input
                          type="date"
                          required
                          value={collectionDate}
                          onChange={(e) => setCollectionDate(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Investigation Remarks / Condition Notes</label>
                        <textarea
                          rows={2}
                          value={remarks}
                          onChange={(e) => setRemarks(e.target.value)}
                          placeholder="e.g. Verified circuit board intact, screen damaged as described. Accepted and loaded to vehicle."
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={processing}
                        className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-sm flex items-center justify-center gap-1.5"
                      >
                        {processing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Truck className="w-3.5 h-3.5" />}
                        <span>Confirm & Update Status to Collected</span>
                      </button>
                    </form>
                  )}

                  {/* Reject Product Form */}
                  {actionType === 'reject' && (
                    <form onSubmit={handleReject} className="p-4 rounded-2xl bg-red-50/50 border border-red-200 space-y-3 text-xs animate-in fade-in">
                      <div className="flex items-center gap-2 text-red-700 font-bold">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Rejection Requires Justification</span>
                      </div>
                      <p className="text-slate-600 text-[11px]">
                        The citizen will be formally notified with this explanation.
                      </p>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Mandatory Rejection Reason *</label>
                        <textarea
                          rows={3}
                          required
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="e.g. Hazardous chemical leakage detected / Item is non-electronic / Missing major internal components."
                          className="w-full px-3 py-2 rounded-xl border border-red-300 text-xs bg-white focus:ring-2 focus:ring-red-500"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={processing}
                        className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-sm flex items-center justify-center gap-1.5"
                      >
                        {processing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                        <span>Confirm Rejection of Item</span>
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* Already Processed States */}
              {['Collected', 'Sent for Recycling', 'Recycled', 'Rejected'].includes(product.status) && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                  <p className="font-semibold text-slate-800">
                    Product is in stage: <span className="text-forest-800">{product.status}</span>
                  </p>
                  <p className="mt-1 text-[11px]">
                    {product.status === 'Collected' && 'Next step: Send this item to the recycling facility from the "Send for Recycling" module.'}
                    {product.status === 'Sent for Recycling' && 'Next step: Complete recycling certification once raw metals and polymers are dismantled.'}
                    {product.status === 'Recycled' && 'This product lifecycle is 100% complete and certified green.'}
                    {product.status === 'Rejected' && 'This product was rejected during investigation.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Tracking Audit History (1 col) */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
            <h3 className="font-bold text-slate-900 text-base mb-1">State Machine Audit Log</h3>
            <p className="text-xs text-slate-500 mb-4">Immutable chronological tracking</p>

            <div className="relative pl-6 border-l-2 border-emerald-500 space-y-4 text-xs flex-1">
              {history.map((step) => (
                <div key={step.id} className="relative">
                  <div className="w-3 h-3 rounded-full bg-emerald-600 absolute -left-[31px] top-1 ring-4 ring-white" />
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{step.new_status}</span>
                    <span className="text-[10px] text-slate-400">{new Date(step.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-slate-600 mt-1 leading-relaxed">{step.remarks}</p>
                  <p className="text-[10px] text-emerald-800 font-semibold mt-1">Logged by: {step.updated_by}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductInvestigation;
