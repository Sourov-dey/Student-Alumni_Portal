// frontend/src/utils/tokenUtils.js
import http from '../api/http';

export const verifyToken = async () => {
  try {
    const token = localStorage.getItem('au_token');
    
    if (!token) {
      console.error('❌ No token found in localStorage');
      return false;
    }
    
    console.log('🔍 Verifying token...');
    const response = await http.get('/api/auth/me');
    
    if (response.data) {
      console.log('✅ Token is valid');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Token verification failed:', error.response?.status);
    return false;
  }
};

export const debugAuthState = () => {
  console.log('\n🔍 === AUTH STATE DEBUG ===');
  console.log('localStorage au_token:', localStorage.getItem('au_token') ? '✅ Present' : '❌ Missing');
  console.log('localStorage au_user:', localStorage.getItem('au_user') ? '✅ Present' : '❌ Missing');
  
  try {
    const user = JSON.parse(localStorage.getItem('au_user'));
    console.log('User email:', user?.email);
    console.log('User role:', user?.role);
    console.log('User ID:', user?._id);
  } catch (e) {
    console.error('❌ Failed to parse user from localStorage');
  }
  
  console.log('======================\n');
};