import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function JobCard({ job }) {
  const { user } = useAuth();
  const isJobOwner = user && (user.role === 'alumni' || user.role === 'admin');

  return (
    <article className="job-card">
      <div className="job-card-head">
        <h3 className="job-title"><Link to={`/jobs/${job._id}`}>{job.title}</Link></h3>
        <div className="job-meta">
          {job.company} • {job.location} • {job.type}
          {isJobOwner && job.applicationStats && (
            <span className="application-count">
              • {job.applicationStats.totalApplications} application{job.applicationStats.totalApplications !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      <p className="job-excerpt">{job.description ? job.description.slice(0, 180) + (job.description.length > 180 ? '…' : '') : ''}</p>

      <div className="job-footer">
        <div className="job-tags">
          {job.department && <span className="chip">{job.department}</span>}
          {job.markedFilled && <span className="chip filled">Filled</span>}
        </div>
        <Link to={`/jobs/${job._id}`} className="btn small">View</Link>
      </div>
    </article>
  );
}
