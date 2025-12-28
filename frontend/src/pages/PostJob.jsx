import React, { useState } from 'react';
import http from '../api/http';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Briefcase, Building2, MapPin, Tag, Clock, FileText, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import '../styles/pages/postjob.css';

export default function PostJob() {
  const { user } = useAuth();
  const nav = useNavigate();

  const [form, setForm] = useState({
    title: '',
    company: '',
    location: '',
    department: '',
    type: 'Full-time',
    description: '',
    requirements: '' // comma-separated
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Simple client-side role guard
  if (!user) return (
    <div className="access-denied-container">
      <div className="access-denied-card">
        <div className="access-icon error">
          <AlertCircle size={48} />
        </div>
        <h2>Authentication Required</h2>
        <p>Please login to post a job opportunity</p>
        <Link to="/login" className="btn-access primary">Login Now</Link>
      </div>
    </div>
  );
  
  if (user.role !== 'alumni' && user.role !== 'admin') {
    return (
      <div className="access-denied-container">
        <div className="access-denied-card">
          <div className="access-icon error">
            <AlertCircle size={48} />
          </div>
          <h2>Access Restricted</h2>
          <p>Only alumni or admin users can post jobs. Please login with an alumni account.</p>
          <Link to="/" className="btn-access primary">Back to Home</Link>
        </div>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Helper: extract best possible error message
  const extractError = (err) => {
    const res = err?.response;
    if (!res) return err?.message || 'Request failed';
    const data = res.data;

    if (typeof data === 'string') return `${res.status} ${res.statusText}: ${data}`;
    if (data?.message) return `${res.status} ${res.statusText}: ${data.message}`;
    if (Array.isArray(data?.errors) && data.errors.length) {
      const msg = data.errors
        .map((e) => (typeof e === 'string' ? e : e?.msg || e?.message || JSON.stringify(e)))
        .join(' • ');
      return `${res.status} ${res.statusText}: ${msg}`;
    }
    if (data?.error) return `${res.status} ${res.statusText}: ${data.error}`;
    try {
      return `${res.status} ${res.statusText}: ${JSON.stringify(data)}`;
    } catch {
      return `${res.status} ${res.statusText}`;
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const requirementsArr = form.requirements
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        title: form.title?.trim(),
        company: form.company?.trim(),
        location: form.location?.trim() || 'Remote',
        department: form.department?.trim(),
        type: form.type,
        description: form.description?.trim(),
        requirements: requirementsArr
      };

      const res = await http.post('/api/jobs', payload);

      setSuccess('Job posted successfully');

      const created = res.data?.job || res.data?.data || res.data;
      const id = created?._id || created?.id;
      
      setTimeout(() => {
        if (id) {
          nav(`/jobs/${id}`);
        } else {
          nav('/jobs');
        }
      }, 1500);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="post-job-page">
      <div className="post-job-container">
        {/* Header */}
        <div className="post-job-header">
          <button onClick={() => nav('/jobs')} className="back-button">
            <ArrowLeft size={20} />
            Back to Jobs
          </button>
          <div className="header-content">
            <div className="header-icon">
              <Briefcase size={32} />
            </div>
            <div>
              <h1 className="header-title">Post a New Job</h1>
              <p className="header-subtitle">Share an opportunity with our alumni network</p>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="post-job-card">
          <form onSubmit={submit} className="post-job-form">
            {/* Job Title */}
            <div className="form-group">
              <label className="form-label">
                <Briefcase size={18} />
                Job Title
                <span className="required">*</span>
              </label>
              <input 
                name="title" 
                value={form.title} 
                onChange={handleChange} 
                className="form-input"
                placeholder="e.g. Senior Software Engineer"
                required 
              />
            </div>

            {/* Company */}
            <div className="form-group">
              <label className="form-label">
                <Building2 size={18} />
                Company Name
                <span className="required">*</span>
              </label>
              <input 
                name="company" 
                value={form.company} 
                onChange={handleChange} 
                className="form-input"
                placeholder="e.g. Microsoft"
                required 
              />
            </div>

            {/* Location & Department Row */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  <MapPin size={18} />
                  Location
                </label>
                <input 
                  name="location" 
                  value={form.location} 
                  onChange={handleChange} 
                  className="form-input"
                  placeholder="Guwahati or Remote" 
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Tag size={18} />
                  Department
                </label>
                <input 
                  name="department" 
                  value={form.department} 
                  onChange={handleChange} 
                  className="form-input"
                  placeholder="e.g. CSE, ECE" 
                />
              </div>
            </div>

            {/* Job Type */}
            <div className="form-group">
              <label className="form-label">
                <Clock size={18} />
                Employment Type
              </label>
              <select 
                name="type" 
                value={form.type} 
                onChange={handleChange}
                className="form-select"
              >
                <option>Full-time</option>
                <option>Part-time</option>
                <option>Internship</option>
                <option>Contract</option>
                <option>Freelance</option>
              </select>
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label">
                <FileText size={18} />
                Job Description
                <span className="required">*</span>
              </label>
              <textarea 
                name="description" 
                value={form.description} 
                onChange={handleChange} 
                rows={8} 
                className="form-textarea"
                placeholder="Describe the role, responsibilities, and what makes this opportunity exciting..."
                required 
              />
              <div className="form-hint">
                {form.description.length}/2000 characters
              </div>
            </div>

            {/* Requirements */}
            <div className="form-group">
              <label className="form-label">
                <CheckCircle size={18} />
                Requirements
              </label>
              <input
                name="requirements"
                value={form.requirements}
                onChange={handleChange}
                className="form-input"
                placeholder="React, Node.js, MongoDB, 3+ years experience"
              />
              <div className="form-hint">
                Separate multiple requirements with commas
              </div>
            </div>

            {/* Preview Requirements */}
            {form.requirements && (
              <div className="requirements-preview">
                <div className="preview-label">Requirements Preview:</div>
                <div className="requirements-tags">
                  {form.requirements.split(',').map((req, i) => 
                    req.trim() && (
                      <span key={i} className="requirement-tag">
                        {req.trim()}
                      </span>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Alert Messages */}
            {error && (
              <div className="alert alert-error">
                <AlertCircle size={20} />
                <div className="alert-content">
                  <strong>Error</strong>
                  <p>{error}</p>
                </div>
              </div>
            )}

            {success && (
              <div className="alert alert-success">
                <CheckCircle size={20} />
                <div className="alert-content">
                  <strong>Success!</strong>
                  <p>{success}</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="form-actions">
              <button 
                type="button" 
                onClick={() => nav('/jobs')}
                className="btn-secondary"
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="spinner"></div>
                    Posting...
                  </>
                ) : (
                  <>
                    <Briefcase size={18} />
                    Post Job
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}