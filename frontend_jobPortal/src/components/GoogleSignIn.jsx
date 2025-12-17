// frontend/src/components/GoogleSignIn.jsx
import React, { useEffect } from 'react';
import http from '../api/http'; // your axios instance
import { useAuth } from '../context/AuthContext';

export default function GoogleSignIn() {
  const { login } = useAuth();

  useEffect(() => {
    // load gsi script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    script.onload = () => {
      /* global google */
      if (!window.google) return;

      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || process.env.REACT_APP_GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
        // optionally set ux_mode etc
        // ux_mode: 'popup'
      });

      // render button into placeholder
      window.google.accounts.id.renderButton(
        document.getElementById('gsi-button'),
        { theme: 'outline', size: 'large' }
      );

      // optional: prompt One Tap
      // window.google.accounts.id.prompt();
    };

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  async function handleCredentialResponse(response) {
    try {
      const idToken = response?.credential;
      if (!idToken) return alert('Google login failed');

      // send token to your backend
      const res = await http.post('/api/auth/google', { idToken });
      const { token, user } = res.data;
      login(token, user); // reuse your AuthContext login
    } catch (err) {
      console.error('Google sign-in error', err);
      alert('Google sign-in failed');
    }
  }

  return <div id="gsi-button" />;
}
