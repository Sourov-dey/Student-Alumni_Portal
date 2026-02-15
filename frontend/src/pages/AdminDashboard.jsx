import React, { useEffect, useState } from "react";
import http from "../api/http";

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [pendingCount, setPendingCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const [analyticsRes, verifRes] = await Promise.all([
                    http.get("/api/admin/analytics"),
                    http.get("/api/admin/verifications?status=pending"),
                ]);
                setStats(analyticsRes.data);
                setPendingCount(
                    Array.isArray(verifRes.data) ? verifRes.data.length : 0
                );
            } catch (e) {
                console.error("Dashboard load error", e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    if (loading) {
        return (
            <div className="admin-loading">
                <div className="admin-spinner" />
                <p>Loading dashboard…</p>
            </div>
        );
    }

    const cards = [
        {
            icon: "👥",
            value: stats?.totalUsers ?? "–",
            label: "Total Users",
            color: "blue",
        },
        {
            icon: "💼",
            value: stats?.totalJobs ?? "–",
            label: "Total Jobs",
            color: "green",
        },
        {
            icon: "📄",
            value: stats?.totalApplications ?? "–",
            label: "Applications",
            color: "purple",
        },
        {
            icon: "⏳",
            value: pendingCount,
            label: "Pending Verifications",
            color: "amber",
        },
    ];

    return (
        <>
            <div className="admin-page-header">
                <h2>Dashboard</h2>
                <p>Overview of your portal's activity</p>
            </div>

            <div className="stat-cards">
                {cards.map((c) => (
                    <div className={`stat-card ${c.color}`} key={c.label}>
                        <div className="stat-card-icon">{c.icon}</div>
                        <div className="stat-card-value">{c.value}</div>
                        <div className="stat-card-label">{c.label}</div>
                    </div>
                ))}
            </div>
        </>
    );
}
