// frontend/src/pages/AlumniMap.jsx — Alumni Location Map (Redesigned)
import React, { useEffect, useState, useCallback, useMemo } from "react";
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
    MapPin, Navigation, Trash2, Info, Users, Mail, Phone,
    GraduationCap, Briefcase, ChevronDown, ChevronUp, X, Globe2
} from "lucide-react";
import "../styles/pages/alumniMap.css";

// ═══════════════════════════════════════════════════
// Fix Leaflet default marker icons (Vite bundling issue)
// ═══════════════════════════════════════════════════
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ═══════════════════════════════════════════════════
// Custom DivIcon builder for cluster & single markers
// ═══════════════════════════════════════════════════
function createClusterIcon(count, isMyCluster) {
    const color = isMyCluster ? "#22c55e" : "#6366f1";
    const shadowColor = isMyCluster
        ? "rgba(34,197,94,0.4)"
        : "rgba(99,102,241,0.4)";
    return L.divIcon({
        className: "custom-cluster-icon",
        html: `
            <div class="cluster-marker ${isMyCluster ? "my-cluster" : ""}" style="--cluster-color:${color};--cluster-shadow:${shadowColor}">
                <span class="cluster-count">${count}</span>
                <span class="cluster-pulse"></span>
            </div>`,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
        popupAnchor: [0, -24],
    });
}

function createSingleIcon(isMe) {
    const color = isMe ? "#22c55e" : "#a78bfa";
    const shadow = isMe
        ? "rgba(34,197,94,0.45)"
        : "rgba(167,139,250,0.45)";
    return L.divIcon({
        className: "custom-single-icon",
        html: `
            <div class="single-marker ${isMe ? "my-marker" : ""}" style="--pin-color:${color};--pin-shadow:${shadow}">
                <div class="pin-dot"></div>
                <div class="pin-ring"></div>
            </div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
        popupAnchor: [0, -14],
    });
}

// Preview marker while picking
const previewIcon = L.divIcon({
    className: "custom-preview-icon",
    html: `<div class="preview-marker"><div class="preview-dot"></div><div class="preview-ring"></div></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -16],
});

// ═══════════════════════════════════════════════════
// Group nearby alumni (within ~0.01° ≈ 1 km)
// ═══════════════════════════════════════════════════
const CLUSTER_RADIUS = 0.015; // degrees

function groupAlumni(alumni) {
    const clusters = [];
    const used = new Set();

    for (let i = 0; i < alumni.length; i++) {
        if (used.has(i)) continue;
        const group = [alumni[i]];
        used.add(i);

        for (let j = i + 1; j < alumni.length; j++) {
            if (used.has(j)) continue;
            const dLat = Math.abs(
                alumni[i].location.coordinates.lat - alumni[j].location.coordinates.lat
            );
            const dLng = Math.abs(
                alumni[i].location.coordinates.lng - alumni[j].location.coordinates.lng
            );
            if (dLat < CLUSTER_RADIUS && dLng < CLUSTER_RADIUS) {
                group.push(alumni[j]);
                used.add(j);
            }
        }
        // Compute cluster center as average
        const cLat =
            group.reduce((s, a) => s + a.location.coordinates.lat, 0) / group.length;
        const cLng =
            group.reduce((s, a) => s + a.location.coordinates.lng, 0) / group.length;
        clusters.push({ members: group, center: [cLat, cLng] });
    }
    return clusters;
}

// ═══════════════════════════════════════════════════
// Sub-component: captures map clicks for location picking
// ═══════════════════════════════════════════════════
function MapClickHandler({ onMapClick }) {
    useMapEvents({
        click(e) {
            onMapClick(e.latlng);
        },
    });
    return null;
}

// ═══════════════════════════════════════════════════
// Fly to location helper
// ═══════════════════════════════════════════════════
function FlyToLocation({ center, zoom }) {
    const map = useMap();
    useEffect(() => {
        if (center) map.flyTo(center, zoom || 10, { duration: 1.2 });
    }, [center, zoom, map]);
    return null;
}

// ═══════════════════════════════════════════════════
// Alumni Card Component (inside popups / sidebar)
// ═══════════════════════════════════════════════════
function AlumniCard({ alumni, isMe, expanded, onToggle }) {
    const avatarSrc =
        alumni.avatarUrl && alumni.avatarUrl !== "/avatar.png"
            ? alumni.avatarUrl
            : null;

    return (
        <div className={`alumni-card ${isMe ? "alumni-card--me" : ""} ${expanded ? "alumni-card--expanded" : ""}`}>
            <div className="alumni-card-header" onClick={onToggle}>
                <div className="alumni-card-avatar">
                    {avatarSrc ? (
                        <img src={avatarSrc} alt={alumni.name} />
                    ) : (
                        <div className="alumni-card-avatar-fallback">
                            {alumni.name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                    )}
                    {isMe && <span className="me-badge">You</span>}
                </div>
                <div className="alumni-card-info">
                    <span className="alumni-card-name">{alumni.name}</span>
                    {alumni.department && (
                        <span className="alumni-card-dept">
                            {alumni.department}
                            {alumni.graduationYear ? ` · ${alumni.graduationYear}` : ""}
                        </span>
                    )}
                </div>
                <span className="alumni-card-toggle">
                    {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </span>
            </div>

            {expanded && (
                <div className="alumni-card-details">
                    {alumni.location?.city && (
                        <div className="detail-row">
                            <MapPin size={14} />
                            <span>
                                {alumni.location.city}
                                {alumni.location.country ? `, ${alumni.location.country}` : ""}
                            </span>
                        </div>
                    )}
                    {alumni.email && (
                        <a href={`mailto:${alumni.email}`} className="detail-row detail-link">
                            <Mail size={14} />
                            <span>{alumni.email}</span>
                        </a>
                    )}
                    {alumni.phone && (
                        <a href={`tel:${alumni.phone}`} className="detail-row detail-link">
                            <Phone size={14} />
                            <span>{alumni.phone}</span>
                        </a>
                    )}
                    {alumni.bio && (
                        <div className="detail-row detail-bio">
                            <Info size={14} />
                            <span>{alumni.bio}</span>
                        </div>
                    )}
                    {alumni.skills?.length > 0 && (
                        <div className="detail-skills">
                            {alumni.skills.map((s, i) => (
                                <span key={i} className="skill-tag">{s}</span>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════
export default function AlumniMap() {
    const { user, setUser } = useAuth();
    const [alumni, setAlumni] = useState([]);
    const [loading, setLoading] = useState(true);

    // form state for setting location
    const [city, setCity] = useState(user?.location?.city || "");
    const [country, setCountry] = useState(user?.location?.country || "");
    const [lat, setLat] = useState(user?.location?.coordinates?.lat ?? "");
    const [lng, setLng] = useState(user?.location?.coordinates?.lng ?? "");
    const [saving, setSaving] = useState(false);

    // sidebar state for selected cluster
    const [selectedCluster, setSelectedCluster] = useState(null);
    const [expandedCards, setExpandedCards] = useState({});
    const [flyTarget, setFlyTarget] = useState(null);

    const isAlumni = user?.role === "alumni";
    const hasExistingLocation = !!(
        user?.location?.coordinates?.lat && user?.location?.coordinates?.lng
    );

    // Compute clusters
    const clusters = useMemo(() => groupAlumni(alumni), [alumni]);

    // Unique cities/countries for stats
    const uniqueCities = useMemo(() => {
        const s = new Set();
        alumni.forEach((a) => {
            if (a.location?.city) s.add(a.location.city);
        });
        return s.size;
    }, [alumni]);

    const uniqueCountries = useMemo(() => {
        const s = new Set();
        alumni.forEach((a) => {
            if (a.location?.country) s.add(a.location.country);
        });
        return s.size;
    }, [alumni]);

    // ——— Fetch alumni locations ———
    useEffect(() => {
        const fetchLocations = async () => {
            try {
                const res = await http.get("/api/users/alumni-locations");
                setAlumni(res.data);
            } catch (err) {
                console.error("Failed to load alumni locations", err);
            } finally {
                setLoading(false);
            }
        };
        fetchLocations();
    }, []);

    // ——— Handle map click (alumni only) ———
    const handleMapClick = useCallback(
        (latlng) => {
            if (!isAlumni) return;
            const newLat = latlng.lat.toFixed(6);
            const newLng = latlng.lng.toFixed(6);
            setLat(newLat);
            setLng(newLng);

            fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${newLat}&lon=${newLng}&format=json&accept-language=en`,
                { headers: { "User-Agent": "StudentAlumniPortal/1.0" } }
            )
                .then((r) => r.json())
                .then((data) => {
                    const addr = data.address || {};
                    const resolvedCity =
                        addr.city ||
                        addr.town ||
                        addr.village ||
                        addr.county ||
                        addr.state_district ||
                        "";
                    const resolvedCountry = addr.country || "";
                    setCity(resolvedCity);
                    setCountry(resolvedCountry);
                })
                .catch(() => { });
        },
        [isAlumni]
    );

    // ——— Use browser geolocation ———
    const handleGeolocate = () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation not supported by your browser");
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setLat(pos.coords.latitude.toFixed(6));
                setLng(pos.coords.longitude.toFixed(6));
                toast.success("Location detected!");
            },
            (err) => {
                toast.error("Could not get your location: " + err.message);
            }
        );
    };

    // ——— Save location ———
    const handleSave = async () => {
        if (!lat || !lng) {
            toast.error("Please set coordinates by clicking the map or using geolocation");
            return;
        }
        setSaving(true);
        try {
            const payload = {
                location: {
                    city: city.trim() || undefined,
                    country: country.trim() || undefined,
                    coordinates: {
                        lat: parseFloat(lat),
                        lng: parseFloat(lng),
                    },
                },
            };

            const res = await http.patch(`/api/users/${user._id}`, payload);
            const updatedUser = res.data;

            setUser(updatedUser);
            localStorage.setItem("au_user", JSON.stringify(updatedUser));

            const locRes = await http.get("/api/users/alumni-locations");
            setAlumni(locRes.data);

            toast.success("Location saved!");
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "Failed to save location");
        } finally {
            setSaving(false);
        }
    };

    // ——— Remove location ———
    const handleRemove = async () => {
        setSaving(true);
        try {
            const payload = {
                location: {
                    city: "",
                    country: "",
                    coordinates: { lat: 0, lng: 0 },
                },
            };
            await http.patch(`/api/users/${user._id}`, payload);

            const updatedUser = { ...user, location: undefined };
            setUser(updatedUser);
            localStorage.setItem("au_user", JSON.stringify(updatedUser));

            setCity("");
            setCountry("");
            setLat("");
            setLng("");

            const locRes = await http.get("/api/users/alumni-locations");
            setAlumni(locRes.data);

            toast.success("Location removed");
        } catch (err) {
            toast.error("Failed to remove location");
        } finally {
            setSaving(false);
        }
    };

    // ——— handle cluster click ———
    const handleClusterClick = (cluster) => {
        setSelectedCluster(cluster);
        setExpandedCards({});
        setFlyTarget(cluster.center);
    };

    const toggleCard = (id) => {
        setExpandedCards((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    // ——— Access control ———
    if (user?.role !== "admin" && user?.role !== "alumni") {
        return (
            <div className="alumni-map-page">
                <div className="map-access-denied">
                    <div className="access-denied-icon">🔒</div>
                    <h2>Access Denied</h2>
                    <p>Only alumni and administrators can view the Alumni Map.</p>
                </div>
            </div>
        );
    }

    // ——— Loading state ———
    if (loading) {
        return (
            <div className="alumni-map-page">
                <div className="map-loading">
                    <div className="loading-globe">
                        <Globe2 size={48} className="loading-globe-icon" />
                    </div>
                    <span>Loading alumni map…</span>
                </div>
            </div>
        );
    }

    return (
        <div className="alumni-map-page">
            {/* Header */}
            <div className="alumni-map-header">
                <h1>🌍 Alumni World Map</h1>
                <p>Discover where our alumni community is making an impact across the globe</p>

                {/* Stats chips */}
                <div className="header-stats">
                    <div className="stat-chip">
                        <Users size={15} />
                        <strong>{alumni.length}</strong> alumni on map
                    </div>
                    <div className="stat-chip">
                        <MapPin size={15} />
                        <strong>{uniqueCities}</strong> cities
                    </div>
                    <div className="stat-chip">
                        <Globe2 size={15} />
                        <strong>{uniqueCountries}</strong> countries
                    </div>
                </div>
            </div>

            <div className="alumni-map-content">
                {/* Map */}
                <div className="map-wrapper">
                    <MapContainer
                        center={[20.5937, 78.9629]}
                        zoom={5}
                        scrollWheelZoom={true}
                        className="alumni-leaflet-map"
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        />

                        {flyTarget && <FlyToLocation center={flyTarget} zoom={10} />}

                        {/* Click handler for alumni location picking */}
                        {isAlumni && <MapClickHandler onMapClick={handleMapClick} />}

                        {/* Cluster / single markers */}
                        {clusters.map((cluster, idx) => {
                            const isSingle = cluster.members.length === 1;
                            const containsMe = cluster.members.some(
                                (a) => a._id === user?._id
                            );

                            if (isSingle) {
                                const a = cluster.members[0];
                                const isMe = a._id === user?._id;
                                return (
                                    <Marker
                                        key={a._id}
                                        position={cluster.center}
                                        icon={createSingleIcon(isMe)}
                                        eventHandlers={{
                                            click: () => handleClusterClick(cluster),
                                        }}
                                    >
                                        <Popup className="alumni-popup-container">
                                            <div className="popup-card-single">
                                                <div className="popup-header-mini">
                                                    <div className="popup-avatar-mini">
                                                        {a.avatarUrl && a.avatarUrl !== "/avatar.png" ? (
                                                            <img src={a.avatarUrl} alt="" />
                                                        ) : (
                                                            <span>{a.name?.charAt(0)?.toUpperCase()}</span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="popup-name-mini">
                                                            {a.name} {isMe && <span className="you-tag">You</span>}
                                                        </div>
                                                        {a.department && (
                                                            <div className="popup-dept-mini">
                                                                {a.department}
                                                                {a.graduationYear ? ` · ${a.graduationYear}` : ""}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="popup-details-mini">
                                                    {a.location?.city && (
                                                        <div className="popup-detail-row">
                                                            <MapPin size={12} />
                                                            {a.location.city}
                                                            {a.location.country ? `, ${a.location.country}` : ""}
                                                        </div>
                                                    )}
                                                    {a.email && (
                                                        <a href={`mailto:${a.email}`} className="popup-detail-row popup-link">
                                                            <Mail size={12} /> {a.email}
                                                        </a>
                                                    )}
                                                    {a.phone && (
                                                        <a href={`tel:${a.phone}`} className="popup-detail-row popup-link">
                                                            <Phone size={12} /> {a.phone}
                                                        </a>
                                                    )}
                                                </div>
                                                {a.skills?.length > 0 && (
                                                    <div className="popup-skills-mini">
                                                        {a.skills.slice(0, 4).map((s, i) => (
                                                            <span key={i} className="popup-skill-tag">{s}</span>
                                                        ))}
                                                        {a.skills.length > 4 && (
                                                            <span className="popup-skill-tag popup-skill-more">
                                                                +{a.skills.length - 4}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </Popup>
                                    </Marker>
                                );
                            }

                            // Multi-alumni cluster
                            return (
                                <Marker
                                    key={`cluster-${idx}`}
                                    position={cluster.center}
                                    icon={createClusterIcon(cluster.members.length, containsMe)}
                                    eventHandlers={{
                                        click: () => handleClusterClick(cluster),
                                    }}
                                >
                                    <Popup className="alumni-popup-container">
                                        <div className="popup-card-cluster">
                                            <div className="popup-cluster-header">
                                                <Users size={16} />
                                                <span>
                                                    <strong>{cluster.members.length}</strong> Alumni here
                                                </span>
                                                {cluster.members[0]?.location?.city && (
                                                    <span className="popup-cluster-loc">
                                                        · {cluster.members[0].location.city}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="popup-cluster-list">
                                                {cluster.members.slice(0, 5).map((a) => {
                                                    const isMe = a._id === user?._id;
                                                    return (
                                                        <div key={a._id} className="popup-cluster-item">
                                                            <div className="popup-avatar-mini popup-avatar-xs">
                                                                {a.avatarUrl && a.avatarUrl !== "/avatar.png" ? (
                                                                    <img src={a.avatarUrl} alt="" />
                                                                ) : (
                                                                    <span>{a.name?.charAt(0)?.toUpperCase()}</span>
                                                                )}
                                                            </div>
                                                            <span className="popup-cluster-name">
                                                                {a.name} {isMe && <span className="you-tag">You</span>}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                                {cluster.members.length > 5 && (
                                                    <div className="popup-cluster-more">
                                                        +{cluster.members.length - 5} more
                                                    </div>
                                                )}
                                            </div>
                                            <div className="popup-cluster-hint">
                                                Click to see full details →
                                            </div>
                                        </div>
                                    </Popup>
                                </Marker>
                            );
                        })}

                        {/* Preview marker when alumni picks a location */}
                        {isAlumni && lat && lng && (
                            <Marker position={[parseFloat(lat), parseFloat(lng)]} icon={previewIcon}>
                                <Popup>📍 Your selected location</Popup>
                            </Marker>
                        )}
                    </MapContainer>
                </div>

                {/* Right sidebar */}
                <div className="map-sidebar">
                    {/* Selected cluster alumni list */}
                    {selectedCluster && (
                        <div className="sidebar-panel cluster-panel">
                            <div className="panel-header">
                                <div className="panel-title">
                                    <Users size={18} />
                                    <span>
                                        Alumni
                                        {selectedCluster.members[0]?.location?.city
                                            ? ` in ${selectedCluster.members[0].location.city}`
                                            : " at this location"}
                                    </span>
                                </div>
                                <button
                                    className="panel-close"
                                    onClick={() => setSelectedCluster(null)}
                                >
                                    <X size={16} />
                                </button>
                            </div>
                            <div className="cluster-count-badge">
                                {selectedCluster.members.length} alumni found
                            </div>
                            <div className="alumni-card-list">
                                {selectedCluster.members.map((a) => {
                                    const isMe = a._id === user?._id;
                                    return (
                                        <AlumniCard
                                            key={a._id}
                                            alumni={a}
                                            isMe={isMe}
                                            expanded={!!expandedCards[a._id]}
                                            onToggle={() => toggleCard(a._id)}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Set Location Panel — alumni only */}
                    {isAlumni && (
                        <div className="sidebar-panel location-panel">
                            <div className="panel-header">
                                <div className="panel-title">
                                    <MapPin size={18} />
                                    <span>Set Your Location</span>
                                </div>
                            </div>

                            {hasExistingLocation && (
                                <div className="current-location-badge">
                                    <div className="badge-dot" />
                                    <span className="badge-text">
                                        {user.location.city || "Location"}{" "}
                                        {user.location.country ? `· ${user.location.country}` : ""}
                                    </span>
                                </div>
                            )}

                            <div className="location-form-group">
                                <label>City</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Silchar"
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                />
                            </div>

                            <div className="location-form-group">
                                <label>Country</label>
                                <input
                                    type="text"
                                    placeholder="e.g. India"
                                    value={country}
                                    onChange={(e) => setCountry(e.target.value)}
                                />
                            </div>

                            <div className="location-form-group">
                                <label>Coordinates</label>
                                <div className="location-coords">
                                    <input
                                        type="number"
                                        step="any"
                                        placeholder="Latitude"
                                        value={lat}
                                        onChange={(e) => setLat(e.target.value)}
                                    />
                                    <input
                                        type="number"
                                        step="any"
                                        placeholder="Longitude"
                                        value={lng}
                                        onChange={(e) => setLng(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="location-hint">
                                <Info size={14} />
                                <span>Click anywhere on the map to pick coordinates, or use the button below.</span>
                            </div>

                            <div className="location-actions">
                                <button className="btn-geolocate" onClick={handleGeolocate}>
                                    <Navigation size={16} /> Use My Current Location
                                </button>
                                <button
                                    className="btn-save-location"
                                    onClick={handleSave}
                                    disabled={saving || (!lat && !lng)}
                                >
                                    {saving ? "Saving…" : "Save Location"}
                                </button>
                                {hasExistingLocation && (
                                    <button
                                        className="btn-remove-location"
                                        onClick={handleRemove}
                                        disabled={saving}
                                    >
                                        <Trash2 size={14} /> Remove My Location
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
