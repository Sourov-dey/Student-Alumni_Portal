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
import AdminPanel from './pages/AdminPanel';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AlumniMap from './pages/AlumniMap';
import Profile from './pages/Profile';
import ConnectionRequests from './pages/ConnectionRequests';
import MyApplications from './pages/MyApplications'; // ✅ ADD THIS IMPORT
import { useThemeStore } from './store/useThemeStore';
import { useEffect } from 'react';


export default function App() {
  const auth = useAuth();
  const user = auth?.user;
  const { theme } = useThemeStore();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <div>
      <Navbar />

      <main style={{ padding: 20 }}>
        <Routes>
          {user?.role === "admin" ? (
            <>
              <Route path="/admin/*" element={<AdminPanel />} />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </>
          ) : (
            <>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route
                path="/reset-password/:token"
                element={<ResetPassword />}
              />
              <Route path="/signup" element={<Signup />} />
              <Route path="/jobs" element={<Jobs />} />
              <Route path="/verify-id" element={<VerifyId />} />
              <Route path="/jobs/:id" element={<JobDetail />} />
              <Route path="/post-job" element={<PostJob />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/alumni-map" element={<AlumniMap />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/admin/*" element={<AdminPanel />} />
              <Route
                path="/my-applications"
                element={
                  user ? <MyApplications /> : <Navigate to="/login" />
                }
              />
              <Route
                path="/connections"
                element={
                  user ? <ConnectionRequests /> : <Navigate to="/login" />
                }
              />
              <Route
                path="/chat"
                element={user ? <Chat /> : <Navigate to="/login" />}
              />
            </>
          )}
        </Routes>
      </main>
    </div>
  );
}