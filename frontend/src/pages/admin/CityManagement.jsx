import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Building2, Plus, Edit2, Trash2, Loader2, AlertTriangle, X, Filter } from 'lucide-react';

const CityManagement = () => {
  const [cities, setCities] = useState([]);
  const [states, setStates] = useState([]);
  const [selectedStateFilter, setSelectedStateFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCity, setEditingCity] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const [formStateId, setFormStateId] = useState('');
  const [formCityName, setFormCityName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [selectedStateFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [citiesRes, statesRes] = await Promise.all([
        api.get('/locations/cities', { params: { state_id: selectedStateFilter || undefined } }),
        api.get('/locations/states')
      ]);
      if (citiesRes.data.success) setCities(citiesRes.data.cities);
      if (statesRes.data.success) setStates(statesRes.data.states);
    } catch (err) {
      toast.error('Failed to load cities data.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingCity(null);
    setFormStateId(states[0]?.id || '');
    setFormCityName('');
    setModalOpen(true);
  };

  const handleOpenEdit = (c) => {
    setEditingCity(c);
    setFormStateId(c.state_id);
    setFormCityName(c.city_name);
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formStateId || !formCityName.trim()) {
      toast.error('State and City name are required.');
      return;
    }

    try {
      setSaving(true);
      if (editingCity) {
        const res = await api.put(`/locations/cities/${editingCity.id}`, {
          state_id: formStateId,
          city_name: formCityName
        });
        if (res.data.success) toast.success('City updated successfully.');
      } else {
        const res = await api.post('/locations/cities', {
          state_id: formStateId,
          city_name: formCityName
        });
        if (res.data.success) toast.success('City added successfully.');
      }
      setModalOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await api.delete(`/locations/cities/${id}`);
      if (res.data.success) {
        toast.success('City deleted successfully.');
        setDeleteConfirmId(null);
        loadData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete city.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">City Management</h1>
          <p className="text-xs text-slate-500 mt-1">Associate municipal collection districts with states.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* State Filter */}
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedStateFilter}
              onChange={(e) => setSelectedStateFilter(e.target.value)}
              className="bg-transparent focus:outline-none text-slate-700 font-medium"
            >
              <option value="">All States</option>
              {states.map((s) => (
                <option key={s.id} value={s.id}>{s.state_name}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 rounded-xl bg-forest-800 hover:bg-forest-900 text-white font-semibold text-xs shadow-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add City</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-forest-700" />
          </div>
        ) : cities.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No cities found for this selection. Click "Add City" to register one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4"># ID</th>
                  <th className="py-3.5 px-4">City Name</th>
                  <th className="py-3.5 px-4">State</th>
                  <th className="py-3.5 px-4">Added Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cities.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-400">#{c.id}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-emerald-600" />
                      <span>{c.city_name}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 font-medium">
                        {c.state_name}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(c)}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-forest-800 hover:bg-slate-100"
                        title="Edit City"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(c.id)}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-red-600 hover:bg-red-50"
                        title="Delete City"
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

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">
                {editingCity ? 'Edit City Details' : 'Add New City'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Operating State *</label>
                <select
                  required
                  value={formStateId}
                  onChange={(e) => setFormStateId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                >
                  <option value="">Select State</option>
                  {states.map((s) => (
                    <option key={s.id} value={s.id}>{s.state_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">City Name *</label>
                <input
                  type="text"
                  required
                  value={formCityName}
                  onChange={(e) => setFormCityName(e.target.value)}
                  placeholder="e.g. Bhagalpur"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
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
                  {saving ? 'Saving...' : editingCity ? 'Update City' : 'Add City'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Confirm City Deletion</h3>
            <p className="text-xs text-slate-500 mt-2">
              Are you sure you want to delete this city from collection routes?
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
                Yes, Delete City
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CityManagement;
