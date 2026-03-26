import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import Profile from '../Profile';
import http from '../../api/http';
import { useAuth } from '../../context/AuthContext';
import { Toaster } from 'react-hot-toast';

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  Toaster: () => null,
  default: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

// Mock Leaflet and its React components
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div data-testid="mock-map">{children}</div>,
  TileLayer: () => <div />,
  Marker: () => <div />,
  Popup: () => <div />,
  useMapEvents: vi.fn(),
  useMap: () => ({
    flyTo: vi.fn(),
  }),
}));

vi.mock('leaflet', () => {
  class MockIcon {
    constructor(options) {
      this.options = options;
    }
  }
  MockIcon.Default = {
    prototype: { _getIconUrl: vi.fn() },
    mergeOptions: vi.fn(),
  };

  return {
    default: {
      Icon: MockIcon,
      icon: vi.fn(),
    },
  };
});

// Mock http
vi.mock('../../api/http', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

// Mock useAuth
const mockSetUser = vi.fn();
vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const renderProfile = () => {
  return render(
    <BrowserRouter>
      <Toaster />
      <Profile />
    </BrowserRouter>
  );
};

describe('Profile Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('shows login prompt if unauthenticated', () => {
    useAuth.mockReturnValue({ user: null, setUser: mockSetUser });
    renderProfile();
    expect(screen.getByText(/sign in to view your profile/i)).toBeInTheDocument();
  });

  it('renders alumni profile and fetches data correctly', async () => {
    const mockUser = {
      _id: 'alu123',
      name: 'Alumni User',
      email: 'alumni@test.com',
      role: 'alumni',
      bio: 'Alumni Bio',
      department: 'Computer Science',
      location: { city: 'Bengaluru', country: 'India' }
    };

    useAuth.mockReturnValue({ user: mockUser, setUser: mockSetUser });
    http.get.mockResolvedValueOnce({ data: mockUser });

    renderProfile();

    expect(screen.getByText(/loading profile/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByText(/alumni user/i)[0]).toBeInTheDocument();
    });

    expect(screen.getAllByText(/alumni@test.com/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/alumni bio/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/computer science/i)[0]).toBeInTheDocument();
    
    // Check specific alumni map rendering sections
    expect(screen.getAllByText(/address & location/i)[0]).toBeInTheDocument();
    // Student sections should be missing
    expect(screen.queryByText(/projects/i)).not.toBeInTheDocument();
  });

  it('renders student profile and displays specialized sections', async () => {
    const mockStudent = {
      _id: 'stu123',
      name: 'Student User',
      email: 'student@test.com',
      role: 'student',
      technicalSkills: ['React', 'NodeJS'],
      nonTechnicalSkills: ['Leadership'],
      projects: [{ title: 'Capstone Project', description: 'Test Project' }],
      certifications: [{ title: 'AWS Certified' }]
    };

    useAuth.mockReturnValue({ user: mockStudent, setUser: mockSetUser });
    http.get.mockResolvedValueOnce({ data: mockStudent });

    renderProfile();

    await waitFor(() => {
      expect(screen.getAllByText(/student user/i)[0]).toBeInTheDocument();
    });

    // Check student-specific sections
    expect(screen.getAllByText(/skills & interests/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/react/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/nodejs/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/leadership/i)[0]).toBeInTheDocument();
    
    expect(screen.getAllByText(/projects/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/capstone project/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/test project/i)[0]).toBeInTheDocument();
    
    expect(screen.getAllByText(/certifications/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/aws certified/i)[0]).toBeInTheDocument();
  });

  it('allows editing and saving profile information', async () => {
    const mockUser = {
      _id: 'u456',
      name: 'Edit Tester',
      email: 'edit@tester.com',
      role: 'student',
      phone: '1234567890'
    };

    const updatedUser = {
      ...mockUser,
      name: 'Edited Tester',
      phone: '0987654321'
    };

    useAuth.mockReturnValue({ user: mockUser, setUser: mockSetUser });
    http.get.mockResolvedValueOnce({ data: mockUser });
    http.patch.mockResolvedValueOnce({ data: updatedUser });

    renderProfile();

    await waitFor(() => {
      expect(screen.getAllByText(/edit tester/i)[0]).toBeInTheDocument();
    });

    // Toggle edit mode
    fireEvent.click(screen.getByRole('button', { name: /edit profile/i }));

    // Fields should turn into inputs
    const nameInput = screen.getByDisplayValue('Edit Tester');
    const phoneInput = screen.getByDisplayValue('1234567890');
    
    fireEvent.change(nameInput, { target: { name: 'name', value: 'Edited Tester' } });
    fireEvent.change(phoneInput, { target: { name: 'phone', value: '0987654321' } });

    // Save changes
    const saveBtn = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(http.patch).toHaveBeenCalledWith('/api/users/u456', expect.objectContaining({
        name: 'Edited Tester',
        phone: '0987654321'
      }));
    });

    // Expect the profile logic to call setUser with the updated data
    expect(mockSetUser).toHaveBeenCalledWith(updatedUser);
  });
});
