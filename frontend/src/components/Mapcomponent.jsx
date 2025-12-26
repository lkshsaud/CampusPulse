import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const MapComponent = ({ 
  center = [27.6191, 85.5394], 
  zoom = 16,
  onLocationSelect,
  onMarkerClick,
  markers = [],
  selectedLocation = null,
  radius = 500,
  onRadiusChange,
  showRemoveButton = false,
  onRemoveLocation
}) => {
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markersRef = useRef([]);
  const selectedMarkerRef = useRef(null);
  const polygonRef = useRef(null);

  // KU Campus polygon
  const KU_POLYGON = [
    [27.6165, 85.5365], [27.6185, 85.5425], [27.6205, 85.5435],
    [27.6225, 85.5415], [27.6230, 85.5375], [27.6210, 85.5345],
    [27.6190, 85.5350], [27.6165, 85.5365]
  ];

  // Initialize map
  useEffect(() => {
    if (!leafletMapRef.current) {
      const map = L.map(mapRef.current).setView(center, zoom);
      
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);
      
      // Add campus boundary
      polygonRef.current = L.polygon(KU_POLYGON, {
        color: "#3b82f6",
        weight: 3,
        opacity: 0.8,
        fillColor: "#93c5fd",
        fillOpacity: 0.2,
        dashArray: "8, 8"
      }).addTo(map);
      
      leafletMapRef.current = map;
      
      // Add click handler
      map.on("click", (e) => {
        if (polygonRef.current.getBounds().contains(e.latlng)) {
          if (onLocationSelect) onLocationSelect(e.latlng);
        }
      });
    }
    
    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  // Update markers
  useEffect(() => {
    if (!leafletMapRef.current) return;
    
    // Clear existing markers
    markersRef.current.forEach(marker => {
      leafletMapRef.current.removeLayer(marker);
    });
    markersRef.current = [];
    
    // Add new markers
    markers.forEach(report => {
      if (report.status === "claimed") return;
      
      const iconColor = report.category === "lost" ? "#ef4444" : "#10b981";
      
      const icon = L.divIcon({
        html: `
          <div style="
            width: 30px;
            height: 30px;
            background-color: ${iconColor};
            border: 2px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 12px;
          ">
            ${report.category === "lost" ? "L" : "F"}
          </div>
        `,
        className: "custom-div-icon",
        iconSize: [30, 30],
        iconAnchor: [15, 30]
      });
      
      const marker = L.marker([report.lat, report.lng], { icon })
        .addTo(leafletMapRef.current)
        .bindPopup(`
          <div class="map-popup">
            <h4><strong>${report.itemName}</strong> 
              <span class="popup-category ${report.category}">(${report.category})</span>
            </h4>
            <p class="popup-desc">${report.description || "No description"}</p>
            ${report.imageUrl ? `
              <img src="${report.imageUrl}" alt="${report.itemName}" 
                class="popup-img" 
                style="max-width: 150px; border-radius: 4px; margin: 5px 0;">
            ` : ""}
            <div class="popup-details">
              <p><span class="label">📍 Location:</span> 
                ${report.lat?.toFixed(4)}, ${report.lng?.toFixed(4)}
              </p>
              ${report.contact ? `
                <p><span class="label">📞 Contact:</span> ${report.contact}</p>
              ` : ""}
            </div>
            <button onclick="window.handleMarkerClick('${report._id}')" 
              class="popup-action-btn">
              Find Similar Items
            </button>
          </div>
        `);
      
      marker.on("click", () => {
        if (onMarkerClick) onMarkerClick(report);
      });
      
      markersRef.current.push(marker);
    });
  }, [markers, onMarkerClick]);

  // Update selected location marker
  useEffect(() => {
    if (!leafletMapRef.current) return;
    
    // Clear previous selected marker
    if (selectedMarkerRef.current) {
      leafletMapRef.current.removeLayer(selectedMarkerRef.current);
    }
    
    if (selectedLocation) {
      selectedMarkerRef.current = L.marker(selectedLocation, {
        icon: L.divIcon({
          html: `
            <div style="
              width: 40px;
              height: 40px;
              background-color: #f59e0b;
              border: 3px solid white;
              border-radius: 50%;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: bold;
              font-size: 20px;
            ">
              📍
            </div>
          `,
          className: "custom-div-icon",
          iconSize: [40, 40],
          iconAnchor: [20, 40]
        })
      }).addTo(leafletMapRef.current);
      
      selectedMarkerRef.current.bindPopup(`
        <div class="selected-location-popup">
          <strong>Selected Location</strong><br>
          ${selectedLocation.lat.toFixed(6)}, ${selectedLocation.lng.toFixed(6)}
        </div>
      `).openPopup();
    }
  }, [selectedLocation]);

  return (
    <div className="map-container">
      <div className="map-controls">
        <div className="radius-control">
          <label>Search Radius: {radius}m</label>
          <input
            type="range"
            min="100"
            max="2000"
            step="100"
            value={radius}
            onChange={(e) => onRadiusChange && onRadiusChange(parseInt(e.target.value))}
          />
          <div className="radius-hint">
            <small>Adjusts how far to search for matches</small>
          </div>
        </div>
        
        {showRemoveButton && selectedLocation && (
          <button 
            className="remove-marker-btn"
            onClick={onRemoveLocation}
            title="Remove selected location"
          >
            🗑️ Clear Location
          </button>
        )}
        
        <div className="map-legend">
          <span className="legend-item lost">● Lost</span>
          <span className="legend-item found">● Found</span>
          <span className="legend-item selected">📍 Selected</span>
        </div>
      </div>
      <div ref={mapRef} className="leaflet-map" />
      <div className="map-instructions">
        <p>📌 Click on map to select location for your report</p>
        <p>🖱️ Click on any marker to find similar items</p>
      </div>
    </div>
  );
};

export default MapComponent;