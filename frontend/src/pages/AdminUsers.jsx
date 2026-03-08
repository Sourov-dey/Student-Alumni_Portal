import React, { useEffect, useMemo, useState } from "react";
import http from "../api/http";

export default function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [q, setQ] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const url =
                roleFilter === "all"
                    ? "/api/admin/users"
                    : `/api/admin/users?role=${roleFilter}`;
            const res = await http.get(url);
            setUsers(res.data || []);
        } catch (e) {
            alert(e?.response?.data?.message || "Failed to load users");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
        // eslint-disable-next-line
    }, [roleFilter]);

    const filtered = useMemo(() => {
        const term = q.trim().toLowerCase();
        if (!term) return users;
        return users.filter(
            (u) =>
                (u.name || "").toLowerCase().includes(term) ||
                (u.email || "").toLowerCase().includes(term)
        );
    }, [users, q]);

    const verify = async (id) => {
        if (!window.confirm("Mark this user as verified?")) return;
        try {
            await http.patch(`/api/admin/users/${id}/verify`);
            await fetchUsers();
        } catch (e) {
            alert(e?.response?.data?.message || "Verify failed");
        }
    };

    const suspend = async (id, isSuspended) => {
        const action = isSuspended ? "unsuspend" : "suspend";
        const msg = isSuspended
            ? "Reactivate this user? They will be able to login and use the portal again."
            : "Suspend this user? They won't be able to login or post.";
        if (!window.confirm(msg)) return;
        try {
            await http.patch(`/api/admin/users/${id}/suspend`);
            await fetchUsers();
        } catch (e) {
            alert(e?.response?.data?.message || `${action} failed`);
        }
    };

    const remove = async (id) => {
        if (!window.confirm("Permanently delete this user and ALL their data (jobs, messages, applications)? This cannot be undone."))
            return;
        try {
            await http.delete(`/api/admin/users/${id}`);
            await fetchUsers();
        } catch (e) {
            alert(e?.response?.data?.message || "Delete failed");
        }
    };

    return (
        <>
            <div className="admin-page-header">
                <h2>User Management</h2>
                <p>View, verify, suspend, or remove portal users</p>
            </div>

            <div className="admin-table-wrap">
                <div className="admin-table-toolbar">
                    <input
                        className="admin-search"
                        placeholder="Search by name or email…"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                    />
                    <select
                        className="admin-filter-select"
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                    >
                        <option value="all">All Roles</option>
                        <option value="student">Students</option>
                        <option value="alumni">Alumni</option>
                        <option value="admin">Admins</option>
                    </select>
                </div>

                {loading ? (
                    <div className="admin-loading">
                        <div className="admin-spinner" />
                        <p>Loading users…</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="admin-empty">
                        <div className="admin-empty-icon">🔍</div>
                        <p>No users found</p>
                    </div>
                ) : (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Verified</th>
                                <th>Status</th>
                                <th>Joined</th>
                                <th style={{ width: 220 }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((u) => (
                                <tr key={u._id} className={u.suspended ? "row-suspended" : ""}>
                                    <td>{u.name || "–"}</td>
                                    <td>{u.email}</td>
                                    <td>
                                        <span className={`badge badge-${u.role}`}>{u.role}</span>
                                    </td>
                                    <td>
                                        <span
                                            className={`badge ${u.verified ? "badge-verified" : "badge-unverified"
                                                }`}
                                        >
                                            {u.verified ? "✓ Verified" : "✗ Not verified"}
                                        </span>
                                    </td>
                                    <td>
                                        <span
                                            className={`badge ${u.suspended ? "badge-suspended" : "badge-active"
                                                }`}
                                        >
                                            {u.suspended ? "Suspended" : "Active"}
                                        </span>
                                    </td>
                                    <td>
                                        {u.createdAt
                                            ? new Date(u.createdAt).toLocaleDateString()
                                            : "–"}
                                    </td>
                                    <td>
                                        <div className="admin-actions">
                                            {!u.verified && (
                                                <button
                                                    className="admin-btn admin-btn-verify"
                                                    onClick={() => verify(u._id)}
                                                >
                                                    Verify
                                                </button>
                                            )}
                                            {u.role !== "admin" && (
                                                <button
                                                    className={`admin-btn ${u.suspended ? "admin-btn-unsuspend" : "admin-btn-suspend"}`}
                                                    onClick={() => suspend(u._id, u.suspended)}
                                                >
                                                    {u.suspended ? "Unsuspend" : "Suspend"}
                                                </button>
                                            )}
                                            {u.role !== "admin" && (
                                                <button
                                                    className="admin-btn admin-btn-delete"
                                                    onClick={() => remove(u._id)}
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </div>
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
