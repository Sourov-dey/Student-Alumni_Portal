import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter, useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../Navbar';
import * as AuthContext from '../../context/AuthContext';
import http from '../../api/http';

// Mock dependencies
vi.mock('../../api/http', () => ({
  default: {
    get: vi.fn(),
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useLocation: vi.fn(),
    useNavigate: vi.fn(),
  };
});

describe('Navbar Component', () => {
  const mockLogout = vi.fn();
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
    vi.mocked(useLocation).mockReturnValue({ pathname: '/' });
  });

  const renderNavbar = (userValue) => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: userValue,
      logout: mockLogout,
    });
    return render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );
  };

  it('renders correctly for non-authenticated users', () => {
    renderNavbar(null);

    // Verify brand logo text
    expect(screen.getByText(/Alumni-Student Portal/i)).toBeInTheDocument();

    // Verify generic links
    expect(screen.getByText('Home', { selector: '.nav-link-item' })).toBeInTheDocument();
    expect(screen.getByText('Jobs', { selector: '.nav-link-item' })).toBeInTheDocument();

    // Auth actions
    const getStartedBtn = screen.getByRole('button', { name: /get started/i });
    expect(getStartedBtn).toBeInTheDocument();

    // Not authenticated, so Profile, Chat, and Map shouldn't render
    expect(screen.queryByText('Profile', { selector: '.nav-link-item' })).not.toBeInTheDocument();
  });

  it('renders correctly for authenticated student users', async () => {
    http.get.mockResolvedValueOnce({ data: { status: 'pending' } });
    const studentUser = {
      _id: '1',
      email: 'student@example.com',
      role: 'student',
      verified: false,
    };

    renderNavbar(studentUser);

    // Verify student specific UI rendered
    expect(screen.getByText('student@example.com')).toBeInTheDocument();
    expect(screen.getByText('student')).toBeInTheDocument();
    expect(screen.getByText('Profile', { selector: '.nav-link-item' })).toBeInTheDocument();

    // Should not render "Post Job" since they are not alumni
    expect(screen.queryByText(/post job/i)).not.toBeInTheDocument();

    // Verification status network mock resolution
    await waitFor(() => {
      expect(http.get).toHaveBeenCalledWith('/api/verify/status');
    });
  });

  it('renders correctly for authenticated alumni users', async () => {
    http.get.mockResolvedValueOnce({ data: { status: 'verified' } });
    const alumniUser = {
      _id: '2',
      email: 'alumni@example.com',
      role: 'alumni',
      verified: true
    };

    renderNavbar(alumniUser);

    expect(screen.getByText('Post Job')).toBeInTheDocument();
    
    // Test logout functionality
    const logoutBtn = screen.getAllByRole('button', { name: /logout/i })[0]; 
    // there could be 2, one desktop one mobile. We grab the first one
    fireEvent.click(logoutBtn);
    
    expect(mockLogout).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('renders correctly for admin users', () => {
    const adminUser = {
      _id: '3',
      email: 'admin@example.com',
      role: 'admin',
    };

    renderNavbar(adminUser);

    // Should see 'Admin' top nav link
    expect(screen.getByText('Admin', { selector: '.nav-link-item' })).toBeInTheDocument();
    
    // API shouldn't be called for Admin status
    expect(http.get).not.toHaveBeenCalled();
  });
});
