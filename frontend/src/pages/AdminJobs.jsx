import React, { useEffect, useMemo, useState } from "react";
import http from "../api/http";

export default function AdminJobs() {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [q, setQ] = useState("");

    const fetchJobs = async () => {
        setLoading(true);
        try {
            const res = await http.get("/api/admin/jobs");
            setJobs(res.data || []);
        } catch (e) {
            alert(e?.response?.data?.message || "Failed to load jobs");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJobs();
    }, []);

    const filtered = useMemo(() => {
        const term = q.trim().toLowerCase();
        if (!term) return jobs;
        return jobs.filter(
            (j) =>
                (j.title || "").toLowerCase().includes(term) ||
                (j.company || "").toLowerCase().includes(term) ||
                (j.postedBy?.name || "").toLowerCase().includes(term)
        );
    }, [jobs, q]);

    const remove = async (id) => {
        if (!window.confirm("Delete this job posting? This cannot be undone."))
            return;
        try {
            await http.delete(`/api/admin/jobs/${id}`);
            await fetchJobs();
        } catch (e) {
            alert(e?.response?.data?.message || "Delete failed");
        }
    };

    return (
        <>
            <div className="admin-page-header">
                <h2>Job Management</h2>
                <p>Review and manage all job postings on the portal</p>
            </div>

            <div className="admin-table-wrap">
                <div className="admin-table-toolbar">
                    <input
                        className="admin-search"
                        placeholder="Search by title, company, or poster…"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                    />
                </div>

                {loading ? (
                    <div className="admin-loading">
                        <div className="admin-spinner" />
                        <p>Loading jobs…</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="admin-empty">
                        <div className="admin-empty-icon">📭</div>
                        <p>No jobs found</p>
                    </div>
                ) : (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Company</th>
                                <th>Posted By</th>
                                <th>Type</th>
                                <th>Posted</th>
                                <th style={{ width: 100 }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((j) => (
                                <tr key={j._id}>
                                    <td style={{ fontWeight: 600 }}>{j.title || "–"}</td>
                                    <td>{j.company || "–"}</td>
                                    <td>{j.postedBy?.name || "–"}</td>
                                    <td>
                                        <span className="badge badge-alumni">
                                            {j.type || j.jobType || "–"}
                                        </span>
                                    </td>
                                    <td>
                                        {j.createdAt
                                            ? new Date(j.createdAt).toLocaleDateString()
                                            : "–"}
                                    </td>
                                    <td>
                                        <button
                                            className="admin-btn admin-btn-delete"
                                            onClick={() => remove(j._id)}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </>
    );
}
