import React, { useEffect, useState, useCallback } from 'react';
import http from '../api/http';
import JobCard from '../components/Jobcard';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Search, Briefcase, MapPin, Filter, Plus, RefreshCw } from 'lucide-react';
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
      console.log('🔄 Fetching jobs with query:', searchQuery);
      
      // Send search query even if it's a single character
      const params = { 
        page: currentPage, 
        limit: 12 
      };
      
      // Only add search param if query exists
      if (searchQuery && searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      
      const res = await http.get('/api/jobs', { params });
      
      console.log('✅ Jobs loaded:', res.data);
      setJobs(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error('❌ Error:', err);
      setError(err.response?.data?.message || 'Failed to fetch jobs');
    } finally { 
      setLoading(false); 
    }
  };

  // Immediate search on every character typed - NO DEBOUNCE
  useEffect(() => {
    fetchJobs(q, page);
  }, [q, page]);

  const handleSearchClick = () => {
    setPage(1);
    fetchJobs(q, 1);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      setPage(1);
      fetchJobs(q, 1);
    }
  };

  const handleClearSearch = () => {
    setQ('');
    setPage(1);
  };

  return (
    <div className="jobs-page">
      {/* Hero Section */}
      <div className="jobs-hero">
        <div className="jobs-hero-content">
          <h1 className="jobs-hero-title">
            <Briefcase className="hero-icon" />
            Discover Your Career
          </h1>
          <p className="jobs-hero-subtitle">
            Explore opportunities from alumni and leading companies
          </p>
          
          {/* Search Bar - FIXED with proper spacing */}
          <div className="jobs-search-wrapper">
            <div className="jobs-search-container">
              <Search className="search-icon" />
              <input
                type="text"
                className="jobs-search-input"
                placeholder="Search jobs, companies, or keywords..."
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
                onKeyPress={handleKeyPress}
              />
              {q && (
                <button 
                  className="search-clear"
                  onClick={handleClearSearch}
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>
            <button 
              className="search-btn"
              onClick={handleSearchClick}
              disabled={loading}
            >
              <Search size={18} />
              Search
            </button>
            <button 
              className="refresh-btn"
              onClick={() => fetchJobs(q, page)}
              disabled={loading}
              title="Refresh jobs"
            >
              <RefreshCw size={18} className={loading ? 'spinning' : ''} />
            </button>
          </div>

          {/* Quick Stats */}
          <div className="jobs-stats">
            <div className="stat-item">
              <span className="stat-number">{total}</span>
              <span className="stat-label">Active Jobs</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-number">{jobs.length}</span>
              <span className="stat-label">Showing Now</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="jobs-container">
        {/* Header Actions */}
        <div className="jobs-header">
          <div className="jobs-header-left">
            <h2 className="jobs-section-title">
              {q ? `Results for "${q}"` : 'All Opportunities'}
            </h2>
            <span className="jobs-count">{total} position{total !== 1 ? 's' : ''}</span>
          </div>
          
          <div className="jobs-header-right">
            {user && (user.role === 'alumni' || user.role === 'admin') && (
              <Link to="/post-job" className="btn-post-job">
                <Plus size={18} />
                Post a Job
              </Link>
            )}
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="error-banner">
            <span className="error-icon">⚠️</span>
            <div>
              <strong>Oops!</strong> {error}
            </div>
            <button 
              onClick={() => fetchJobs(q, page)}
              className="retry-btn"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="loading-grid">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="job-skeleton">
                <div className="skeleton-header">
                  <div className="skeleton-avatar"></div>
                  <div className="skeleton-info">
                    <div className="skeleton-line skeleton-title"></div>
                    <div className="skeleton-line skeleton-subtitle"></div>
                  </div>
                </div>
                <div className="skeleton-body">
                  <div className="skeleton-line"></div>
                  <div className="skeleton-line"></div>
                  <div className="skeleton-line short"></div>
                </div>
                <div className="skeleton-footer">
                  <div className="skeleton-tag"></div>
                  <div className="skeleton-tag"></div>
                </div>
              </div>
            ))}
          </div>
        ) : jobs.length === 0 ? (
          /* Empty State */
          <div className="empty-state">
            <div className="empty-icon">
              <Briefcase size={64} />
            </div>
            <h3 className="empty-title">
              {q ? 'No matches found' : 'No jobs available yet'}
            </h3>
            <p className="empty-description">
              {q 
                ? `We couldn't find any jobs matching "${q}". Try different keywords or clear your search.`
                : 'Be the first to post a job opportunity for our alumni network!'}
            </p>
            
            <div className="empty-actions">
              {q && (
                <button className="btn-secondary" onClick={handleClearSearch}>
                  Clear Search
                </button>
              )}
              {user && (user.role === 'alumni' || user.role === 'admin') && (
                <Link to="/post-job" className="btn-primary">
                  <Plus size={18} />
                  Post the First Job
                </Link>
              )}
            </div>
          </div>
        ) : (
          /* Jobs Grid */
          <>
            <div className="jobs-grid">
              {jobs.map((job, index) => (
                <div 
                  key={job._id} 
                  className="job-card-wrapper"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <JobCard job={job} />
                </div>
              ))}
            </div>

            {/* Pagination */}
            {total > 12 && (
              <div className="jobs-pagination">
                <button 
                  className="pagination-btn"
                  disabled={page <= 1 || loading} 
                  onClick={() => setPage(p => p - 1)}
                >
                  ← Previous
                </button>
                
                <div className="pagination-info">
                  Page <strong>{page}</strong> of <strong>{Math.ceil(total / 12)}</strong>
                </div>
                
                <button 
                  className="pagination-btn"
                  disabled={page >= Math.ceil(total / 12) || loading} 
                  onClick={() => setPage(p => p + 1)}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}