import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginUser } from '../store/UserSlice';
import toast from 'react-hot-toast';
import axios from 'axios';

const GoogleOAuthCallback = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const error = searchParams.get('error');

        if (error) {
          toast.error('Google OAuth authentication was cancelled or failed');
          navigate('/SuperAdmin-login');
          return;
        }

        if (!code) {
          toast.error('No authorization code received from Google');
          navigate('/SuperAdmin-login');
          return;
        }

        // Exchange the authorization code for user information
        const response = await axios.post('https://crm-generalize.siarasystems.com/api/google-oauth-callback', {
          code: code
        });

        if (response.data.success) {
          dispatch(loginUser(response.data.user));
          toast.success(response.data.message);
          navigate('/super-admin-dashboard');
        } else {
          toast.error(response.data.message);
          navigate('/SuperAdmin-login');
        }
      } catch (error) {
        console.error('OAuth callback error:', error);
        toast.error(
          error?.response?.data?.message ||
          'OAuth authentication failed. Please try again.'
        );
        navigate('/SuperAdmin-login');
      }
    };

    handleCallback();
  }, [searchParams, navigate, dispatch]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Processing Google authentication...</p>
      </div>
    </div>
  );
};

export default GoogleOAuthCallback;
