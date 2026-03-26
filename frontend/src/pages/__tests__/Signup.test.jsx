import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import Signup from '../Signup';
import http from '../../api/http';
import { useAuth } from '../../context/AuthContext';

// Mock dependencies
vi.mock('../../api/http', () => ({
  default: {
    post: vi.fn(),
  },
}));

const mockLogin = vi.fn();
vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(() => ({ login: mockLogin })),
}));

// Mock react-google-recaptcha
vi.mock('react-google-recaptcha', () => {
  return {
    default: React.forwardRef(({ onChange }, ref) => {
      React.useImperativeHandle(ref, () => ({
        reset: vi.fn(),
      }));
      return (
        <button type="button" data-testid="mock-recaptcha" onClick={() => onChange('mock-token')}>
          Verify Captcha
        </button>
      );
    }),
  };
});

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Helper component
const renderSignup = () => {
  return render(
    <BrowserRouter>
      <Signup />
    </BrowserRouter>
  );
};

describe('Signup Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders signup form and initially asks for basic details', () => {
    renderSignup();
    expect(screen.getByText(/join the network/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/i am a/i)).toBeInTheDocument();
  });

  it('handles sending OTP successfully', async () => {
    http.post.mockResolvedValueOnce({
      data: { message: 'OTP sent successfully' }
    });

    renderSignup();

    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'password123' } });
    
    // Simulate captcha
    fireEvent.click(screen.getByTestId('mock-recaptcha'));

    // Submit the initial form
    const form = screen.getByLabelText(/full name/i).closest('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(http.post).toHaveBeenCalledWith('/api/auth/send-otp', {
        email: 'test@example.com',
        captchaToken: 'mock-token' // From mock
      });
    });

    // Check if OTP input is now visible
    expect(await screen.findByLabelText(/enter 6-digit otp/i)).toBeInTheDocument();
  });

  it('handles full signup and OTP verification', async () => {
    // 1st request: send-otp
    http.post.mockResolvedValueOnce({
      data: { message: 'OTP sent successfully' }
    });
    // 2nd request: signup
    http.post.mockResolvedValueOnce({
      data: { 
        token: 'new-jwt-token', 
        user: { _id: '456', email: 'test@example.com' },
        message: 'Registered successfully' 
      }
    });

    renderSignup();

    // Fill form
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByTestId('mock-recaptcha'));

    // Submit for OTP
    const form = screen.getByLabelText(/full name/i).closest('form');
    fireEvent.submit(form);

    // Wait for the OTP UI
    const otpInput = await screen.findByLabelText(/enter 6-digit otp/i);
    expect(otpInput).toBeInTheDocument();

    // Fill OTP
    fireEvent.change(otpInput, { target: { value: '123456' } });

    // Submit final signup
    fireEvent.click(screen.getByRole('button', { name: /verify & create account/i }));

    await waitFor(() => {
      expect(http.post).toHaveBeenCalledWith('/api/auth/signup', {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'student',
        otp: '123456'
      });
    });

    expect(mockLogin).toHaveBeenCalledWith('new-jwt-token', expect.any(Object));
    expect(mockNavigate).toHaveBeenCalledWith('/verify-id');
  });
});
