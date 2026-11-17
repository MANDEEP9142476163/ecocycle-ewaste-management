import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Search, Loader2, ArrowRight } from 'lucide-react';

const SearchAssigned = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      toast.error('Please enter a product code, device name, or citizen phone number.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.get('/products', { params: { search: searchTerm.trim() } });
      if (res.data.success) {
        setResults(res.data.products);
        setHasSearched(true);
      }
    } catch {
      toast.error('Search failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Search Assigned Requests</h1>
        <p className="text-xs text-slate-500 mt-1">Lookup assigned e-waste pickup requests by Product ID or Citizen details.</p>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm max-w-2xl">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              required
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="e.g. ECO-2026-00001 or Inspiron..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-2xl bg-forest-800 hover:bg-forest-900 text-white font-semibold text-xs shadow-md flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Search</span>}
          </button>
        </form>
      </div>

      {hasSearched && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Matching Assigned Items ({results.length})
          </h2>

          {results.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-400 text-sm">
              No assigned requests found matching "{searchTerm}".
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((p) => (
                <div key={p.id} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:border-emerald-300 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-forest-800 text-xs">{p.product_code}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">
                        {p.status}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-base mt-2">{p.product_name}</h3>
                    <p className="text-xs text-slate-500">{p.category_name}</p>

                    <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-1">
                      <p><span className="text-slate-400">Citizen:</span> {p.user_name} ({p.contact_number})</p>
                      <p><span className="text-slate-400">Address:</span> {p.pickup_address}</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                    <Link
                      to={`/employee/investigation?id=${p.id}`}
                      className="text-xs font-semibold text-forest-700 hover:text-emerald-600 inline-flex items-center gap-1"
                    >
                      <span>Investigate Desk</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchAssigned;
