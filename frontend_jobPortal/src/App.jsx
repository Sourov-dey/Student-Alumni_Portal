// frontend/src/App.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Jobs from './pages/Jobs';
import JobDetail from './pages/JobDetail';
import PostJob from './pages/PostJob';
import Chat from './pages/Chat';
import { useAuth } from './context/AuthContext';
import NotificationBell from './components/NotificationBell';
import Navbar from './components/Navbar';
import NotificationsPage from './pages/Notifications';
import VerifyId from './pages/verifyId';
import AdminVerifications from './pages/AdminVerifications';
import ApplicationVerifyModal from './components/ApplicationVerifyModal';

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
  )
}