import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';

// Public Pages
import LandingPage from './pages/public/LandingPage';
import LoginPage from './pages/public/LoginPage';
import RegisterPage from './pages/public/RegisterPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import StateManagement from './pages/admin/StateManagement';
import CityManagement from './pages/admin/CityManagement';
import CategoryManagement from './pages/admin/CategoryManagement';
import EmployeeManagement from './pages/admin/EmployeeManagement';
import RegisteredUsers from './pages/admin/RegisteredUsers';
import ListedProducts from './pages/admin/ListedProducts';
import UnassignedProducts from './pages/admin/UnassignedProducts';
import AssignProducts from './pages/admin/AssignProducts';
import StatusMonitor from './pages/admin/StatusMonitor';
import SearchProducts from './pages/admin/SearchProducts';
import Reports from './pages/admin/Reports';
import WebsitePages from './pages/admin/WebsitePages';
import AdminProfile from './pages/admin/AdminProfile';

// Employee Pages
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import AssignedRequests from './pages/employee/AssignedRequests';
import ProductInvestigation from './pages/employee/ProductInvestigation';
import SendRecycling from './pages/employee/SendRecycling';
import CompleteRecycling from './pages/employee/CompleteRecycling';
import SearchAssigned from './pages/employee/SearchAssigned';
import EmployeeProfile from './pages/employee/EmployeeProfile';

// User Pages
import UserDashboard from './pages/user/UserDashboard';
import SubmitProduct from './pages/user/SubmitProduct';
import UserProducts from './pages/user/UserProducts';
import TrackProduct from './pages/user/TrackProduct';
import UserSearch from './pages/user/UserSearch';
import UserProfile from './pages/user/UserProfile';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Admin Protected Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="states" element={<StateManagement />} />
            <Route path="cities" element={<CityManagement />} />
            <Route path="categories" element={<CategoryManagement />} />
            <Route path="employees" element={<EmployeeManagement />} />
            <Route path="users" element={<RegisteredUsers />} />
            <Route path="products" element={<ListedProducts />} />
            <Route path="unassigned" element={<UnassignedProducts />} />
            <Route path="assign" element={<AssignProducts />} />
            <Route path="status-monitor" element={<StatusMonitor />} />
            <Route path="search" element={<SearchProducts />} />
            <Route path="reports" element={<Reports />} />
            <Route path="pages" element={<WebsitePages />} />
            <Route path="profile" element={<AdminProfile />} />
          </Route>

          {/* Employee Protected Routes */}
          <Route
            path="/employee"
            element={
              <ProtectedRoute allowedRoles={['employee']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/employee/dashboard" replace />} />
            <Route path="dashboard" element={<EmployeeDashboard />} />
            <Route path="assigned" element={<AssignedRequests />} />
            <Route path="investigation" element={<ProductInvestigation />} />
            <Route path="send-recycling" element={<SendRecycling />} />
            <Route path="complete-recycling" element={<CompleteRecycling />} />
            <Route path="search" element={<SearchAssigned />} />
            <Route path="profile" element={<EmployeeProfile />} />
          </Route>

          {/* User Protected Routes */}
          <Route
            path="/user"
            element={
              <ProtectedRoute allowedRoles={['user']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/user/dashboard" replace />} />
            <Route path="dashboard" element={<UserDashboard />} />
            <Route path="submit-product" element={<SubmitProduct />} />
            <Route path="products" element={<UserProducts />} />
            <Route path="track" element={<TrackProduct />} />
            <Route path="search" element={<UserSearch />} />
            <Route path="profile" element={<UserProfile />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
