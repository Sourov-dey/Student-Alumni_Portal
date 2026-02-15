import React, { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AdminDashboard from "./AdminDashboard";
import AdminUsers from "./AdminUsers";
import AdminJobs from "./AdminJobs";
import AdminVerifications from "./AdminVerifications";
import "./AdminPanel.css";

const TABS = [
    { key: "dashboard", label: "Dashboard", icon: "📊", path: "/admin" },
    { key: "users", label: "Users", icon: "👥", path: "/admin/users" },
    { key: "jobs", label: "Jobs", icon: "💼", path: "/admin/jobs" },
    {
        key: "verifications",
        label: "Verifications",
        icon: "🛡️",
        path: "/admin/verifications",
    },
];

function resolveTab(pathname) {
    if (pathname.startsWith("/admin/users")) return "users";
    if (pathname.startsWith("/admin/jobs")) return "jobs";
    if (pathname.startsWith("/admin/verifications")) return "verifications";
    return "dashboard";
}

export default function AdminPanel() {
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Guard: only admin users
    if (!user || user.role !== "admin") {
        return <Navigate to="/" replace />;
    }

    const activeTab = resolveTab(location.pathname);

    const goTo = (tab) => {
        navigate(tab.path);
        setSidebarOpen(false);
    };

    let content;
    switch (activeTab) {
        case "users":
            content = <AdminUsers />;
            break;
        case "jobs":
            content = <AdminJobs />;
            break;
        case "verifications":
            content = <AdminVerifications />;
            break;
        default:
            content = <AdminDashboard />;
    }

    return (
        <div className="admin-panel">
            {/* Mobile overlay */}
            <div
                className={`admin-sidebar-overlay ${sidebarOpen ? "open" : ""}`}
                onClick={() => setSidebarOpen(false)}
            />

            {/* Sidebar */}
            <aside className={`admin-sidebar ${sidebarOpen ? "open" : ""}`}>
                <div className="admin-sidebar-title">Admin Panel</div>
                {TABS.map((tab) => (
                    <button
                        key={tab.key}
                        className={`admin-nav-btn ${activeTab === tab.key ? "active" : ""}`}
                        onClick={() => goTo(tab)}
                    >
                        <span className="admin-nav-icon">{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </aside>

            {/* Content */}
            <main className="admin-content">{content}</main>

            {/* Mobile FAB */}
            <button
                className="admin-mobile-toggle"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label="Toggle sidebar"
            >
                {sidebarOpen ? "✕" : "☰"}
            </button>
        </div>
    );
}
