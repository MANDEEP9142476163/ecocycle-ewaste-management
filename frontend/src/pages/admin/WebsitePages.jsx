import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FileText, Save, Loader2, Globe } from 'lucide-react';

const WebsitePages = () => {
  const [activeTab, setActiveTab] = useState('about_us');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPage();
  }, [activeTab]);

  const fetchPage = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/pages/${activeTab}`);
      if (res.data.success && res.data.page) {
        setTitle(res.data.page.page_title);
        setDescription(res.data.page.page_description);
      }
    } catch {
      toast.error('Failed to load page content.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await api.put(`/pages/${activeTab}`, {
        page_title: title,
        page_description: description
      });
      if (res.data.success) {
        toast.success('Website content updated live!');
      }
    } catch {
      toast.error('Failed to update page.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Website Content Management</h1>
        <p className="text-xs text-slate-500 mt-1">Manage public website pages (About Us, Contact Us).</p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('about_us')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'about_us'
              ? 'bg-forest-800 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          About Us Page
        </button>
        <button
          onClick={() => setActiveTab('contact_us')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'contact_us'
              ? 'bg-forest-800 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Contact Information & Support
        </button>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm max-w-3xl">
        {loading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-forest-700" />
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Section Heading / Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Content Body & Details *</label>
              <textarea
                rows={10}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 leading-relaxed"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-forest-800 hover:bg-forest-900 text-white text-xs font-semibold flex items-center gap-2 shadow-sm"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Save Live Changes</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default WebsitePages;
