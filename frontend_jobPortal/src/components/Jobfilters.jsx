import React from 'react';

export default function JobFilters({ q, setQ, onRefresh }) {
  return (
    <div className="filters">
      <input
        placeholder="Search jobs, companies..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="search-input"
      />
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn" onClick={onRefresh}>Refresh</button>
      </div>
    </div>
  );
}
