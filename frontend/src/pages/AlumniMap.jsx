// frontend/src/pages/AlumniMap.jsx — Alumni Location Map
import React, { useEffect, useState, useCallback } from "react";
import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import http from "../api/http";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { MapPin, Navigation, Trash2, Info } from "lucide-react";
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

// Custom purple icon for alumni pins
const alumniIcon = new L.Icon({
    iconUrl:
        "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-violet.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

// Green icon for "your" pin
const myIcon = new L.Icon({
    iconUrl:
        "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

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
// Main Page
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

    const isAlumni = user?.role === "alumni";
    const hasExistingLocation = !!(
        user?.location?.coordinates?.lat && user?.location?.coordinates?.lng
    );

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

            // Reverse geocode to auto-fill city & country
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
                .catch(() => {
                    /* silently ignore geocoding errors */
                });
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

            // update local auth context
            setUser(updatedUser);
            localStorage.setItem("au_user", JSON.stringify(updatedUser));

            // refresh the pin list
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

            // Clear location by setting to empty values, then unset via separate call
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

    // ——— Loading state ———
    if (loading) {
        return (
            <div className="alumni-map-page">
                <div className="map-loading">
                    <div className="spinner" />
                    <span>Loading alumni map…</span>
                </div>
            </div>
        );
    }

    return (
        <div className="alumni-map-page">
            {/* Header */}
            <div className="alumni-map-header">
                <h1>🌍 Alumni Map</h1>
                <p>See where our alumni are making an impact around the world</p>
            </div>

            <div className="alumni-map-content">
                {/* Map */}
                <div className="map-wrapper">
                    {/* Stats overlay */}
                    <div className="map-stats-bar">
                        <div className="stat-item">
                            <MapPin size={14} />
                            <span className="stat-value">{alumni.length}</span> alumni on map
                        </div>
                    </div>

                    <MapContainer
                        center={[20.5937, 78.9629]} // India center
                        zoom={5}
                        scrollWheelZoom={true}
                        style={{ height: "600px", width: "100%" }}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        {/* Click handler for alumni location picking */}
                        {isAlumni && <MapClickHandler onMapClick={handleMapClick} />}

                        {/* Alumni markers */}
                        {alumni.map((a) => {
                            const isMe = a._id === user?._id;
                            return (
                                <Marker
                                    key={a._id}
                                    position={[a.location.coordinates.lat, a.location.coordinates.lng]}
                                    icon={isMe ? myIcon : alumniIcon}
                                >
                                    <Popup>
                                        <div className="alumni-popup">
                                            <div className="popup-name">
                                                {a.name} {isMe && "⭐ (You)"}
                                            </div>
                                            {a.department && (
                                                <div className="popup-detail">🎓 {a.department}</div>
                                            )}
                                            {a.graduationYear && (
                                                <div className="popup-detail">
                                                    📅 Class of {a.graduationYear}
                                                </div>
                                            )}
                                            {a.location.city && (
                                                <div className="popup-detail">
                                                    📍 {a.location.city}
                                                    {a.location.country ? `, ${a.location.country}` : ""}
                                                </div>
                                            )}
                                        </div>
                                    </Popup>
                                </Marker>
                            );
                        })}

                        {/* Preview marker when alumni picks a location */}
                        {isAlumni && lat && lng && (
                            <Marker position={[parseFloat(lat), parseFloat(lng)]} icon={myIcon}>
                                <Popup>📍 Your selected location</Popup>
                            </Marker>
                        )}
                    </MapContainer>
                </div>

                {/* Set Location Panel — alumni only */}
                {isAlumni && (
                    <div className="set-location-panel">
                        <h3>
                            <MapPin size={18} /> Set Your Location
                        </h3>

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
    );
}
