import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import {
  MapPin,
  Navigation,
  Fuel,
  Coffee,
  Store,
  Building,
  Car,
  Search,
  Loader,
  Crosshair,
  RefreshCw,
  LocateFixed,
  ExternalLink,
} from "lucide-react";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const CATEGORIES = [
  {
    key: "fuel",
    label: "ปั๊มน้ำมัน",
    icon: Fuel,
    color: "#f97316",
    overpass:
      'node["amenity"="fuel"](around:{radius},{lat},{lng});',
  },
  {
    key: "food",
    label: "ร้านอาหาร",
    icon: Coffee,
    color: "#ef4444",
    overpass:
      '(node["amenity"="restaurant"](around:{radius},{lat},{lng});node["amenity"="fast_food"](around:{radius},{lat},{lng});)',
  },
  {
    key: "convenience",
    label: "ร้านสะดวกซื้อ",
    icon: Store,
    color: "#22c55e",
    overpass:
      '(node["shop"="convenience"](around:{radius},{lat},{lng});node["name"~"7-?Eleven|FamilyMart|Lawson|Mini Big C|CJ More|Lotus",i](around:{radius},{lat},{lng});)',
  },
  {
    key: "coffee",
    label: "ร้านกาแฟ",
    icon: Coffee,
    color: "#8b5cf6",
    overpass:
      '(node["amenity"="cafe"](around:{radius},{lat},{lng});)',
  },
  {
    key: "parking",
    label: "ที่จอดรถ",
    icon: Car,
    color: "#3b82f6",
    overpass:
      'node["amenity"="parking"](around:{radius},{lat},{lng});',
  },
  {
    key: "bank",
    label: "ธนาคาร / ATM",
    icon: Building,
    color: "#06b6d4",
    overpass:
      '(node["amenity"="bank"](around:{radius},{lat},{lng});node["amenity"="atm"](around:{radius},{lat},{lng});)',
  },
  {
    key: "toilet",
    label: "ห้องน้ำ",
    icon: Store,
    color: "#ec4899",
    overpass:
      'node["amenity"="toilets"](around:{radius},{lat},{lng});',
  },
  {
    key: "hospital",
    label: "โรงพยาบาล",
    icon: Building,
    color: "#ef4444",
    overpass:
      '(node["amenity"="hospital"](around:{radius},{lat},{lng});node["amenity"="clinic"](around:{radius},{lat},{lng});)',
  },
];

const RADII = [
  { value: 500, label: "500 ม." },
  { value: 1000, label: "1 กม." },
  { value: 2000, label: "2 กม." },
  { value: 5000, label: "5 กม." },
];

const CATEGORY_EMOJI = {
  fuel: "⛽",
  food: "🍜",
  convenience: "🏪",
  coffee: "☕",
  parking: "🅿️",
  bank: "🏧",
  toilet: "🚻",
  hospital: "🏥",
};

function createIcon(emoji, color) {
  return L.divIcon({
    className: "",
    html: `<div style="
      width:32px;height:32px;border-radius:50%;
      background:${color};border:3px solid white;
      box-shadow:0 2px 6px rgba(0,0,0,0.3);
      display:flex;align-items:center;justify-content:center;
      font-size:16px;
    ">${emoji}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

function calcDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDist(m) {
  if (m < 1000) return `${Math.round(m)} ม.`;
  return `${(m / 1000).toFixed(1)} กม.`;
}

export default function NearbyPage() {
  const [location, setLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("fuel");
  const [radius, setRadius] = useState(1000);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isNameSearch, setIsNameSearch] = useState(false);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("เบราว์เซอร์ไม่รองรับ GPS");
      return;
    }
    setLocating(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setLocating(false);
      },
      () => {
        setError("ไม่สามารถระบุตำแหน่งได้ กรุณาเปิด GPS");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const searchNearbyByCategory = async () => {
    if (!location) return;
    setLoading(true);
    setError("");

    const cat = CATEGORIES.find((c) => c.key === selectedCategory);
    if (!cat) return;

    const query = cat.overpass
      .replace(/{radius}/g, radius)
      .replace(/{lat}/g, location.lat)
      .replace(/{lng}/g, location.lng);

    const fullQuery = `
      [out:json][timeout:15];
      ( ${query} );
      out center;
    `;

    try {
      const res = await fetch("/api/overpass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: fullQuery }),
      });
      const data = await res.json();
      processResults(data);
    } catch (err) {
      setError("เกิดข้อผิดพลาดในการค้นหา ลองใหม่อีกครั้ง");
    }
    setLoading(false);
  };

  const searchByName = async () => {
    if (!location || !searchQuery.trim()) return;
    setLoading(true);
    setError("");
    setIsNameSearch(true);

    const q = searchQuery.trim();
    const fullQuery = `
      [out:json][timeout:15];
      (
        node["name"~"${q}",i](around:${radius},${location.lat},${location.lng});
        node["name:th"~"${q}",i](around:${radius},${location.lat},${location.lng});
        node["brand"~"${q}",i](around:${radius},${location.lat},${location.lng});
        way["name"~"${q}",i](around:${radius},${location.lat},${location.lng});
      );
      out center;
    `;

    try {
      const res = await fetch("/api/overpass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: fullQuery }),
      });
      const data = await res.json();
      processResults(data);
      if (data.elements.length === 0) {
        setError(`ไม่พบ "${q}" ในรัศมี ${formatDist(radius)}`);
      }
    } catch (err) {
      setError("เกิดข้อผิดพลาดในการค้นหา ลองใหม่อีกครั้ง");
    }
    setLoading(false);
  };

  const processResults = (data) => {
    const results = data.elements
      .filter((el) => el.lat && el.lon)
      .map((el) => ({
        id: el.id,
        name: el.tags?.name || el.tags?.["name:th"] || el.tags?.brand || "ไม่ทราบชื่อ",
        lat: el.lat,
        lng: el.lon,
        type: el.tags?.amenity || el.tags?.shop || "",
        brand: el.tags?.brand || "",
        opening_hours: el.tags?.opening_hours || "",
        phone: el.tags?.phone || "",
        distance: calcDistance(
          location.lat,
          location.lng,
          el.lat,
          el.lon
        ),
        tags: el.tags,
      }))
      .sort((a, b) => a.distance - b.distance);

    setPlaces(results);
  };

  useEffect(() => {
    if (location && !isNameSearch) searchNearbyByCategory();
  }, [location, selectedCategory, radius]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      searchByName();
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setIsNameSearch(false);
    if (location) searchNearbyByCategory();
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <Navigation className="text-grab-green" />
        หาร้านค้าใกล้เคียง
      </h1>

      {/* Location Status */}
      {!location && (
        <button
          onClick={getCurrentLocation}
          disabled={locating}
          className="w-full flex items-center justify-center gap-2 bg-grab-green hover:bg-grab-green-dark text-white py-3 rounded-xl font-medium"
        >
          {locating ? (
            <Loader size={18} className="animate-spin" />
          ) : (
            <Crosshair size={18} />
          )}
          {locating ? "กำลังระบุตำแหน่ง..." : "เปิด GPS ระบุตำแหน่ง"}
        </button>
      )}

      {error && (
        <div className="flex items-center justify-between bg-red-50 dark:bg-red-900/20 text-red-600 text-sm p-3 rounded-xl">
          <span>{error}</span>
          <button onClick={() => setError("")} className="text-red-400 hover:text-red-600">
            ✕
          </button>
        </div>
      )}

      {/* Name Search Bar */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="พิมพ์ชื่อร้าน เช่น 7-Eleven, ปตท, Starbucks..."
          className="w-full pl-10 pr-20 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-grab-green text-sm"
        />
        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1">
          {searchQuery && (
            <button
              type="button"
              onClick={clearSearch}
              className="px-2 py-1.5 text-xs text-gray-400 hover:text-red-500"
            >
              ✕
            </button>
          )}
          <button
            type="submit"
            disabled={!searchQuery.trim() || !location}
            className="px-3 py-1.5 bg-grab-green text-white rounded-lg text-xs font-medium disabled:opacity-40"
          >
            ค้นหา
          </button>
        </div>
      </form>

      {/* Categories - hidden when name search is active */}
      {!isNameSearch && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat.key
                  ? "text-white shadow-sm"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
              }`}
              style={
                selectedCategory === cat.key
                  ? { background: cat.color }
                  : {}
              }
            >
              {CATEGORY_EMOJI[cat.key]}
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* Radius */}
      <div className="flex gap-2">
        {RADII.map((r) => (
          <button
            key={r.value}
            onClick={() => setRadius(r.value)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              radius === r.value
                ? "bg-grab-green text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Refresh */}
      <button
        onClick={() => {
          if (isNameSearch) searchByName();
          else searchNearbyByCategory();
        }}
        disabled={!location || loading}
        className="w-full flex items-center justify-center gap-2 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40"
      >
        <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        {loading ? "กำลังค้นหา..." : "ค้นหาใหม่"}
      </button>

      {/* Map */}
      {location && (
        <div className="rounded-2xl overflow-hidden shadow-sm" style={{ height: "350px" }}>
          <MapContainer
            center={[location.lat, location.lng]}
            zoom={14}
            style={{ height: "100%", width: "100%" }}
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org">OSM</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <Circle
              center={[location.lat, location.lng]}
              radius={radius}
              pathOptions={{
                color: "#00b14f",
                fillColor: "#00b14f",
                fillOpacity: 0.08,
                weight: 2,
              }}
            />

            <Marker
              position={[location.lat, location.lng]}
              icon={createIcon("📍", "#00b14f")}
            >
              <Popup>
                <div className="text-center">
                  <p className="font-bold text-sm">ตำแหน่งของคุณ</p>
                </div>
              </Popup>
            </Marker>

            {places.map((place) => (
              <Marker
                key={place.id}
                position={[place.lat, place.lng]}
                icon={createIcon(
                  CATEGORY_EMOJI[place.type] || "📍",
                  CATEGORIES.find((c) => c.key === selectedCategory)?.color || "#666"
                )}
              >
                <Popup>
                  <div className="min-w-[150px]">
                    <p className="font-bold text-sm">{place.name}</p>
                    {place.brand && (
                      <p className="text-xs text-gray-500">{place.brand}</p>
                    )}
                    <p className="text-green-600 font-medium text-sm mt-1">
                      {formatDist(place.distance)}
                    </p>
                    {place.opening_hours && (
                      <p className="text-xs text-gray-400 mt-1">
                        🕐 {place.opening_hours}
                      </p>
                    )}
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-2 px-3 py-1 bg-green-500 text-white rounded-lg text-xs font-medium"
                    >
                      <LocateFixed size={12} />
                      นำทาง
                    </a>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      )}

      {/* Search indicator */}
      {isNameSearch && (
        <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3">
          <p className="text-sm text-blue-600">
            🔍 ค้นหา "<span className="font-bold">{searchQuery}</span>"
          </p>
          <button
            onClick={clearSearch}
            className="text-xs text-blue-400 hover:text-blue-600 underline"
          >
            ล้างการค้นหา
          </button>
        </div>
      )}

      {/* Results List */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {isNameSearch ? `พบ ${places.length} แห่ง` : `ร้าน${CATEGORIES.find((c) => c.key === selectedCategory)?.label} ${places.length} แห่ง`}
        </p>
        {places.map((place) => (
          <div
            key={place.id}
            className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0"
                style={{
                  background: `${CATEGORIES.find((c) => c.key === selectedCategory)?.color || "#666"}20`,
                }}
              >
                {CATEGORY_EMOJI[place.type] || "📍"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                  {place.name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {place.brand && `${place.brand} • `}
                  {place.tags?.["addr:street"] && `${place.tags["addr:street"]} `}
                  {place.tags?.["addr:subdistrict"] || place.tags?.["addr:city"] || ""}
                </p>
                {place.opening_hours && (
                  <p className="text-[10px] text-gray-400">🕐 {place.opening_hours}</p>
                )}
              </div>
              <div className="text-right shrink-0 space-y-1">
                <p className="text-sm font-bold text-grab-green">
                  {formatDist(place.distance)}
                </p>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-grab-green text-white rounded-md text-[10px] font-medium"
                >
                  <LocateFixed size={10} />
                  นำทาง
                </a>
              </div>
            </div>
          </div>
        ))}

        {!loading && location && places.length === 0 && (
          <p className="text-center text-gray-400 py-6 text-sm">
            {isNameSearch
              ? `ไม่พบ "${searchQuery}" ในรัศมีนี้`
              : `ไม่พบ${CATEGORIES.find((c) => c.key === selectedCategory)?.label}ในรัศมีนี้`}
          </p>
        )}
      </div>
    </div>
  );
}
