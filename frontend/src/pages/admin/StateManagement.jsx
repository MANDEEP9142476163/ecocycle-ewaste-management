import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { MapPin, Plus, Edit2, Trash2, Loader2, AlertTriangle, X } from 'lucide-react';

const StateManagement = () => {
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [editingState, setEditingState] = useState(null);
  const [stateName, setStateName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchStates();
  }, []);

  const fetchStates = async () => {
    try {
      setLoading(true);
      const res = await api.get('/locations/states');
      if (res.data.success) {
        setStates(res.data.states);
      }
    } catch (err) {
      toast.error('Failed to load states.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingState(null);
    setStateName('');
    setModalOpen(true);
  };

  const handleOpenEdit = (state) => {
    setEditingState(state);
    setStateName(state.state_name);
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!stateName.trim()) {
      toast.error('State name is required.');
      return;
    }

    try {
      setSaving(true);
      if (editingState) {
        const res = await api.put(`/locations/states/${editingState.id}`, { state_name: stateName });
        if (res.data.success) toast.success('State updated successfully.');
      } else {
        const res = await api.post('/locations/states', { state_name: stateName });
        if (res.data.success) toast.success('State added successfully.');
      }
      setModalOpen(false);
      fetchStates();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await api.delete(`/locations/states/${id}`);
      if (res.data.success) {
        toast.success('State deleted successfully.');
        setDeleteConfirmId(null);
        fetchStates();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete state.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">State Management</h1>
          <p className="text-xs text-slate-500 mt-1">Configure supported operating states for doorstep collection.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-forest-800 hover:bg-forest-900 text-white font-semibold text-xs shadow-sm flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New State</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-forest-700" />
          </div>
        ) : states.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No states registered yet. Click "Add New State" to add one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4"># ID</th>
                  <th className="py-3.5 px-4">State Name</th>
                  <th className="py-3.5 px-4">Associated Cities</th>
                  <th className="py-3.5 px-4">Created Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {states.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-400">#{s.id}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-emerald-600" />
                      <span>{s.state_name}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 font-medium">
                        {s.city_count || 0} cities
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(s.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(s)}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-forest-800 hover:bg-slate-100 transition-colors"
                        title="Edit State"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(s.id)}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete State"
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
                {editingState ? 'Edit State Name' : 'Add New Operating State'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">State Name *</label>
                <input
                  type="text"
                  required
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  placeholder="e.g. California"
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
                  {saving ? 'Saving...' : editingState ? 'Update State' : 'Add State'}
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
            <h3 className="font-bold text-slate-900 text-base">Confirm State Deletion</h3>
            <p className="text-xs text-slate-500 mt-2">
              Deleting this state will also remove associated cities. Are you sure you want to proceed?
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
                Yes, Delete State
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StateManagement;
