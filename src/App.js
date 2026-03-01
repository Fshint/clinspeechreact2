import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import WelcomePage from './pages/auth/WelcomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ConsultationsPage from './pages/ConsultationsPage';
import ConsultationDetailPage from './pages/ConsultationDetailPage';
import PatientsPage from './pages/PatientsPage';
import RecordPage from './pages/RecordPage';
import AppointmentsPage from './pages/AppointmentsPage';
import NotificationsPage from './pages/NotificationsPage';
import TemplatesPage from './pages/TemplatesPage';
import ProfilePage from './pages/ProfilePage';
import UsersPage from './pages/admin/UsersPage';
import AuditLogPage from './pages/admin/AuditLogPage';

function DoctorAdminRoute({ children }) {
  const { user } = useAuth();
  if (user?.role === 'patient') return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<WelcomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/record" element={<DoctorAdminRoute><RecordPage /></DoctorAdminRoute>} />
            <Route path="/consultations" element={<ConsultationsPage />} />
            <Route path="/consultations/:id" element={<ConsultationDetailPage />} />
            <Route path="/patients" element={<DoctorAdminRoute><PatientsPage /></DoctorAdminRoute>} />
            <Route path="/appointments" element={<DoctorAdminRoute><AppointmentsPage /></DoctorAdminRoute>} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/templates" element={<DoctorAdminRoute><TemplatesPage /></DoctorAdminRoute>} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/admin/users" element={<UsersPage />} />
            <Route path="/admin/audit" element={<AuditLogPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
