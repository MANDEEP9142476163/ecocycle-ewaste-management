import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  ClipboardList, Search, Eye, ArrowRight, Loader2, Calendar,
  MapPin, Phone, User, DollarSign, Image
} from 'lucide-react';

const AssignedRequests = () => {
  const [requests, setRequests] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssigned();
  }, [search]);

  const fetchAssigned = async () => {
    try {
      setLoading(true);
      const res = await api.get('/products', { params: { search } });
      if (res.data.success) {
        setRequests(res.data.products);
      }
    } catch {
      toast.error('Failed to load assigned requests.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Your Assigned E-Waste Requests</h1>
          <p className="text-xs text-slate-500 mt-1">Directly assigned product requests for field inspection, collection, and recycling dispatch.</p>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search assigned products by code, name, or phone..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Cards Grid */}
      {loading ? (
        <div className="p-12 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-forest-700" />
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-400 text-sm">
          No assigned requests found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {requests.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:border-emerald-300 transition-all overflow-hidden flex flex-col justify-between"
            >
              <div>
                {/* Photo Preview Header */}
                <div className="h-44 bg-slate-100 relative overflow-hidden flex items-center justify-center">
                  {p.image_1 ? (
                    <img src={p.image_1} alt={p.product_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center text-slate-400">
                      <Image className="w-8 h-8 mb-1" />
                      <span className="text-xs">No Photo Uploaded</span>
                    </div>
                  )}
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg text-xs font-mono font-bold text-forest-800 shadow-sm">
                    {p.product_code}
                  </div>
                  <div className="absolute top-3 right-3">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold shadow-sm ${
                      p.status === 'Recycled' ? 'bg-forest-100 text-forest-800' :
                      p.status === 'Collected' ? 'bg-teal-100 text-teal-800' :
                      p.status === 'Under Investigation' ? 'bg-purple-100 text-purple-800' :
                      p.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {p.status}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="font-bold text-slate-900 text-base">{p.product_name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{p.category_name} • {p.brand || 'Generic'}</p>

                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-medium text-slate-800">{p.user_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{p.contact_number || p.user_phone}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{p.pickup_address}</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <Calendar className="w-3.5 h-3.5" /> {p.pickup_date}
                      </span>
                      <span className="font-bold text-emerald-700">${p.expected_price || '0.00'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="p-5 pt-0">
                <Link
                  to={`/employee/investigation?id=${p.id}`}
                  className="w-full py-2.5 rounded-xl bg-forest-800 hover:bg-forest-900 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                >
                  <span>Open Investigation Desk</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AssignedRequests;
