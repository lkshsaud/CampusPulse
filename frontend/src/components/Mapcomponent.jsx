import React, { useEffect, useRef, useState, useCallback } from "react";
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
  onRemoveLocation,
  selectedReportId = null // Add this to highlight selected report
}) => {
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markersRef = useRef([]);
  const selectedMarkerRef = useRef(null);
  const polygonRef = useRef(null);
  const circleRef = useRef(null);
  const [activePopup, setActivePopup] = useState(null);

  // KU Campus polygon
  const KU_POLYGON = [
    [27.6165, 85.5365], [27.6185, 85.5425], [27.6205, 85.5435],
    [27.6225, 85.5415], [27.6230, 85.5375], [27.6210, 85.5345],
    [27.6190, 85.5350], [27.6165, 85.5365]
  ];

  // Custom icons
  const createMarkerIcon = (color, size = 30, letter) => {
    return L.divIcon({
      html: `
        <div style="
          width: ${size}px;
          height: ${size}px;
          background-color: ${color};
          border: 2px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 5px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        ">
          ${letter}
        </div>
      `,
      className: "custom-div-icon",
      iconSize: [size, size],
      iconAnchor: [size/2, size]
    });
  };

  // Initialize map
  useEffect(() => {
    if (!leafletMapRef.current && mapRef.current) {
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
      
      // Add click handler for location selection
      map.on("click", (e) => {
        if (polygonRef.current.getBounds().contains(e.latlng)) {
          if (onLocationSelect) {
            onLocationSelect(e.latlng);
          }
        } else {
          // Show alert if outside campus
          L.popup()
            .setLatLng(e.latlng)
            .setContent("Please select a location within KU Campus")
            .openOn(map);
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

  // Update radius circle
  useEffect(() => {
    if (!leafletMapRef.current || !selectedLocation) return;
    
    // Remove previous circle
    if (circleRef.current) {
      leafletMapRef.current.removeLayer(circleRef.current);
    }
    
    // Add new circle
    circleRef.current = L.circle(selectedLocation, {
      color: '#3b82f6',
      fillColor: '#3b82f6',
      fillOpacity: 0.1,
      radius: radius
    }).addTo(leafletMapRef.current);
  }, [selectedLocation, radius]);

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
      
      const isSelected = selectedReportId === report._id;
      const iconColor = isSelected ? "#f59e0b" : (report.category === "lost" ? "#ef4444" : "#10b981");
      const iconSize = isSelected ? 40 : 30;
      const iconLetter = isSelected ? "📍" : (report.category === "lost" ? "L" : "F");
      
      const icon = createMarkerIcon(iconColor, iconSize, iconLetter);
      
      // Create popup content
      const popupContent = `
        <div class="map-popup">
          <h4><strong>${report.itemName}</strong> 
            <span class="popup-category ${report.category}">(${report.category})</span>
          </h4>
          <p class="popup-desc">${report.description?.substring(0, 100) || "No description"}...</p>
          ${report.imageUrl ? `
            <img src="${report.imageUrl}" alt="${report.itemName}" 
              class="popup-img" 
              style="max-width: 150px; max-height: 100px; border-radius: 4px; margin: 5px 0; object-fit: cover;">
          ` : ""}
          <div class="popup-details">
            <p><span class="label">📍 Location:</span> 
              ${report.lat?.toFixed(4)}, ${report.lng?.toFixed(4)}
            </p>
            ${report.contact ? `
              <p><span class="label">📞 Contact:</span> ${report.contact}</p>
            ` : ""}
            ${report.similarity !== undefined ? `
              <p><span class="label">📊 Similarity:</span> ${Math.round(report.similarity * 100)}%</p>
            ` : ""}
          </div>
          <button class="popup-action-btn" data-report-id="${report._id}">
            View Details
          </button>
        </div>
      `;
      
      const marker = L.marker([report.lat, report.lng], { icon })
        .addTo(leafletMapRef.current)
        .bindPopup(popupContent);
      
      // Handle marker click
      marker.on("click", (e) => {
        // Prevent immediate closing of popup
        e.originalEvent.preventDefault();
        e.originalEvent.stopPropagation();
        
        // Open popup
        marker.openPopup();
        
        // Call the onMarkerClick callback
        if (onMarkerClick) {
          onMarkerClick(report);
        }
      });
      
      // Handle popup open
      marker.on("popupopen", () => {
        setActivePopup(report._id);
        
        // Add event listener to the popup button
        setTimeout(() => {
          const popupBtn = document.querySelector(`button[data-report-id="${report._id}"]`);
          if (popupBtn) {
            popupBtn.addEventListener("click", (e) => {
              e.preventDefault();
              e.stopPropagation();
              if (onMarkerClick) {
                onMarkerClick(report);
                marker.closePopup();
              }
            });
          }
        }, 100);
      });
      
      // Handle popup close
      marker.on("popupclose", () => {
        if (activePopup === report._id) {
          setActivePopup(null);
        }
      });
      
      markersRef.current.push(marker);
      
      // Open popup if this is the selected report
      if (isSelected) {
        setTimeout(() => {
          marker.openPopup();
        }, 500);
      }
    });
  }, [markers, onMarkerClick, selectedReportId, activePopup]);

  // Update selected location marker
  useEffect(() => {
    if (!leafletMapRef.current) return;
    
    // Clear previous selected marker
    if (selectedMarkerRef.current) {
      leafletMapRef.current.removeLayer(selectedMarkerRef.current);
      selectedMarkerRef.current = null;
    }
    
    if (selectedLocation) {
      const selectedIcon = createMarkerIcon("#f59e0b", 40, "📍");
      selectedMarkerRef.current = L.marker(selectedLocation, {
        icon: selectedIcon,
        zIndexOffset: 1000
      }).addTo(leafletMapRef.current);
      
      selectedMarkerRef.current.bindPopup(`
        <div class="selected-location-popup">
          <strong>Selected Location</strong><br>
          ${selectedLocation.lat.toFixed(6)}, ${selectedLocation.lng.toFixed(6)}<br>
          <small>Radius: ${radius}m</small>
        </div>
      `).openPopup();
      
      // Center map on selected location
      leafletMapRef.current.setView(selectedLocation, 18);
    }
  }, [selectedLocation, radius]);

  // Fit bounds to show all markers
  useEffect(() => {
    if (!leafletMapRef.current || markers.length === 0) return;
    
    const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]));
    if (selectedLocation) {
      bounds.extend(selectedLocation);
    }
    
    leafletMapRef.current.fitBounds(bounds, { padding: [50, 50] });
  }, [markers, selectedLocation]);

  const handleRemoveLocation = useCallback(() => {
    if (onRemoveLocation) {
      onRemoveLocation();
    }
    if (circleRef.current) {
      leafletMapRef.current?.removeLayer(circleRef.current);
      circleRef.current = null;
    }
  }, [onRemoveLocation]);

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
            className="radius-slider"
          />
          <div className="radius-hint">
            <small>Adjusts how far to search for matches</small>
          </div>
        </div>
        
        {showRemoveButton && selectedLocation && (
          <button 
            className="remove-marker-btn"
            onClick={handleRemoveLocation}
            title="Remove selected location"
          >
            🗑️ Clear Location
          </button>
        )}
        
        <div className="map-legend">
          <span className="legend-item"><div className="legend-dot lost"></div> Lost</span>
          <span className="legend-item"><div className="legend-dot found"></div> Found</span>
          <span className="legend-item"><div className="legend-dot selected"></div> Selected</span>
        </div>
      </div>
      <div ref={mapRef} className="leaflet-map" />
      <div className="map-instructions">
        <p>📌 Click on map within KU Campus to select location for your report</p>
        <p>🖱️ Click on any marker to view report details</p>
        <p>🎯 Blue circle shows your search radius</p>
      </div>
    </div>
  );
};

export default MapComponent;