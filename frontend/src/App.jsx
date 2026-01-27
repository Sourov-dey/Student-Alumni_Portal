// frontend/src/App.jsx - UPDATED VERSION
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup'; // ✅ ADD THIS IMPORT
import Jobs from './pages/Jobs';
import JobDetail from './pages/JobDetail';
import PostJob from './pages/PostJob';
import Chat from './pages/Chat';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import NotificationsPage from './pages/Notifications';
import VerifyId from './pages/verifyId';
import AdminVerifications from './pages/AdminVerifications';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';


export default function App() {
  const auth = useAuth();
  const user = auth?.user;
  const logout = auth?.logout;

  return (
    <div>
      <Navbar />

      <main style={{ padding: 20 }}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
<Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/signup" element={<Signup />} /> 
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/verify-id" element={<VerifyId />} />     
          <Route path="/jobs/:id" element={<JobDetail />} />
          <Route path="/post-job" element={<PostJob />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/admin/verifications" element={<AdminVerifications />} />
          <Route 
            path="/chat" 
            element={user ? <Chat /> : <Navigate to="/login" />} 
          />
        </Routes>
      </main>
    </div>
  );
}