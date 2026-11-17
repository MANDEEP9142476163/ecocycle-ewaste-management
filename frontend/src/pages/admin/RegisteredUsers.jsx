import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Users, Search, Phone, Mail, Calendar, Package, Eye, X, Loader2, CheckCircle2 } from 'lucide-react';

const RegisteredUsers = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [search]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users', { params: { search } });
      if (res.data.success) {
        setUsers(res.data.users);
      }
    } catch {
      toast.error('Failed to load registered users.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewUser = async (id) => {
    try {
      setLoadingDetails(true);
      const res = await api.get(`/users/${id}`);
      if (res.data.success) {
        setSelectedUser(res.data.user);
      }
    } catch {
      toast.error('Failed to load user details.');
    } finally {
      setLoadingDetails(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Registered Citizens & Users</h1>
          <p className="text-xs text-slate-500 mt-1">Review citizens registered on EcoCycle and their e-waste submission history.</p>
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
            placeholder="Search by citizen name, email, or mobile..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-forest-700" />
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No registered users found matching search query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4"># ID</th>
                  <th className="py-3.5 px-4">Citizen Name</th>
                  <th className="py-3.5 px-4">Contact Info</th>
                  <th className="py-3.5 px-4">Total Submissions</th>
                  <th className="py-3.5 px-4">Recycled Items</th>
                  <th className="py-3.5 px-4">Joined Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-400">#{u.id}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                        {u.full_name.charAt(0)}
                      </div>
                      <span>{u.full_name}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 space-y-0.5">
                      <p className="flex items-center gap-1.5"><Mail className="w-3 h-3 text-slate-400" /> {u.email}</p>
                      <p className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-slate-400" /> {u.mobile_number}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 font-medium">
                        {u.total_products || 0} devices
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full bg-forest-100 text-forest-800 font-semibold">
                        {u.recycled_products || 0} completed
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleViewUser(u.id)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:text-forest-800 hover:bg-emerald-50 text-xs font-semibold inline-flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Submissions</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User Details & Submitted Products Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl border border-slate-200 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-forest-800 text-white flex items-center justify-center font-bold text-lg">
                  {selectedUser.full_name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{selectedUser.full_name}</h3>
                  <p className="text-xs text-slate-500">{selectedUser.email} • {selectedUser.mobile_number}</p>
                </div>
              </div>
              <button onClick={() => setSelectedUser(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 flex-1 overflow-y-auto space-y-4">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Submitted E-Waste Products ({selectedUser.products?.length || 0})
              </h4>

              {selectedUser.products?.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No products submitted by this user yet.</p>
              ) : (
                <div className="space-y-2">
                  {selectedUser.products.map((p) => (
                    <div key={p.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-forest-800">{p.product_code}</span>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-500 font-medium">{p.category_name}</span>
                        </div>
                        <p className="font-semibold text-slate-800 mt-0.5">{p.product_name}</p>
                        <p className="text-slate-500 text-[11px] mt-0.5">
                          Submitted on {new Date(p.created_at).toLocaleDateString()} • Est: ${p.expected_price || '0.00'}
                        </p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        p.status === 'Recycled' ? 'bg-forest-100 text-forest-800' :
                        p.status === 'Collected' ? 'bg-teal-100 text-teal-800' :
                        p.status === 'Assigned' ? 'bg-blue-100 text-blue-800' :
                        p.status === 'Rejected' ? 'bg-red-100 text-red-800' :
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
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegisteredUsers;
