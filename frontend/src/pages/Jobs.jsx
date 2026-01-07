import React, { useEffect, useState } from 'react';
import http from '../api/http';
import JobCard from '../components/Jobcard';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Search, Briefcase, Plus, RefreshCw, X } from 'lucide-react';
import '../styles/pages/jobs.css';

export default function Jobs() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchJobs = async (searchQuery = q, currentPage = page) => {
    setLoading(true);
    setError(null);
    try {
      const params = { page: currentPage, limit: 12 };
      if (searchQuery && searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      const res = await http.get('/api/jobs', { params });
      setJobs(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch jobs');
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => {
    fetchJobs(q, page);
  }, [q, page]);

  return (
    <div className="glass-jobs-provider">
      {/* 3D Background Elements */}
      <div className="blob-c">
        <div className="shape-blob"></div>
        <div className="shape-blob one"></div>
        <div className="shape-blob two"></div>
      </div>

      <div className="jobs-hero-3d">
        <div className="glass-card hero-inner">
          <h1 className="hero-title-3d">
            <div className="icon-3d"><Briefcase /></div>
            Discover Your Career
          </h1>
          <p className="hero-subtitle-3d">Explore opportunities from alumni and leading companies</p>
          
          <div className="search-box-3d">
            <Search className="s-icon" size={20} />
            <input
              type="text"
              placeholder="Search jobs, companies..."
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
            />
            {q && <button className="clear-3d" onClick={() => setQ('')}><X size={16}/></button>}
            <button className="btn-search-3d" onClick={() => fetchJobs()}>Search</button>
            <button className={`refresh-3d ${loading ? 'spinning' : ''}`} onClick={() => fetchJobs()}>
              <RefreshCw size={20} />
            </button>
          </div>

          <div className="stats-container-3d">
            <div className="glass-stat">
              <span className="num">{total}</span>
              <span className="lbl">Active Jobs</span>
            </div>
            <div className="glass-stat">
              <span className="num">{jobs.length}</span>
              <span className="lbl">Showing</span>
            </div>
          </div>
        </div>
      </div>

      <div className="jobs-container-v3">
        <div className="glass-header">
          <h2>{q ? `Results for "${q}"` : 'All Opportunities'}</h2>
          {user && (user.role === 'alumni' || user.role === 'admin') && (
            <Link to="/post-job" className="btn-post-3d">
              <Plus size={20} /> Post Job
            </Link>
          )}
        </div>

        {loading ? (
          <div className="loading-grid-3d">
            {[1,2,3,4].map(i => <div key={i} className="glass-skeleton" />)}
          </div>
        ) : (
          <div className="jobs-grid-3d">
            {jobs.map((job) => (
              <div key={job._id} className="job-card-3d-wrapper">
                <JobCard job={job} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}