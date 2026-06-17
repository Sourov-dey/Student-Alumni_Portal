import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import http from '../api/http';
import { Briefcase, Building, MapPin, Calendar, Clock, CheckCircle, XCircle } from 'lucide-react';
import './MyApplications.css';

export default function MyApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const res = await http.get('/api/applications/me');
        setApplications(res.data.items || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch applications');
      } finally {
        setLoading(false);
      }
    };
    fetchApplications();
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'shortlisted':
        return <Clock size={16} className="status-icon" />;
      case 'hired':
        return <CheckCircle size={16} className="status-icon" />;
      case 'rejected':
        return <XCircle size={16} className="status-icon" />;
      default: // submitted
        return <CheckCircle size={16} className="status-icon" />;
    }
  };

  const getStatusBadge = (status) => {
    return (
      <span className={`status-badge status-${status.toLowerCase()}`}>
        {getStatusIcon(status)}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="applications-page">
        <div className="loading-grid">
          {[1, 2, 3].map(i => (
            <div key={i} className="app-skeleton"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="applications-page">
        <div className="error-banner">
          <strong>Oops!</strong> {error}
        </div>
      </div>
    );
  }

  return (
    <div className="applications-page">
      <div className="applications-header">
        <h1>My Applications</h1>
        <p>Track the status of your job and internship applications</p>
      </div>

      {applications.length === 0 ? (
        <div className="empty-state">
          <Briefcase size={48} className="empty-icon" />
          <h3>No applications yet</h3>
          <p>You haven't applied to any jobs yet. Start exploring opportunities!</p>
          <Link to="/jobs" className="btn-primary">Browse Jobs</Link>
        </div>
      ) : (
        <div className="applications-grid">
          {applications.map((app) => (
            <div key={app._id} className="application-card glass-panel">
              <div className="app-card-header">
                <div className="app-job-info">
                  <h3 className="app-job-title">
                    {app.job ? <Link to={`/jobs/${app.job._id}`}>{app.job.title}</Link> : 'Job Removed'}
                  </h3>
                  {app.job && (
                    <div className="app-job-meta">
                      <span><Building size={14} /> {app.job.company}</span>
                      <span><MapPin size={14} /> {app.job.location}</span>
                    </div>
                  )}
                </div>
                <div className="app-status">
                  {getStatusBadge(app.status)}
                </div>
              </div>
              
              <div className="app-card-footer">
                <div className="app-date">
                  <Calendar size={14} /> Applied on {new Date(app.createdAt).toLocaleDateString()}
                </div>
                {app.job && (
                  <Link to={`/jobs/${app.job._id}`} className="view-job-link">
                    View Job Details
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
