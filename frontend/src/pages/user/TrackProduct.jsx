import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  Activity, CheckCircle2, Clock, Truck, RefreshCw, XCircle,
  AlertTriangle, Loader2, ArrowLeft, Image, ShieldCheck, Sparkles
} from 'lucide-react';

const TrackProduct = () => {
  const [searchParams] = useSearchParams();
  const initialId = searchParams.get('id');

  const [myProducts, setMyProducts] = useState([]);
  const [selectedId, setSelectedId] = useState(initialId || '');
  const [product, setProduct] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyProducts();
  }, []);

  useEffect(() => {
    if (selectedId) {
      fetchTrackDetails(selectedId);
    }
  }, [selectedId]);

  const fetchMyProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/products');
      if (res.data.success) {
        setMyProducts(res.data.products);
        if (!selectedId && res.data.products.length > 0) {
          setSelectedId(res.data.products[0].id);
        }
      }
    } catch {
      toast.error('Failed to load products list.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTrackDetails = async (id) => {
    try {
      setLoading(true);
      const res = await api.get(`/products/${id}`);
      if (res.data.success) {
        setProduct(res.data.product);
        setHistory(res.data.tracking_history || []);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load tracking status.');
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  // Determine stage progression index (0 to 5)
  const getStageIndex = (status) => {
    switch (status) {
      case 'Pending': return 0;
      case 'Assigned': return 1;
      case 'Under Investigation': return 2;
      case 'Collected': return 3;
      case 'Sent for Recycling': return 4;
      case 'Recycled': return 5;
      case 'Rejected': return -1;
      default: return 0;
    }
  };

  const steps = [
    { title: 'Request Submitted', desc: 'Pickup scheduled by citizen' },
    { title: 'Officer Assigned', desc: 'Field inspector dispatched' },
    { title: 'Investigation', desc: 'Hardware & condition audit' },
    { title: 'Doorstep Collection', desc: 'Collected & loaded for transit' },
    { title: 'Sent for Recycling', desc: 'Dispatched to recovery plant' },
    { title: 'Recycling Completed', desc: '100% circular certified' }
  ];

  const currentStageIdx = product ? getStageIndex(product.status) : 0;
  const isRejected = product?.status === 'Rejected';

  // Find rejection reason from tracking history if rejected
  const rejectionEvent = isRejected ? history.find(h => h.new_status === 'Rejected') : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">E-Waste Lifecycle Tracking</h1>
          <p className="text-xs text-slate-500 mt-1">Real-time status tracking from submission to circular raw material recovery.</p>
        </div>

        {/* Product Picker */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600">Track Item:</span>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-semibold focus:ring-2 focus:ring-emerald-500 shadow-sm"
          >
            {myProducts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.product_code} - {p.product_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="min-h-[50vh] flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-forest-700 mb-2" />
          <p className="text-xs text-slate-500">Retrieving lifecycle state machine data...</p>
        </div>
      ) : !product ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-400 text-sm">
          No product selected for tracking. Please submit an electronic item or choose one above.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="font-mono font-bold text-forest-800 text-lg">{product.product_code}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    product.status === 'Recycled' ? 'bg-forest-100 text-forest-800' :
                    product.status === 'Collected' ? 'bg-teal-100 text-teal-800' :
                    product.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                    'bg-amber-100 text-amber-800'
                  }`}>
                    {product.status}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 mt-1">{product.product_name}</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Category: {product.category_name} • Scheduled Pickup: {product.pickup_date}
                </p>
              </div>

              {product.assigned_employee_id && (
                <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100 text-xs text-blue-900 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                    {product.employee_name?.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold">{product.employee_name} ({product.employee_code})</p>
                    <p className="text-[11px] text-blue-700">Assigned Field Inspector</p>
                  </div>
                </div>
              )}
            </div>

            {/* Rejection Alert Box */}
            {isRejected && (
              <div className="mt-6 p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3 text-xs">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-red-900 text-sm">Product Pickup Request Rejected</h4>
                  <p className="text-red-700 mt-1 font-medium leading-relaxed">
                    Reason: {rejectionEvent?.remarks || 'Item does not meet safe electronic recycling standards.'}
                  </p>
                  <p className="text-red-500 text-[11px] mt-1">
                    Recorded by field inspector: {rejectionEvent?.updated_by || 'Staff'}
                  </p>
                </div>
              </div>
            )}

            {/* 6-STEP VISUAL PROGRESSION TIMELINE */}
            {!isRejected && (
              <div className="mt-8 pt-6 border-t border-slate-100">
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-6">
                  Lifecycle Progress (Step {currentStageIdx + 1} of 6)
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                  {steps.map((st, i) => {
                    const isDone = i <= currentStageIdx;
                    const isCurrent = i === currentStageIdx;

                    return (
                      <div
                        key={i}
                        className={`p-3.5 rounded-2xl border transition-all ${
                          isDone
                            ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                            : 'bg-slate-50 border-slate-200 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            isDone ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                          }`}>
                            {i + 1}
                          </span>
                          {isDone && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                        </div>
                        <h4 className="font-bold text-xs">{st.title}</h4>
                        <p className="text-[10px] mt-1 line-clamp-2 leading-relaxed">{st.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Audit Logs & Item Details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Timeline Audit Logs (2 cols) */}
            <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 text-base mb-1">State Machine Audit Log</h3>
              <p className="text-xs text-slate-500 mb-6">Chronological verification history with timestamps</p>

              <div className="relative pl-6 border-l-2 border-emerald-500 space-y-6 text-xs">
                {history.map((h) => (
                  <div key={h.id} className="relative">
                    <div className="w-3.5 h-3.5 rounded-full bg-emerald-600 absolute -left-[32px] top-1 ring-4 ring-white shadow-sm" />
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm">{h.new_status}</span>
                      <span className="text-[11px] text-slate-400">{new Date(h.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-slate-600 mt-1.5 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                      {h.remarks}
                    </p>
                    <p className="text-[10px] text-emerald-800 font-semibold mt-1">Updated by: {h.updated_by}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Photos & Information (1 col) */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 text-xs">
              <h3 className="font-bold text-slate-900 text-base mb-2">Item Specifications</h3>

              <div className="space-y-2">
                <p><span className="text-slate-400">Model / Type:</span> <span className="font-semibold text-slate-800">{product.model_type || 'N/A'}</span></p>
                <p><span className="text-slate-400">Brand:</span> <span className="font-semibold text-slate-800">{product.brand || 'Generic'}</span></p>
                <p><span className="text-slate-400">Pickup Address:</span> <span className="text-slate-700 block mt-0.5">{product.pickup_address}</span></p>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <h4 className="font-bold text-slate-800 mb-2">Product Photographs</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="h-28 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                    {product.image_1 ? (
                      <img src={product.image_1} alt="Front" className="w-full h-full object-cover" />
                    ) : (
                      <div className="h-full flex items-center justify-center text-[10px] text-slate-400">No Image 1</div>
                    )}
                  </div>
                  <div className="h-28 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                    {product.image_2 ? (
                      <img src={product.image_2} alt="Back" className="w-full h-full object-cover" />
                    ) : (
                      <div className="h-full flex items-center justify-center text-[10px] text-slate-400">No Image 2</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackProduct;
