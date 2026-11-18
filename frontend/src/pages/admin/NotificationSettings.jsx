import React, { useState, useEffect } from 'react';
import {
  Bell, MessageSquare, Smartphone, ShieldCheck, RefreshCw, Send,
  Sliders, CheckCircle2, AlertTriangle, XCircle, Search, Filter,
  PhoneCall, Mail, User, Clock, Check, Info, Inbox
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const NotificationSettings = () => {
  const [activeTab, setActiveTab] = useState('settings'); // 'settings' | 'logs' | 'test' | 'inquiries'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({});
  const [channelStatus, setChannelStatus] = useState(null);

  // Logs state
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logFilterChannel, setLogFilterChannel] = useState('');
  const [logFilterStatus, setLogFilterStatus] = useState('');
  const [logSearch, setLogSearch] = useState('');

  // Test notification state
  const [testChannel, setTestChannel] = useState('all');
  const [testDestination, setTestDestination] = useState('');
  const [testMessage, setTestMessage] = useState('This is a test notification from EcoCycle Smart E-Waste Management System.');
  const [sendingTest, setSendingTest] = useState(false);
  const [testResponse, setTestResponse] = useState(null);

  // Inquiries state
  const [inquiries, setInquiries] = useState([]);
  const [loadingInquiries, setLoadingInquiries] = useState(false);
  const [inquirySearch, setInquirySearch] = useState('');

  // Fetch Settings
  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications/settings');
      if (res.data.success) {
        setSettings(res.data.settings || {});
        setChannelStatus(res.data.channelStatus || null);
        if (!testDestination && res.data.settings?.admin_alert_mobile) {
          setTestDestination(res.data.settings.admin_alert_mobile);
        }
      }
    } catch (err) {
      toast.error('Failed to load notification settings.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Logs
  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const params = {};
      if (logFilterChannel) params.channel = logFilterChannel;
      if (logFilterStatus) params.status = logFilterStatus;
      if (logSearch) params.search = logSearch;
      const res = await api.get('/notifications/logs', { params });
      if (res.data.success) {
        setLogs(res.data.logs || []);
      }
    } catch (err) {
      toast.error('Failed to load notification delivery logs.');
    } finally {
      setLoadingLogs(false);
    }
  };

  // Fetch Inquiries
  const fetchInquiries = async () => {
    setLoadingInquiries(true);
    try {
      const params = {};
      if (inquirySearch) params.search = inquirySearch;
      const res = await api.get('/notifications/inquiries-list', { params });
      if (res.data.success) {
        setInquiries(res.data.inquiries || []);
      }
    } catch (err) {
      toast.error('Failed to load contact inquiries.');
    } finally {
      setLoadingInquiries(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (activeTab === 'logs') fetchLogs();
    if (activeTab === 'inquiries') fetchInquiries();
  }, [activeTab]);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put('/notifications/settings', { settings });
      if (res.data.success) {
        toast.success('Notification settings saved successfully!');
        setSettings(res.data.settings);
        setChannelStatus(res.data.channelStatus);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (key) => {
    setSettings(prev => ({
      ...prev,
      [key]: prev[key] === 'true' ? 'false' : 'true'
    }));
  };

  const handleInputChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSendTest = async (e) => {
    e.preventDefault();
    if (!testMessage.trim()) {
      toast.error('Please enter a test message.');
      return;
    }
    setSendingTest(true);
    setTestResponse(null);
    try {
      const res = await api.post('/notifications/test', {
        channel: testChannel,
        destination: testDestination,
        message: testMessage
      });
      if (res.data.success) {
        setTestResponse(res.data);
        toast.success(res.data.dryRun ? 'Test simulated safely in Dry-Run mode!' : 'Test notification sent!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send test notification.');
    } finally {
      setSendingTest(false);
    }
  };

  const handleUpdateInquiryStatus = async (id, newStatus) => {
    try {
      const res = await api.put(`/notifications/inquiries/${id}`, { status: newStatus });
      if (res.data.success) {
        toast.success(`Inquiry marked as ${newStatus}`);
        setInquiries(prev => prev.map(inq => inq.id === id ? { ...inq, status: newStatus } : inq));
      }
    } catch (err) {
      toast.error('Failed to update inquiry.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-xl bg-forest-50 text-forest-700">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Notification Engine & Multichannel Controls</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage WhatsApp (Meta Cloud API), SMS Gateway (Indian DLT), and In-App notifications.
              </p>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-2 rounded-lg transition-all ${
              activeTab === 'settings'
                ? 'bg-white text-forest-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Channels & Triggers
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-3 py-2 rounded-lg transition-all ${
              activeTab === 'logs'
                ? 'bg-white text-forest-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Delivery Logs
          </button>
          <button
            onClick={() => setActiveTab('test')}
            className={`px-3 py-2 rounded-lg transition-all ${
              activeTab === 'test'
                ? 'bg-white text-forest-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Live Test
          </button>
          <button
            onClick={() => setActiveTab('inquiries')}
            className={`px-3 py-2 rounded-lg transition-all ${
              activeTab === 'inquiries'
                ? 'bg-white text-forest-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Contact Inquiries
          </button>
        </div>
      </div>

      {/* TAB 1: SETTINGS & TRIGGERS */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          {/* Status Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* WhatsApp Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-emerald-600">
                  <MessageSquare className="w-5 h-5" />
                  <span className="font-bold text-sm text-slate-800">WhatsApp Cloud API</span>
                </div>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    settings.whatsapp_enabled === 'true'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {settings.whatsapp_enabled === 'true' ? 'Active' : 'Disabled'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                Official Meta Graph API v21.0 integration for real-time pickup alerts & verification notices.
              </p>
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                <span className="text-slate-500">API Credentials:</span>
                <span className="font-semibold text-slate-700">
                  {channelStatus?.whatsapp?.hasAccessToken ? (
                    <span className="text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Configured
                    </span>
                  ) : (
                    <span className="text-amber-600 flex items-center gap-1">
                      <Info className="w-3.5 h-3.5" /> Dry-Run Simulation
                    </span>
                  )}
                </span>
              </div>
            </div>

            {/* SMS Gateway Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-blue-600">
                  <Smartphone className="w-5 h-5" />
                  <span className="font-bold text-sm text-slate-800">SMS Gateway (India)</span>
                </div>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    settings.sms_enabled === 'true'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {settings.sms_enabled === 'true' ? 'Active' : 'Disabled'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                Indian DLT-compliant SMS gateway with Fast2SMS & MSG91 integration support.
              </p>
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                <span className="text-slate-500">Sender ID (DLT):</span>
                <span className="font-mono font-bold text-slate-800">
                  {settings.sms_sender_id || 'ECOCYC'}
                </span>
              </div>
            </div>

            {/* In-App Engine Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-forest-700">
                  <Bell className="w-5 h-5" />
                  <span className="font-bold text-sm text-slate-800">In-App Notification Engine</span>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-forest-50 text-forest-800 border border-forest-200">
                  Operational
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                Instant database notifications for Citizen, Employee, and Administrator workspaces.
              </p>
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                <span className="text-slate-500">Status:</span>
                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 100% Operational
                </span>
              </div>
            </div>
          </div>

          {/* Section: Global Controls & Alert Mobile */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-forest-700" />
              <span>Global Channel Switches & Admin Recipients</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* WhatsApp Master Toggle */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <p className="text-xs font-bold text-slate-800">WhatsApp Notification Channel</p>
                  <p className="text-[11px] text-slate-500">Send WhatsApp messages for lifecycle events</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle('whatsapp_enabled')}
                  className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-1 ${
                    settings.whatsapp_enabled === 'true' ? 'bg-emerald-600' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full transition-transform ${
                      settings.whatsapp_enabled === 'true' ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* SMS Master Toggle */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <p className="text-xs font-bold text-slate-800">SMS Notification Channel</p>
                  <p className="text-[11px] text-slate-500">Send Indian gateway SMS alerts</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle('sms_enabled')}
                  className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-1 ${
                    settings.sms_enabled === 'true' ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full transition-transform ${
                      settings.sms_enabled === 'true' ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* In-App Master Toggle */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <p className="text-xs font-bold text-slate-800">In-App Notification Channel</p>
                  <p className="text-[11px] text-slate-500">Show bell alerts in user & staff headers</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle('in_app_enabled')}
                  className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-1 ${
                    settings.in_app_enabled === 'true' ? 'bg-forest-700' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full transition-transform ${
                      settings.in_app_enabled === 'true' ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Dry-Run Mode Toggle */}
              <div className="flex items-center justify-between p-3.5 bg-amber-50/60 rounded-xl border border-amber-200">
                <div>
                  <p className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                    <span>Dry-Run / Safe Simulation Mode</span>
                  </p>
                  <p className="text-[11px] text-amber-700">Simulate dispatches & log without using paid credits</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle('dry_run_mode')}
                  className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-1 ${
                    settings.dry_run_mode === 'true' ? 'bg-amber-600' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full transition-transform ${
                      settings.dry_run_mode === 'true' ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Recipient Phone Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Admin Alert Mobile (SMS)
                </label>
                <input
                  type="text"
                  value={settings.admin_alert_mobile || ''}
                  onChange={(e) => handleInputChange('admin_alert_mobile', e.target.value)}
                  placeholder="+919876543210"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-forest-700 font-mono"
                />
                <span className="text-[10px] text-slate-400">Receives emergency operational SMS</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Admin Alert WhatsApp Number
                </label>
                <input
                  type="text"
                  value={settings.admin_alert_whatsapp || ''}
                  onChange={(e) => handleInputChange('admin_alert_whatsapp', e.target.value)}
                  placeholder="+919876543210"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-mono"
                />
                <span className="text-[10px] text-slate-400">Receives WhatsApp lead & pickup alerts</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  DLT SMS Sender ID (Header)
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={settings.sms_sender_id || ''}
                  onChange={(e) => handleInputChange('sms_sender_id', e.target.value.toUpperCase())}
                  placeholder="ECOCYC"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono font-bold"
                />
                <span className="text-[10px] text-slate-400">6-char DLT Header approved by TRAI</span>
              </div>
            </div>
          </div>

          {/* Section: Per-Event Notification Toggles */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Lifecycle Event Notification Triggers</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
              {[
                { key: 'event_user_registered', label: 'Citizen Registration', desc: 'Welcome notice to user & registration alert to admin' },
                { key: 'event_pickup_submitted', label: 'E-Waste Pickup Submission', desc: 'Confirmation to citizen with code & pickup alert to admin' },
                { key: 'event_employee_assigned', label: 'Inspector Assignment', desc: 'Officer details to user & task dispatch to employee' },
                { key: 'event_under_investigation', label: 'Device Investigation', desc: 'Notice to user when technical verification begins' },
                { key: 'event_pickup_scheduled', label: 'Pickup Scheduling & Updates', desc: 'Time & location confirmation to citizen & employee' },
                { key: 'event_product_collected', label: 'Doorstep Collection', desc: 'Receipt confirmation to user & operations notice to admin' },
                { key: 'event_sent_recycling', label: 'Dispatched for Recycling', desc: 'Tracking notice when item arrives at recovery facility' },
                { key: 'event_recycled', label: '100% Recycling Completed', desc: 'Green certificate & celebration message to citizen' },
                { key: 'event_rejected', label: 'Pickup Rejected', desc: 'Clear rejection rationale and guidance to citizen' },
                { key: 'event_contact_inquiry', label: 'Website Contact Inquiry', desc: 'Instant WhatsApp/SMS to admin & confirmation to visitor' }
              ].map(event => (
                <div
                  key={event.key}
                  onClick={() => handleToggle(event.key)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 select-none ${
                    settings[event.key] !== 'false'
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : 'bg-slate-50/60 border-slate-200 opacity-60'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={settings[event.key] !== 'false'}
                    onChange={() => {}}
                    className="mt-0.5 rounded text-forest-700 focus:ring-forest-700 h-4 w-4 pointer-events-none"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-800">{event.label}</p>
                    <p className="text-[11px] text-slate-500 leading-tight mt-0.5">{event.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-forest-800 hover:bg-forest-900 text-white font-semibold text-sm shadow-md transition-all flex items-center gap-2"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              <span>{saving ? 'Saving Settings...' : 'Save Notification Configuration'}</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: AUDIT LOGS */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* Channel Filter */}
              <select
                value={logFilterChannel}
                onChange={(e) => setLogFilterChannel(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-forest-700"
              >
                <option value="">All Channels</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="sms">SMS</option>
                <option value="in_app">In-App</option>
              </select>

              {/* Status Filter */}
              <select
                value={logFilterStatus}
                onChange={(e) => setLogFilterStatus(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-forest-700"
              >
                <option value="">All Statuses</option>
                <option value="sent">Sent</option>
                <option value="dry_run">Dry Run</option>
                <option value="failed">Failed</option>
                <option value="skipped">Skipped</option>
              </select>

              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  placeholder="Search recipient or content..."
                  className="pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-forest-700 w-48 sm:w-64"
                />
              </div>

              <button
                type="button"
                onClick={fetchLogs}
                className="px-3 py-2 rounded-xl bg-forest-50 hover:bg-forest-100 text-forest-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Apply Filter</span>
              </button>
            </div>

            <button
              type="button"
              onClick={fetchLogs}
              disabled={loadingLogs}
              className="px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Logs Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Channel</th>
                    <th className="py-3 px-4">Event Type</th>
                    <th className="py-3 px-4">Recipient</th>
                    <th className="py-3 px-4">Message Snippet</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Provider Ref / Error</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingLogs ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-slate-400">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-forest-700" />
                        Loading delivery logs...
                      </td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-slate-400">
                        No notification logs found matching the filter criteria.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 whitespace-nowrap text-slate-500">
                          {new Date(log.created_at).toLocaleString('en-IN', {
                            dateStyle: 'short',
                            timeStyle: 'medium'
                          })}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {log.channel === 'whatsapp' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                              <MessageSquare className="w-3 h-3" /> WhatsApp
                            </span>
                          )}
                          {log.channel === 'sms' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold">
                              <Smartphone className="w-3 h-3" /> SMS
                            </span>
                          )}
                          {log.channel === 'in_app' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-forest-50 text-forest-700 text-[10px] font-bold">
                              <Bell className="w-3 h-3" /> In-App
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-800">
                          {log.event_type}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-800">
                            {log.recipient_destination || log.recipient_role}
                          </span>
                          <span className="block text-[10px] text-slate-400 capitalize">
                            Role: {log.recipient_role}
                          </span>
                        </td>
                        <td className="py-3 px-4 max-w-xs truncate text-slate-600" title={log.message_content}>
                          {log.message_content}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {log.status === 'sent' && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                              SENT
                            </span>
                          )}
                          {log.status === 'dry_run' && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                              DRY RUN
                            </span>
                          )}
                          {log.status === 'failed' && (
                            <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px]">
                              FAILED
                            </span>
                          )}
                          {log.status === 'skipped' && (
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px]">
                              SKIPPED
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-[11px] font-mono text-slate-500 max-w-xs truncate" title={log.error_message || log.provider_response_id}>
                          {log.error_message ? (
                            <span className="text-rose-600">{log.error_message}</span>
                          ) : (
                            log.provider_response_id || '—'
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LIVE TEST DISPATCHER */}
      {activeTab === 'test' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Form */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Send className="w-4 h-4 text-forest-700" />
              <span>Send Safe Test Notification</span>
            </h2>
            <p className="text-xs text-slate-500">
              Test end-to-end dispatch across WhatsApp, SMS, or In-App. When Dry-Run Mode is enabled in settings, messages are safely simulated without consuming credits.
            </p>

            <form onSubmit={handleSendTest} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Notification Channel
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'all', label: 'All Channels' },
                    { id: 'whatsapp', label: 'WhatsApp' },
                    { id: 'sms', label: 'SMS' },
                    { id: 'in_app', label: 'In-App' }
                  ].map(ch => (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => setTestChannel(ch.id)}
                      className={`py-2 px-2 text-xs font-bold rounded-xl border text-center transition-all ${
                        testChannel === ch.id
                          ? 'bg-forest-800 text-white border-forest-800 shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {ch.label}
                    </button>
                  ))}
                </div>
              </div>

              {(testChannel === 'whatsapp' || testChannel === 'sms' || testChannel === 'all') && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Destination Mobile Number
                  </label>
                  <input
                    type="text"
                    value={testDestination}
                    onChange={(e) => setTestDestination(e.target.value)}
                    placeholder="+919876543210"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-forest-700 font-mono"
                  />
                  <span className="text-[10px] text-slate-400">
                    Indian 10-digit mobile or international format with +91
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Test Message Body
                </label>
                <textarea
                  rows={4}
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  placeholder="Enter message text to dispatch..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-forest-700"
                />
              </div>

              <button
                type="submit"
                disabled={sendingTest}
                className="w-full py-2.5 rounded-xl bg-forest-800 hover:bg-forest-900 text-white font-semibold text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                {sendingTest ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>{sendingTest ? 'Dispatching Test...' : 'Dispatch Test Notification'}</span>
              </button>
            </form>
          </div>

          {/* Test Results Output */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Real-Time Dispatch Result</span>
            </h2>

            {testResponse ? (
              <div className="space-y-4">
                <div
                  className={`p-4 rounded-xl border text-xs ${
                    testResponse.dryRun
                      ? 'bg-amber-50 border-amber-200 text-amber-900'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  }`}
                >
                  <p className="font-bold flex items-center gap-1.5">
                    {testResponse.dryRun ? (
                      <Info className="w-4 h-4 text-amber-700" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    )}
                    <span>{testResponse.message}</span>
                  </p>
                  <p className="mt-1 text-[11px]">
                    Mode: {testResponse.dryRun ? 'Simulated Dry-Run (No charges)' : 'Live Gateway Dispatch'}
                  </p>
                </div>

                <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-[11px] overflow-x-auto max-h-80">
                  <pre>{JSON.stringify(testResponse.result, null, 2)}</pre>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-slate-400 text-xs">
                <Send className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                Fill the test form and click "Dispatch Test Notification" to view real-time API responses and gateway statuses here.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: CONTACT INQUIRIES INBOX */}
      {activeTab === 'inquiries' && (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-3">
            <div className="relative w-full max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={inquirySearch}
                onChange={(e) => setInquirySearch(e.target.value)}
                placeholder="Search inquiries by name, email, phone, message..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-forest-700"
              />
            </div>

            <button
              type="button"
              onClick={fetchInquiries}
              disabled={loadingInquiries}
              className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingInquiries ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Inquiries List */}
          <div className="space-y-3">
            {loadingInquiries ? (
              <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-forest-700" />
                Loading inquiries...
              </div>
            ) : inquiries.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
                <Inbox className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                No contact inquiries recorded yet.
              </div>
            ) : (
              inquiries.map((inq) => (
                <div
                  key={inq.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-start justify-between gap-4"
                >
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-800 text-sm">{inq.name}</span>
                      <span className="text-xs text-slate-500">•</span>
                      <a href={`mailto:${inq.email}`} className="text-xs text-emerald-700 hover:underline flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {inq.email}
                      </a>
                      {inq.phone && (
                        <>
                          <span className="text-xs text-slate-500">•</span>
                          <a href={`tel:${inq.phone}`} className="text-xs text-slate-700 font-mono flex items-center gap-1">
                            <PhoneCall className="w-3 h-3 text-slate-400" /> {inq.phone}
                          </a>
                        </>
                      )}
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          inq.consent_sms_whatsapp
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {inq.consent_sms_whatsapp ? 'WhatsApp/SMS Consented' : 'Email Only'}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-slate-800">{inq.subject || 'No subject'}</p>
                    <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 whitespace-pre-wrap">
                      {inq.message}
                    </p>

                    <p className="text-[10px] text-slate-400">
                      Submitted on: {new Date(inq.created_at).toLocaleString('en-IN')}
                    </p>
                  </div>

                  {/* Status Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={inq.status}
                      onChange={(e) => handleUpdateInquiryStatus(inq.id, e.target.value)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl border focus:outline-none ${
                        inq.status === 'New'
                          ? 'bg-blue-50 text-blue-800 border-blue-200'
                          : inq.status === 'Contacted'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      }`}
                    >
                      <option value="New">New</option>
                      <option value="Contacted">Contacted</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationSettings;
