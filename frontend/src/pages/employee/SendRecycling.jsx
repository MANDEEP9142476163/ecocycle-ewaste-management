import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Truck, ArrowRight, Loader2, RefreshCw, X, Building, CheckCircle2 } from 'lucide-react';

const SendRecycling = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [facilityName, setFacilityName] = useState('GreenTech Materials Recovery Plant, Depot #4');
  const [remarks, setRemarks] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchCollectedProducts();
  }, []);

  const fetchCollectedProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/products', { params: { status: 'Collected' } });
      if (res.data.success) {
        setProducts(res.data.products);
      }
    } catch {
      toast.error('Failed to load collected products.');
    } finally {
      setLoading(false);
    }
  };

  const handleDispatch = async (e) => {
    e.preventDefault();
    try {
      setProcessing(true);
      const res = await api.post(`/products/${selectedProduct.id}/send-for-recycling`, {
        facility_name: facilityName,
        remarks: remarks || `Dispatched to ${facilityName} for raw metal and polymer extraction.`
      });
      if (res.data.success) {
        toast.success(`Product ${selectedProduct.product_code} sent for recycling!`);
        setSelectedProduct(null);
        fetchCollectedProducts();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Dispatch failed.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Send Items for Recycling</h1>
        <p className="text-xs text-slate-500 mt-1">
          Items collected from citizens ready to be dispatched to authorized recycling and dismantling facilities.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-forest-700" />
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No collected products currently awaiting dispatch to recycling plants.
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
                  <th className="py-3.5 px-4">Pickup Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Dispatch Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-forest-800">{p.product_code}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{p.product_name}</td>
                    <td className="py-3.5 px-4 text-slate-600">{p.category_name}</td>
                    <td className="py-3.5 px-4 text-slate-600">{p.user_name}</td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">{p.pickup_date}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800">
                        Collected
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedProduct(p)}
                        className="px-3.5 py-1.5 rounded-xl bg-forest-800 hover:bg-forest-900 text-white font-semibold text-xs inline-flex items-center gap-1.5 shadow-sm"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Dispatch to Plant</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dispatch Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Dispatch to Recovery Center</h3>
              <button onClick={() => setSelectedProduct(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDispatch} className="mt-4 space-y-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="font-mono font-bold text-forest-800">{selectedProduct.product_code}</span>
                <p className="font-semibold text-slate-800 mt-0.5">{selectedProduct.product_name}</p>
                <p className="text-slate-500 mt-1">{selectedProduct.category_name} • Collected on {selectedProduct.pickup_date}</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Recovery Facility / Recycling Plant *</label>
                <input
                  type="text"
                  required
                  value={facilityName}
                  onChange={(e) => setFacilityName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Batch Logistics Remarks</label>
                <textarea
                  rows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Dispatched in batch #REC-2026-B9 for hazardous component isolation."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="px-5 py-2 rounded-xl bg-forest-800 hover:bg-forest-900 text-white font-semibold flex items-center gap-1.5"
                >
                  {processing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Truck className="w-3.5 h-3.5" />}
                  <span>Confirm Dispatch</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SendRecycling;
