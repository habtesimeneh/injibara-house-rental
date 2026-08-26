import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MessageSquare,
  Home,
  MapPin,
  Search,
  ArrowRight,
  DollarSign,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import CITY_CONFIG from "../config/cityConfig";

const escapeHtml = (value) => {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};
const PropertyDetailModal = React.lazy(() => import("./PropertyDetailModal"));
import RentalRequestModal from "./RentalRequestModal";
import ContactBrokerModal from "./ContactBrokerModal";

// Default coordinates for Injibara & Amhara cities
const CITY_COORDINATES = {
  Injibara: [10.95, 36.9167],
  "Kebele 01": [10.952, 36.918],
  "Kebele 02": [10.948, 36.915],
  "Kebele 03": [10.954, 36.92],
  "Injibara University": [10.961, 36.925],
  "Bus Station": [10.947, 36.914],
  "Hospital Area": [10.953, 36.912],
};

// Fallback offset generator to avoid exact overlap of pins in same subcity
const getAdjustedCoords = (house, index) => {
  const key = house.sub_city || house.address || house.city;
  let base =
    CITY_COORDINATES[key] ||
    CITY_COORDINATES[house.city] ||
    CITY_COORDINATES["Injibara"];

  // Slight jitter for visual offset if multiple houses share same area
  const latOffset = ((index % 3) - 1) * 0.0035;
  const lngOffset = ((Math.floor(index / 3) % 3) - 1) * 0.0035;

  return [base[0] + latOffset, base[1] + lngOffset];
};

const InteractiveMap = ({ houses = [], onStartChat, height = "600px" }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [selectedHouse, setSelectedHouse] = useState(null);
  const [requestHouse, setRequestHouse] = useState(null);
  const [brokerHouse, setBrokerHouse] = useState(null);

  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    // Initialize Leaflet Map once
    const map = L.map(container, {
      center: [10.95, 36.9167], // Injibara City center
      zoom: 13,
      zoomControl: true,
      trackResize: true,
    });

    // OpenStreetMap Tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    // Force a resize check after a small delay to ensure container is fully rendered
    const resizeTimeout = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 250);

    return () => {
      clearTimeout(resizeTimeout);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.off();
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Create Leaflet Icon
    const customIcon = L.divIcon({
      className: "custom-map-pin",
      html: `
        <div style="background-color: #EAB308; color: #000; padding: 6px 10px; border-radius: 20px; font-weight: bold; font-size: 12px; border: 2px solid #000; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; align-items: center; gap: 4px; white-space: nowrap;">
          <span style="font-size: 14px;">🏠</span>
          <span>ETB</span>
        </div>
      `,
      iconSize: [80, 36],
      iconAnchor: [40, 18],
    });

    const bounds = L.latLngBounds();

    houses.forEach((house, idx) => {
      const coords = getAdjustedCoords(house, idx);
      bounds.extend(coords);

      const marker = L.marker(coords, { icon: customIcon }).addTo(map);

      const popupContent = document.createElement("div");
      popupContent.className = "p-1 text-gray-900 font-sans max-w-xs";
      popupContent.innerHTML = `
        <div style="width: 220px;">
          <img loading="lazy" src="${escapeHtml(house.image_url || '')}" alt="${escapeHtml(house.title || '')}" style="width: 100%; height: 120px; object-fit: cover; border-radius: 8px; margin-bottom: 8px;" />
          <span style="background-color: #FEF08A; color: #854D0E; font-size: 10px; font-weight: bold; padding: 2px 8px; border-radius: 12px; text-transform: uppercase;">${escapeHtml(house.type || '')}</span>
          <h4 style="font-size: 14px; font-weight: bold; margin-top: 4px; margin-bottom: 4px; line-height: 1.2;">${escapeHtml(house.title || '')}</h4>
          <p style="font-size: 12px; color: #4B5563; margin-bottom: 6px;">📍 ${escapeHtml(house.sub_city || house.city || '')}, ${escapeHtml(house.region || '')}</p>
          <div style="font-size: 15px; font-weight: 800; color: #D97706; margin-bottom: 8px;">
            ETB ${Number(house.price).toLocaleString()} <span style="font-size: 11px; color: #6B7280; font-weight: normal;">/ month</span>
          </div>
          <div id="btn-container-${escapeHtml(String(house.house_id || ''))}" style="display: flex; gap: 6px;">
            <button id="view-house-${escapeHtml(String(house.house_id || ''))}" style="flex: 1; background: #111827; color: #fff; border: none; padding: 6px 10px; border-radius: 6px; font-size: 11px; font-weight: bold; cursor: pointer;">Details</button>
            <button id="chat-house-${escapeHtml(String(house.house_id || ''))}" style="flex: 1; background: #D97706; color: #fff; border: none; padding: 6px 10px; border-radius: 6px; font-size: 11px; font-weight: bold; cursor: pointer;">Chat</button>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);

      marker.on("popupopen", () => {
        // Small delay to ensure DOM is ready
        const timeoutId = setTimeout(() => {
          const viewBtn = document.getElementById(
            `view-house-${house.house_id}`,
          );
          const chatBtn = document.getElementById(
            `chat-house-${house.house_id}`,
          );

          if (viewBtn) {
            viewBtn.onclick = () => {
              setSelectedHouse(house);
            };
          }
          if (chatBtn) {
            chatBtn.onclick = () => {
              if (onStartChat) {
                onStartChat(house.owner_id, house.house_id);
              } else if (user) {
                navigate(
                  `/messages?user=${house.owner_id}&house=${house.house_id}`,
                );
              } else {
                navigate("/login", {
                  state: {
                    from: `/messages?user=${house.owner_id}&house=${house.house_id}`,
                  },
                });
              }
            };
          }
        }, 50);

        // Clean up timeout if marker is removed or popup closed?
        // Leaflet doesn't easily expose this, but we can store it on the marker
        marker._popup_timeout = timeoutId;
      });

      marker.on("popupclose", () => {
        if (marker._popup_timeout) {
          clearTimeout(marker._popup_timeout);
        }
      });

      markersRef.current.push(marker);
    });

    if (houses.length > 0 && bounds.isValid()) {
      // Invalidate size before fitting bounds to ensure correct calculations
      map.invalidateSize();
      map.fitBounds(bounds, { padding: [50, 50], animate: false });
    }
  }, [houses, user, navigate, onStartChat]);

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-200">
      <div
        ref={mapContainerRef}
        style={{ height, width: "100%" }}
        className="z-0"
      />

      {/* Property Detail Modal */}
      <React.Suspense fallback={null}>
        <PropertyDetailModal
          house={selectedHouse}
          isOpen={Boolean(selectedHouse)}
          onClose={() => setSelectedHouse(null)}
          onRequestRental={(house) => {
            setSelectedHouse(null);
            setRequestHouse(house);
          }}
          onContactBroker={(house) => {
            setSelectedHouse(null);
            setBrokerHouse(house);
          }}
        />
      </React.Suspense>

      {/* Rental Request Modal */}
      <RentalRequestModal
        house={requestHouse}
        isOpen={Boolean(requestHouse)}
        onClose={() => setRequestHouse(null)}
        onSuccess={() => {
          setRequestHouse(null);
          navigate("/dashboard");
        }}
      />

      {/* Contact Broker Modal */}
      <ContactBrokerModal
        house={brokerHouse}
        isOpen={Boolean(brokerHouse)}
        onClose={() => setBrokerHouse(null)}
      />
    </div>
  );
};

export default InteractiveMap;
