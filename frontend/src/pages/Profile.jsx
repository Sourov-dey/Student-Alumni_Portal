// frontend/src/pages/Profile.jsx — LinkedIn-style Profile
import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    useMapEvents,
    useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import http from "../api/http";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import {
    User,
    Mail,
    Calendar,
    MapPin,
    Phone,
    GraduationCap,
    Briefcase,
    FileText,
    Pencil,
    X,
    Save,
    Info,
    Navigation,
    Shield,
    Award,
    Star,
    Lightbulb,
    FolderKanban,
    Plus,
    Trash2,
} from "lucide-react";
import "../styles/pages/profile.css";

// Fix Leaflet default marker icons (Vite bundling issue)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const myIcon = new L.Icon({
    iconUrl:
        "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
    shadowUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

function MapClickHandler({ onMapClick }) {
    useMapEvents({ click(e) { onMapClick(e.latlng); } });
    return null;
}

// Fly the map to a new position when lat/lng change
function FlyToLocation({ lat, lng }) {
    const map = useMap();
    useEffect(() => {
        if (lat && lng) {
            map.flyTo([parseFloat(lat), parseFloat(lng)], 13, { duration: 1.2 });
        }
    }, [lat, lng, map]);
    return null;
}

// ─── Helper: format date ───
function fmtDate(d) {
    if (!d) return null;
    const dt = new Date(d);
    if (isNaN(dt)) return null;
    return dt.toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

function toInputDate(d) {
    if (!d) return "";
    const dt = new Date(d);
    if (isNaN(dt)) return "";
    return dt.toISOString().split("T")[0];
}

// ─── Gender display map ───
const GENDER_LABELS = {
    male: "Male",
    female: "Female",
    other: "Other",
    "prefer-not-to-say": "Prefer not to say",
};

// ═══════════════════════════════════════════════════
// Main Page
// ═══════════════════════════════════════════════════
export default function Profile() {
    const { user, setUser } = useAuth();

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    // Editable form state
    const [form, setForm] = useState({});

    // Map coordinates for address picker
    const [lat, setLat] = useState("");
    const [lng, setLng] = useState("");

    // ── Fetch profile ──
    useEffect(() => {
        if (!user?._id) { setLoading(false); return; }
        const load = async () => {
            try {
                const res = await http.get(`/api/users/${user._id}`);
                setProfile(res.data);
            } catch (err) {
                console.error("Failed to load profile", err);
                toast.error("Failed to load profile");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [user?._id]);

    // ── Populate form when entering edit mode ──
    useEffect(() => {
        if (editing && profile) {
            setForm({
                name: profile.name || "",
                gender: profile.gender || "",
                dateOfBirth: toInputDate(profile.dateOfBirth),
                phone: profile.phone || "",
                department: profile.department || "",
                graduationYear: profile.graduationYear || "",
                bio: profile.bio || "",
                skills: (profile.skills || []).join(", "),
                technicalSkills: (profile.technicalSkills || []).join(", "),
                nonTechnicalSkills: (profile.nonTechnicalSkills || []).join(", "),
                projects: (profile.projects || []).map(p => ({ ...p })),
                certifications: (profile.certifications || []).map(c => ({ ...c })),
                interests: (profile.interests || []).join(", "),
                city: profile.location?.city || "",
                country: profile.location?.country || "",
            });
            setLat(profile.location?.coordinates?.lat ?? "");
            setLng(profile.location?.coordinates?.lng ?? "");
        }
    }, [editing, profile]);

    // ── Handlers ──
    const handleChange = (e) =>
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

    // ── Dynamic list handlers for projects ──
    const addProject = () =>
        setForm((prev) => ({
            ...prev,
            projects: [...(prev.projects || []), { title: "", description: "", link: "" }],
        }));
    const removeProject = (idx) =>
        setForm((prev) => ({
            ...prev,
            projects: prev.projects.filter((_, i) => i !== idx),
        }));
    const updateProject = (idx, field, value) =>
        setForm((prev) => ({
            ...prev,
            projects: prev.projects.map((p, i) =>
                i === idx ? { ...p, [field]: value } : p
            ),
        }));

    // ── Dynamic list handlers for certifications ──
    const addCertification = () =>
        setForm((prev) => ({
            ...prev,
            certifications: [...(prev.certifications || []), { title: "", issuer: "", year: "" }],
        }));
    const removeCertification = (idx) =>
        setForm((prev) => ({
            ...prev,
            certifications: prev.certifications.filter((_, i) => i !== idx),
        }));
    const updateCertification = (idx, field, value) =>
        setForm((prev) => ({
            ...prev,
            certifications: prev.certifications.map((c, i) =>
                i === idx ? { ...c, [field]: value } : c
            ),
        }));

    const handleMapClick = useCallback((latlng) => {
        const newLat = latlng.lat.toFixed(6);
        const newLng = latlng.lng.toFixed(6);
        setLat(newLat);
        setLng(newLng);

        // Reverse geocode to auto-fill city & country
        fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${newLat}&lon=${newLng}&format=json&accept-language=en`,
            { headers: { "User-Agent": "StudentAlumniPortal/1.0" } }
        )
            .then((r) => r.json())
            .then((data) => {
                const addr = data.address || {};
                const city =
                    addr.city ||
                    addr.town ||
                    addr.village ||
                    addr.county ||
                    addr.state_district ||
                    "";
                const country = addr.country || "";
                setForm((prev) => ({ ...prev, city, country }));
            })
            .catch(() => {
                /* silently ignore geocoding errors */
            });
    }, []);

    const handleGeolocate = () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation not supported");
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setLat(pos.coords.latitude.toFixed(6));
                setLng(pos.coords.longitude.toFixed(6));
                toast.success("Location detected!");
            },
            (err) => toast.error("Could not get location: " + err.message)
        );
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const splitCSV = (str) =>
                str ? str.split(",").map((s) => s.trim()).filter(Boolean) : undefined;

            const payload = {
                name: form.name.trim() || undefined,
                gender: form.gender || undefined,
                dateOfBirth: form.dateOfBirth || undefined,
                phone: form.phone.trim() || undefined,
                department: form.department.trim() || undefined,
                bio: form.bio.trim() || undefined,
                skills: splitCSV(form.skills),
                technicalSkills: splitCSV(form.technicalSkills),
                nonTechnicalSkills: splitCSV(form.nonTechnicalSkills),
                interests: splitCSV(form.interests),
                projects: (form.projects || []).filter((p) => p.title?.trim()),
                certifications: (form.certifications || [])
                    .filter((c) => c.title?.trim())
                    .map((c) => ({
                        ...c,
                        year: c.year ? parseInt(c.year, 10) : undefined,
                    })),
            };

            if (form.graduationYear) {
                payload.graduationYear = parseInt(form.graduationYear, 10);
            }

            // Location
            if (form.city || form.country || (lat && lng)) {
                payload.location = {
                    city: form.city.trim() || undefined,
                    country: form.country.trim() || undefined,
                };
                if (lat && lng) {
                    payload.location.coordinates = {
                        lat: parseFloat(lat),
                        lng: parseFloat(lng),
                    };
                }
            }

            const res = await http.patch(`/api/users/${user._id}`, payload);
            const updatedUser = res.data;

            // Refresh profile
            setProfile(updatedUser);
            setUser(updatedUser);
            localStorage.setItem("au_user", JSON.stringify(updatedUser));

            setEditing(false);
            toast.success("Profile updated!");
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => setEditing(false);

    // ── Not logged in ──
    if (!user) {
        return (
            <div className="profile-page">
                <div className="profile-banner" />
                <div className="profile-login-prompt">
                    <h2>Sign in to view your profile</h2>
                    <p>Create an account or log in to access your personal profile page.</p>
                    <Link to="/login">Go to Login →</Link>
                </div>
            </div>
        );
    }

    // ── Loading ──
    if (loading) {
        return (
            <div className="profile-page">
                <div className="profile-banner" />
                <div className="profile-loading">
                    <div className="spinner" />
                    <span>Loading profile…</span>
                </div>
            </div>
        );
    }

    const p = profile || user;
    const hasLocation = !!(p.location?.coordinates?.lat && p.location?.coordinates?.lng);

    return (
        <div className="profile-page">
            {/* Banner */}
            <div className="profile-banner" />

            {/* Header card */}
            <div className="profile-header">
                <div className="profile-header-card">
                    {/* Avatar */}
                    <div className="profile-avatar-wrapper">
                        <img
                            className="profile-avatar"
                            src={
                                p.avatarUrl && p.avatarUrl !== "/avatar.png"
                                    ? `http://localhost:5000${p.avatarUrl}`
                                    : `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&size=120&background=6366f1&color=fff&bold=true`
                            }
                            alt={p.name}
                            onError={(e) => {
                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&size=120&background=6366f1&color=fff&bold=true`;
                            }}
                        />
                        <span className={`profile-role-badge ${p.role}`}>{p.role}</span>
                    </div>

                    {/* Name area */}
                    <div className="profile-name-area">
                        <h1 className="profile-name">
                            {p.name}
                            {p.verified && (
                                <span className="verified-badge">
                                    <Shield size={13} /> Verified
                                </span>
                            )}
                        </h1>
                        <p className="profile-email">{p.email}</p>
                        {p.bio && <p className="profile-bio">{p.bio}</p>}
                    </div>

                    {/* Edit toggle */}
                    <button
                        className={`profile-edit-btn ${editing ? "active" : ""}`}
                        onClick={() => (editing ? handleCancel() : setEditing(true))}
                    >
                        {editing ? (
                            <>
                                <X size={15} /> Cancel
                            </>
                        ) : (
                            <>
                                <Pencil size={15} /> Edit Profile
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Content Grid */}
            <div className="profile-content">
                {/* ── Personal Info ── */}
                <div className="profile-section">
                    <h3 className="section-title">
                        <User size={18} /> Personal Info
                    </h3>

                    {/* Name */}
                    <div className="info-row">
                        <span className="info-label">Name</span>
                        {editing ? (
                            <input
                                className="profile-input"
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                placeholder="Full name"
                            />
                        ) : (
                            <span className="info-value">{p.name}</span>
                        )}
                    </div>

                    {/* Gender */}
                    <div className="info-row">
                        <span className="info-label">Gender</span>
                        {editing ? (
                            <select
                                className="profile-select"
                                name="gender"
                                value={form.gender}
                                onChange={handleChange}
                            >
                                <option value="">Select gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                                <option value="prefer-not-to-say">Prefer not to say</option>
                            </select>
                        ) : (
                            <span className={`info-value ${p.gender ? "" : "muted"}`}>
                                {GENDER_LABELS[p.gender] || "Not specified"}
                            </span>
                        )}
                    </div>

                    {/* Date of Birth */}
                    <div className="info-row">
                        <span className="info-label">Date of Birth</span>
                        {editing ? (
                            <input
                                className="profile-input"
                                type="date"
                                name="dateOfBirth"
                                value={form.dateOfBirth}
                                onChange={handleChange}
                            />
                        ) : (
                            <span className={`info-value ${p.dateOfBirth ? "" : "muted"}`}>
                                {fmtDate(p.dateOfBirth) || "Not specified"}
                            </span>
                        )}
                    </div>

                    {/* Phone */}
                    <div className="info-row">
                        <span className="info-label">Phone</span>
                        {editing ? (
                            <input
                                className="profile-input"
                                name="phone"
                                value={form.phone}
                                onChange={handleChange}
                                placeholder="e.g. +91 98765 43210"
                            />
                        ) : (
                            <span className={`info-value ${p.phone ? "" : "muted"}`}>
                                {p.phone || "Not specified"}
                            </span>
                        )}
                    </div>
                </div>

                {/* ── Academic / Professional ── */}
                <div className="profile-section">
                    <h3 className="section-title">
                        <GraduationCap size={18} /> Academic Info
                    </h3>

                    {/* Department */}
                    <div className="info-row">
                        <span className="info-label">Department</span>
                        {editing ? (
                            <input
                                className="profile-input"
                                name="department"
                                value={form.department}
                                onChange={handleChange}
                                placeholder="e.g. Computer Science"
                            />
                        ) : (
                            <span className={`info-value ${p.department ? "" : "muted"}`}>
                                {p.department || "Not specified"}
                            </span>
                        )}
                    </div>

                    {/* Graduation Year */}
                    <div className="info-row">
                        <span className="info-label">Graduation</span>
                        {editing ? (
                            <input
                                className="profile-input"
                                type="number"
                                name="graduationYear"
                                value={form.graduationYear}
                                onChange={handleChange}
                                placeholder="e.g. 2024"
                                min={1950}
                                max={2100}
                            />
                        ) : (
                            <span className={`info-value ${p.graduationYear ? "" : "muted"}`}>
                                {p.graduationYear ? `Class of ${p.graduationYear}` : "Not specified"}
                            </span>
                        )}
                    </div>

                    {/* Bio */}
                    <div className="info-row" style={{ flexDirection: "column", gap: 6 }}>
                        <span className="info-label">Bio</span>
                        {editing ? (
                            <textarea
                                className="profile-textarea"
                                name="bio"
                                value={form.bio}
                                onChange={handleChange}
                                placeholder="Tell us about yourself…"
                                maxLength={500}
                            />
                        ) : (
                            <span className={`info-value ${p.bio ? "" : "muted"}`}>
                                {p.bio || "No bio yet"}
                            </span>
                        )}
                    </div>

                    {/* Skills */}
                    <div className="info-row" style={{ flexDirection: "column", gap: 6 }}>
                        <span className="info-label">Skills</span>
                        {editing ? (
                            <input
                                className="profile-input"
                                name="skills"
                                value={form.skills}
                                onChange={handleChange}
                                placeholder="React, Node.js, Python (comma-separated)"
                            />
                        ) : p.skills && p.skills.length > 0 ? (
                            <div className="skills-list">
                                {p.skills.map((s, i) => (
                                    <span key={i} className="skill-chip">{s}</span>
                                ))}
                            </div>
                        ) : (
                            <span className="info-value muted">No skills added</span>
                        )}
                    </div>
                </div>

                {/* ── Student Portfolio: Technical Skills, Non-Technical Skills, Interests ── */}
                {p.role === 'student' && (
                    <div className="profile-section">
                        <h3 className="section-title">
                            <Star size={18} /> Skills & Interests
                        </h3>

                        {/* Technical Skills */}
                        <div className="info-row" style={{ flexDirection: "column", gap: 6 }}>
                            <span className="info-label">Technical Skills</span>
                            {editing ? (
                                <input
                                    className="profile-input"
                                    name="technicalSkills"
                                    value={form.technicalSkills}
                                    onChange={handleChange}
                                    placeholder="React, Python, SQL (comma-separated)"
                                />
                            ) : p.technicalSkills && p.technicalSkills.length > 0 ? (
                                <div className="skills-list">
                                    {p.technicalSkills.map((s, i) => (
                                        <span key={i} className="skill-chip tech">{s}</span>
                                    ))}
                                </div>
                            ) : (
                                <span className="info-value muted">No technical skills added</span>
                            )}
                        </div>

                        {/* Non-Technical Skills */}
                        <div className="info-row" style={{ flexDirection: "column", gap: 6 }}>
                            <span className="info-label">Non-Technical Skills</span>
                            {editing ? (
                                <input
                                    className="profile-input"
                                    name="nonTechnicalSkills"
                                    value={form.nonTechnicalSkills}
                                    onChange={handleChange}
                                    placeholder="Communication, Leadership, Teamwork (comma-separated)"
                                />
                            ) : p.nonTechnicalSkills && p.nonTechnicalSkills.length > 0 ? (
                                <div className="skills-list">
                                    {p.nonTechnicalSkills.map((s, i) => (
                                        <span key={i} className="skill-chip soft">{s}</span>
                                    ))}
                                </div>
                            ) : (
                                <span className="info-value muted">No non-technical skills added</span>
                            )}
                        </div>

                        {/* Interests */}
                        <div className="info-row" style={{ flexDirection: "column", gap: 6 }}>
                            <span className="info-label">Areas of Interest</span>
                            {editing ? (
                                <input
                                    className="profile-input"
                                    name="interests"
                                    value={form.interests}
                                    onChange={handleChange}
                                    placeholder="Web Dev, Machine Learning, Design (comma-separated)"
                                />
                            ) : p.interests && p.interests.length > 0 ? (
                                <div className="skills-list">
                                    {p.interests.map((s, i) => (
                                        <span key={i} className="skill-chip interest">{s}</span>
                                    ))}
                                </div>
                            ) : (
                                <span className="info-value muted">No interests added</span>
                            )}
                        </div>
                    </div>
                )}

                {/* ── Student Portfolio: Projects ── */}
                {p.role === 'student' && (
                    <div className="profile-section">
                        <h3 className="section-title">
                            <FolderKanban size={18} /> Projects
                        </h3>

                        {editing ? (
                            <div className="dynamic-list">
                                {(form.projects || []).map((proj, idx) => (
                                    <div key={idx} className="dynamic-item project-item">
                                        <div className="dynamic-item-fields">
                                            <input
                                                className="profile-input"
                                                value={proj.title}
                                                onChange={(e) => updateProject(idx, "title", e.target.value)}
                                                placeholder="Project title *"
                                            />
                                            <input
                                                className="profile-input"
                                                value={proj.description || ""}
                                                onChange={(e) => updateProject(idx, "description", e.target.value)}
                                                placeholder="Short description"
                                            />
                                            <input
                                                className="profile-input"
                                                value={proj.link || ""}
                                                onChange={(e) => updateProject(idx, "link", e.target.value)}
                                                placeholder="Link (e.g. https://github.com/…)"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            className="btn-remove"
                                            onClick={() => removeProject(idx)}
                                            title="Remove project"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                ))}
                                <button type="button" className="btn-add" onClick={addProject}>
                                    <Plus size={15} /> Add Project
                                </button>
                            </div>
                        ) : p.projects && p.projects.length > 0 ? (
                            <div className="project-cards">
                                {p.projects.map((proj, i) => (
                                    <div key={i} className="project-card">
                                        <h4 className="project-card-title">{proj.title}</h4>
                                        {proj.description && (
                                            <p className="project-card-desc">{proj.description}</p>
                                        )}
                                        {proj.link && (
                                            <a
                                                className="project-card-link"
                                                href={proj.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                View Project →
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <span className="info-value muted">No projects added</span>
                        )}
                    </div>
                )}

                {/* ── Student Portfolio: Certifications ── */}
                {p.role === 'student' && (
                    <div className="profile-section full-width">
                        <h3 className="section-title">
                            <Award size={18} /> Certifications
                        </h3>

                        {editing ? (
                            <div className="dynamic-list">
                                {(form.certifications || []).map((cert, idx) => (
                                    <div key={idx} className="dynamic-item cert-item">
                                        <div className="dynamic-item-fields cert-fields">
                                            <input
                                                className="profile-input"
                                                value={cert.title}
                                                onChange={(e) => updateCertification(idx, "title", e.target.value)}
                                                placeholder="Certification name *"
                                            />
                                            <input
                                                className="profile-input"
                                                value={cert.issuer || ""}
                                                onChange={(e) => updateCertification(idx, "issuer", e.target.value)}
                                                placeholder="Issuing organization"
                                            />
                                            <input
                                                className="profile-input"
                                                type="number"
                                                value={cert.year || ""}
                                                onChange={(e) => updateCertification(idx, "year", e.target.value)}
                                                placeholder="Year"
                                                min={1950}
                                                max={2100}
                                                style={{ maxWidth: 100 }}
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            className="btn-remove"
                                            onClick={() => removeCertification(idx)}
                                            title="Remove certification"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                ))}
                                <button type="button" className="btn-add" onClick={addCertification}>
                                    <Plus size={15} /> Add Certification
                                </button>
                            </div>
                        ) : p.certifications && p.certifications.length > 0 ? (
                            <div className="cert-list">
                                {p.certifications.map((cert, i) => (
                                    <div key={i} className="cert-row">
                                        <Award size={16} className="cert-icon" />
                                        <div className="cert-info">
                                            <span className="cert-title">{cert.title}</span>
                                            {cert.issuer && (
                                                <span className="cert-issuer">{cert.issuer}</span>
                                            )}
                                        </div>
                                        {cert.year && (
                                            <span className="cert-year">{cert.year}</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <span className="info-value muted">No certifications added</span>
                        )}
                    </div>
                )}

                {/* ── Address / Location ── */}
                {p.role === 'alumni' && (
                    <div className="profile-section full-width">
                        <h3 className="section-title">
                            <MapPin size={18} /> Address & Location
                        </h3>

                        {editing ? (
                            <>
                                <div className="location-inputs">
                                    <div className="location-input-group">
                                        <label>City</label>
                                        <input
                                            className="profile-input"
                                            name="city"
                                            value={form.city}
                                            onChange={handleChange}
                                            placeholder="e.g. Silchar"
                                        />
                                    </div>
                                    <div className="location-input-group">
                                        <label>Country</label>
                                        <input
                                            className="profile-input"
                                            name="country"
                                            value={form.country}
                                            onChange={handleChange}
                                            placeholder="e.g. India"
                                        />
                                    </div>
                                </div>

                                {user?.role === 'admin' && (
                                    <>
                                        <div className="profile-map-container">
                                            <MapContainer
                                                center={[
                                                    lat ? parseFloat(lat) : 20.5937,
                                                    lng ? parseFloat(lng) : 78.9629,
                                                ]}
                                                zoom={lat && lng ? 13 : 5}
                                                scrollWheelZoom={true}
                                                style={{ height: "100%", width: "100%" }}
                                            >
                                                <TileLayer
                                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
                                                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                                                />
                                                <FlyToLocation lat={lat} lng={lng} />
                                                <MapClickHandler onMapClick={handleMapClick} />
                                                {lat && lng && (
                                                    <Marker
                                                        position={[parseFloat(lat), parseFloat(lng)]}
                                                        icon={myIcon}
                                                    >
                                                        <Popup>📍 Your selected location</Popup>
                                                    </Marker>
                                                )}
                                            </MapContainer>
                                        </div>

                                        <div className="map-hint">
                                            <Info size={14} />
                                            <span>Click anywhere on the map to pick your address, or use geolocation below.</span>
                                        </div>

                                        <div style={{ marginTop: 10 }}>
                                            <button
                                                className="btn-cancel"
                                                onClick={handleGeolocate}
                                                style={{ gap: 6 }}
                                            >
                                                <Navigation size={14} /> Use My Current Location
                                            </button>
                                        </div>

                                        {lat && lng && (
                                            <div style={{ marginTop: 8, fontSize: 12, color: "#94a3b8" }}>
                                                📍 {parseFloat(lat).toFixed(4)}, {parseFloat(lng).toFixed(4)}
                                            </div>
                                        )}
                                    </>
                                )}
                            </>
                        ) : (
                            <>
                                {/* View mode */}
                                <div className="info-row">
                                    <span className="info-label">City</span>
                                    <span className={`info-value ${p.location?.city ? "" : "muted"}`}>
                                        {p.location?.city || "Not specified"}
                                    </span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Country</span>
                                    <span className={`info-value ${p.location?.country ? "" : "muted"}`}>
                                        {p.location?.country || "Not specified"}
                                    </span>
                                </div>

                                {hasLocation && user?.role === 'admin' && (
                                    <div className="profile-map-container">
                                        <MapContainer
                                            center={[
                                                p.location.coordinates.lat,
                                                p.location.coordinates.lng,
                                            ]}
                                            zoom={13}
                                            scrollWheelZoom={false}
                                            dragging={false}
                                            zoomControl={false}
                                            style={{ height: "100%", width: "100%" }}
                                        >
                                            <TileLayer
                                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
                                                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                                            />
                                            <Marker
                                                position={[
                                                    p.location.coordinates.lat,
                                                    p.location.coordinates.lng,
                                                ]}
                                                icon={myIcon}
                                            >
                                                <Popup>
                                                    📍 {p.location.city}
                                                    {p.location.country ? `, ${p.location.country}` : ""}
                                                </Popup>
                                            </Marker>
                                        </MapContainer>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* ── Save / Cancel buttons ── */}
                {editing && (
                    <div className="profile-actions">
                        <button className="btn-cancel" onClick={handleCancel}>
                            <X size={15} /> Cancel
                        </button>
                        <button
                            className="btn-save"
                            onClick={handleSave}
                            disabled={saving}
                        >
                            {saving ? (
                                <>
                                    <div className="spinner" style={{ width: 14, height: 14 }} />
                                    Saving…
                                </>
                            ) : (
                                <>
                                    <Save size={15} /> Save Changes
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
