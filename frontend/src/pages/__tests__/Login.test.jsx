import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import Login from '../Login';
import http from '../../api/http';
import { useAuth } from '../../context/AuthContext';

// Mock the dependencies
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
    default: ({ onChange }) => (
      <button data-testid="mock-recaptcha" onClick={() => onChange('mock-token')}>
        Verify Captcha
      </button>
    ),
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
const renderLogin = () => {
  return render(
    <BrowserRouter>
      <Login />
    </BrowserRouter>
  );
};

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form correctly', () => {
    renderLogin();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows error if fields are omitted on submit', async () => {
    renderLogin();
    const submitBtn = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
  });

  it('logs user in successfully with valid credentials and captcha', async () => {
    http.post.mockResolvedValueOnce({
      data: { token: 'fake-jwt-token', user: { _id: '123', email: 'test@example.com' } }
    });

    renderLogin();

    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    
    // Simulate reCAPTCHA verification
    fireEvent.click(screen.getByTestId('mock-recaptcha'));

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(http.post).toHaveBeenCalledWith('/api/auth/login', {
        email: 'test@example.com',
        password: 'password123',
        captchaToken: 'mock-token'
      });
    });

    expect(mockLogin).toHaveBeenCalledWith('fake-jwt-token', expect.any(Object));
    expect(mockNavigate).toHaveBeenCalledWith('/jobs');
  });

  it('shows error on failed login credentials', async () => {
    http.post.mockRejectedValueOnce({
      response: {
        status: 401,
        data: { message: 'Invalid email or password' }
      }
    });

    renderLogin();

    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'wrong@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByTestId('mock-recaptcha'));

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
