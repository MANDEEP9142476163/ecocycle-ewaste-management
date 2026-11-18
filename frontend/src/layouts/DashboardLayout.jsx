import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Recycle, LayoutDashboard, MapPin, Building2, Layers, Users,
  ClipboardList, UserCheck, Inbox, Activity, Search, FileBarChart2,
  FileText, User, LogOut, Bell, ChevronDown, Menu, X, ShieldAlert,
  CheckCircle, Truck, RefreshCw, KeyRound, ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast, { Toaster } from 'react-hot-toast';

const DashboardLayout = () => {
  const { user, role, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const profileRef = useRef(null);
  const notifRef = useRef(null);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      // silent
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotificationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Mark notification read
  const handleMarkAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read.');
    } catch {}
  };

  // Define sidebar menu items based on role
  const getNavLinks = () => {
    if (role === 'admin') {
      return [
        { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
        { header: 'LOCATION SETUP' },
        { label: 'States', path: '/admin/states', icon: MapPin },
        { label: 'Cities', path: '/admin/cities', icon: Building2 },
        { header: 'INVENTORY & STAFF' },
        { label: 'Categories', path: '/admin/categories', icon: Layers },
        { label: 'Employees', path: '/admin/employees', icon: UserCheck },
        { label: 'Registered Users', path: '/admin/users', icon: Users },
        { header: 'PRODUCT LIFECYCLE' },
        { label: 'Listed Products', path: '/admin/products', icon: ClipboardList },
        { label: 'Unassigned Requests', path: '/admin/unassigned', icon: Inbox },
        { label: 'Assign Employees', path: '/admin/assign', icon: UserCheck },
        { label: 'Lifecycle Status', path: '/admin/status-monitor', icon: Activity },
        { label: 'Search Products', path: '/admin/search', icon: Search },
        { header: 'INTELLIGENCE & CMS' },
        { label: 'Analytics Reports', path: '/admin/reports', icon: FileBarChart2 },
        { label: 'Website CMS Pages', path: '/admin/pages', icon: FileText },
        { label: 'Notifications & Alerts', path: '/admin/notifications', icon: Bell },
        { header: 'ACCOUNT' },
        { label: 'Admin Profile', path: '/admin/profile', icon: User }
      ];
    } else if (role === 'employee') {
      return [
        { label: 'Dashboard', path: '/employee/dashboard', icon: LayoutDashboard },
        { header: 'FIELD OPERATIONS' },
        { label: 'Assigned Requests', path: '/employee/assigned', icon: ClipboardList },
        { label: 'Product Investigation', path: '/employee/investigation', icon: Activity },
        { label: 'Send for Recycling', path: '/employee/send-recycling', icon: Truck },
        { label: 'Mark as Recycled', path: '/employee/complete-recycling', icon: RefreshCw },
        { header: 'SEARCH & ACCOUNT' },
        { label: 'Search Assigned', path: '/employee/search', icon: Search },
        { label: 'My Profile', path: '/employee/profile', icon: User }
      ];
    } else {
      // User role
      return [
        { label: 'Dashboard', path: '/user/dashboard', icon: LayoutDashboard },
        { header: 'E-WASTE DISPOSAL' },
        { label: 'List Your Products', path: '/user/submit-product', icon: ClipboardList },
        { label: 'My Listed Products', path: '/user/products', icon: Inbox },
        { label: 'Track Product Status', path: '/user/track', icon: Activity },
        { header: 'TOOLS & PROFILE' },
        { label: 'Search Submissions', path: '/user/search', icon: Search },
        { label: 'My Profile', path: '/user/profile', icon: User }
      ];
    }
  };

  const navLinks = getNavLinks();

  const getRoleBadge = () => {
    if (role === 'admin') {
      return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-100 text-purple-700 border border-purple-200">Administrator</span>;
    }
    if (role === 'employee') {
      return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700 border border-blue-200">Field Officer</span>;
    }
    return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">Citizen / Recycler</span>;
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm h-16 flex items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden lg:flex p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Toggle Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-forest-800 text-white flex items-center justify-center shadow-sm">
              <Recycle className="w-5 h-5" />
            </div>
            <div className="hidden sm:block">
              <span className="font-bold text-lg text-forest-900 tracking-tight">EcoCycle</span>
              <span className="text-[10px] block font-semibold text-emerald-700 uppercase -mt-1 tracking-wider">
                {role?.toUpperCase()} PORTAL
              </span>
            </div>
          </Link>
        </div>

        {/* Top Right Controls */}
        <div className="flex items-center gap-3">
          {/* View Public Website */}
          <Link
            to="/"
            target="_blank"
            className="hidden md:flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-forest-800 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            <span>Live Website</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          {/* Notifications Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotificationOpen(!notificationOpen)}
              className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-emerald-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {notificationOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-800 text-sm">Notifications</h3>
                    {unreadCount > 0 && (
                      <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded-full font-medium">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs text-forest-700 hover:underline font-medium"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500">
                      No notifications at this time.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => !n.is_read && handleMarkAsRead(n.id)}
                        className={`p-3 text-xs transition-colors cursor-pointer hover:bg-slate-50 flex gap-3 ${
                          !n.is_read ? 'bg-emerald-50/50' : ''
                        }`}
                      >
                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.is_read ? 'bg-emerald-600' : 'bg-transparent'}`} />
                        <div className="flex-1">
                          <p className="font-semibold text-slate-800">{n.title}</p>
                          <p className="text-slate-600 mt-0.5 leading-relaxed">{n.message}</p>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Pill & Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-forest-800 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="hidden sm:block text-left text-xs">
                <p className="font-semibold text-slate-800 leading-tight">{user?.name || 'User'}</p>
                <p className="text-[11px] text-slate-500">{user?.email || user?.username || ''}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-500" />
            </button>

            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-900">{user?.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{user?.email || user?.username}</p>
                  <div className="mt-2">{getRoleBadge()}</div>
                </div>

                <div className="py-1 text-xs">
                  <Link
                    to={`/${role}/profile`}
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-emerald-50 hover:text-forest-800 transition-colors"
                  >
                    <User className="w-4 h-4 text-slate-500" />
                    <span>Profile Management</span>
                  </Link>
                  <Link
                    to={`/${role}/profile`}
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-emerald-50 hover:text-forest-800 transition-colors"
                  >
                    <KeyRound className="w-4 h-4 text-slate-500" />
                    <span>Change Password</span>
                  </Link>
                </div>

                <div className="border-t border-slate-100 pt-1">
                  <button
                    onClick={() => {
                      logout();
                      navigate('/');
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <aside
          className={`bg-white border-r border-slate-200 flex-shrink-0 transition-all duration-300 hidden lg:block overflow-y-auto ${
            sidebarOpen ? 'w-64' : 'w-20'
          }`}
          style={{ height: 'calc(100vh - 4rem)' }}
        >
          <div className="p-4 space-y-1">
            {navLinks.map((item, idx) => {
              if (item.header) {
                return sidebarOpen ? (
                  <div key={idx} className="pt-4 pb-1 px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                    {item.header}
                  </div>
                ) : (
                  <div key={idx} className="border-t border-slate-100 my-2" />
                );
              }

              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                    isActive
                      ? 'bg-forest-800 text-white shadow-md shadow-forest-900/10'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  title={!sidebarOpen ? item.label : undefined}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-forest-800'}`} />
                  {sidebarOpen && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </div>
        </aside>

        {/* Mobile Drawer Sidebar */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <div className="relative w-72 bg-white h-full shadow-2xl flex flex-col z-10 overflow-y-auto p-4">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-forest-800 text-white flex items-center justify-center">
                    <Recycle className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-900 text-sm">EcoCycle</h2>
                    <p className="text-[10px] font-semibold text-emerald-700 uppercase">{role} MENU</p>
                  </div>
                </div>
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="py-4 space-y-1">
                {navLinks.map((item, idx) => {
                  if (item.header) {
                    return (
                      <div key={idx} className="pt-4 pb-1 px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                        {item.header}
                      </div>
                    );
                  }
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-forest-800 text-white shadow-md'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>

              <div className="mt-auto pt-4 border-t border-slate-100">
                <button
                  onClick={() => {
                    setMobileSidebarOpen(false);
                    logout();
                    navigate('/');
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 rounded-lg hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50" style={{ height: 'calc(100vh - 4rem)' }}>
          <div className="max-w-7xl mx-auto space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
