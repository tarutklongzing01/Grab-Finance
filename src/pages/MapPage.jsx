import { useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import {
  startOfDay,
  endOfDay,
  subDays,
  format,
} from "date-fns";
import { useWallet } from "../context/WalletContext";
import { formatCurrency, INCOME_TYPES } from "../utils/constants";
import { MapPin, Calendar, Navigation, TrendingUp } from "lucide-react";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const dayColors = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899",
];

function createColorIcon(color) {
  return L.divIcon({
    className: "",
    html: `<div style="
      width:24px;height:24px;border-radius:50%;
      background:${color};border:3px solid white;
      box-shadow:0 2px 6px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

function FitBounds({ positions }) {
  const map = useMap();
  if (positions.length > 0) {
    const bounds = L.latLngBounds(positions);
    map.fitBounds(bounds, { padding: [40, 40] });
  }
  return null;
}

export default function MapPage() {
  const { incomes } = useWallet();
  const [selectedDay, setSelectedDay] = useState(0);

  const dayOptions = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), i);
      return {
        date,
        label: i === 0 ? "วันนี้" : i === 1 ? "เมื่อวาน" : format(date, "dd MMM"),
        fullLabel: format(date, "dd MMM yyyy"),
      };
    });
  }, []);

  const selectedDate = dayOptions[selectedDay].date;

  const allPointsWithLocation = useMemo(() => {
    return incomes.filter(
      (item) => item.location && item.location.lat && item.location.lng
    );
  }, [incomes]);

  const todayPoints = useMemo(() => {
    return allPointsWithLocation.filter((item) => {
      if (!item.createdAt) return false;
      const d = item.createdAt.toDate();
      return d >= startOfDay(selectedDate) && d <= endOfDay(selectedDate);
    });
  }, [allPointsWithLocation, selectedDate]);

  const allPoints = useMemo(() => {
    return allPointsWithLocation.map((item) => ({
      ...item,
      color: dayColors[
        Math.floor(
          (new Date(item.createdAt?.toDate?.() || Date.now()).getDate()) % dayColors.length
        )
      ],
    }));
  }, [allPointsWithLocation]);

  const routePositions = useMemo(() => {
    return todayPoints.map((item) => [item.location.lat, item.location.lng]);
  }, [todayPoints]);

  const todayTotal = useMemo(() => {
    return todayPoints.reduce((s, i) => s + (i.amount || 0), 0);
  }, [todayPoints]);

  const center = useMemo(() => {
    if (routePositions.length > 0) return routePositions[0];
    if (allPoints.length > 0) return [allPoints[0].location.lat, allPoints[0].location.lng];
    return [13.7563, 100.5018];
  }, [routePositions, allPoints]);

  const [showAll, setShowAll] = useState(true);
  const displayPoints = showAll ? allPoints : todayPoints;

  return (
    <div className="space-y-4">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <MapPin className="text-grab-green" />
        แผนที่รายได้
      </h1>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setShowAll(true)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              showAll
                ? "bg-grab-green text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
            }`}
          >
            ทั้งหมด
          </button>
          {dayOptions.map((day, i) => (
            <button
              key={i}
              onClick={() => {
                setShowAll(false);
                setSelectedDay(i);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                !showAll && selectedDay === i
                  ? "bg-grab-green text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
              }`}
            >
              {day.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 text-center shadow-sm">
          <Navigation size={16} className="mx-auto text-blue-500 mb-1" />
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {displayPoints.length}
          </p>
          <p className="text-[10px] text-gray-500">จุดที่บันทึก</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 text-center shadow-sm">
          <TrendingUp size={16} className="mx-auto text-green-500 mb-1" />
          <p className="text-lg font-bold text-green-600">
            {formatCurrency(
              displayPoints.reduce((s, i) => s + (i.amount || 0), 0)
            )}
          </p>
          <p className="text-[10px] text-gray-500">รายได้รวม</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 text-center shadow-sm">
          <Calendar size={16} className="mx-auto text-purple-500 mb-1" />
          <p className="text-lg font-bold text-purple-600">
            {!showAll ? formatCurrency(todayTotal) : "-"}
          </p>
          <p className="text-[10px] text-gray-500">
            {showAll ? "เลือกวัน" : "วันนี้"}
          </p>
        </div>
      </div>

      {/* Map */}
      <div className="rounded-2xl overflow-hidden shadow-sm" style={{ height: "400px" }}>
        <MapContainer
          center={center}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org">OSM</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {!showAll && routePositions.length > 1 && (
            <Polyline
              positions={routePositions}
              color="#00b14f"
              weight={4}
              opacity={0.8}
              dashArray="10, 6"
            />
          )}

          {displayPoints.map((item) => (
            <Marker
              key={item.id}
              position={[item.location.lat, item.location.lng]}
              icon={
                showAll
                  ? createColorIcon(item.color)
                  : createColorIcon("#00b14f")
              }
            >
              <Popup>
                <div className="text-center min-w-[120px]">
                  <p className="font-bold text-sm">
                    {INCOME_TYPES[item.type]?.icon}{" "}
                    {INCOME_TYPES[item.type]?.label}
                  </p>
                  <p className="text-green-600 font-bold text-lg">
                    +{formatCurrency(item.amount)}
                  </p>
                  {item.note && (
                    <p className="text-gray-500 text-xs">{item.note}</p>
                  )}
                  <p className="text-gray-400 text-[10px] mt-1">
                    {item.createdAt?.toDate
                      ? format(item.createdAt.toDate(), "dd MMM HH:mm")
                      : ""}
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}

          {displayPoints.length > 0 && (
            <FitBounds
              positions={displayPoints.map((p) => [p.location.lat, p.location.lng])}
            />
          )}
        </MapContainer>
      </div>

      {/* Legend for all points view */}
      {showAll && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm">
          <p className="text-xs text-gray-500 mb-2">สีตามวันที่:</p>
          <div className="flex flex-wrap gap-2">
            {dayOptions.map((day, i) => (
              <div key={i} className="flex items-center gap-1 text-xs">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ background: dayColors[i] }}
                />
                <span className="text-gray-600 dark:text-gray-400">
                  {day.fullLabel}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {allPointsWithLocation.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <MapPin size={48} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">ยังไม่มีรายการที่บันทึกตำแหน่ง GPS</p>
          <p className="text-xs mt-1">กดปักหมุดตอนเพิ่มรายรับ</p>
        </div>
      )}
    </div>
  );
}
