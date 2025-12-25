// frontend/src/pages/HelpfulHand.jsx
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../styles/helpful-hand.css";
import { FiMapPin, FiSearch, FiFilter, FiCheckCircle, FiClock, FiAlertCircle, FiX } from "react-icons/fi";

// Fix for leaflet default icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function HelpfulHand() {
  // Refs
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const selectedMarkerRef = useRef(null);
  
  // State
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState([]);
  const [nearbyReports, setNearbyReports] = useState([]);
  const [matches, setMatches] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [stats, setStats] = useState({ total: 0, resolved: 0, pending: 0 });
  
  // Form state
  const [formData, setFormData] = useState({
    itemName: "",
    category: "lost",
    description: "",
    image: null,
    contact: "",
    lat: null,
    lng: null
  });
  
  // Filters
  const [filters, setFilters] = useState({
    search: "",
    category: "all",
    status: "open"
  });
  
  // UI State
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [radius, setRadius] = useState(500);
  const [toast, setToast] = useState("");
  const [activeRecommendationTab, setActiveRecommendationTab] = useState("nearby");

  // KU Campus polygon
  const KU_POLYGON = [
    [27.6165, 85.5365], [27.6185, 85.5425], [27.6205, 85.5435],
    [27.6225, 85.5415], [27.6230, 85.5375], [27.6210, 85.5345],
    [27.6190, 85.5350], [27.6165, 85.5365]
  ];

  // Show toast message
  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(""), 3000);
  };

  // Initialize map
  useEffect(() => {
    const map = L.map("map").setView([27.6191, 85.5394], 16);
    
    // Add tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    
    // Add campus boundary
    L.polygon(KU_POLYGON, {
      color: "#3b82f6",
      weight: 3,
      opacity: 0.8,
      fillColor: "#93c5fd",
      fillOpacity: 0.2,
      dashArray: "8, 8"
    }).addTo(map);
    
    mapRef.current = map;
    
    // Load initial data
    fetchReports();
    fetchStats();
    
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
      }
    };
  }, []);
  
  // Fetch all reports
  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/reports", {
        params: filters
      });
      const filteredReports = response.data.filter(report => 
        filters.status === "all" || report.status === filters.status
      );
      setReports(filteredReports);
      renderMarkers(filteredReports.filter(r => r.status === "open")); // Only show open reports on map
    } catch (error) {
      console.error("Error fetching reports:", error);
      showToast("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch matches for current location
  const fetchMatches = async (lat, lng) => {
    if (!formData.category) return;
    
    try {
      const response = await axios.get("/api/reports/matches", {
        params: { 
          lat, 
          lng, 
          category: formData.category, 
          radius,
          itemName: formData.itemName,
          description: formData.description
        }
      });
      setMatches(response.data.matches || []);
    } catch (error) {
      console.error("Error fetching matches:", error);
    }
  };
  
  // Fetch nearby reports
  const fetchNearbyReports = async (lat, lng) => {
    try {
      const response = await axios.get("/api/reports/nearby", {
        params: { lat, lng, radius }
      });
      setNearbyReports(response.data.reports || []);
    } catch (error) {
      console.error("Error fetching nearby reports:", error);
    }
  };
  
  // Fetch image recommendations for a report
  const fetchRecommendations = async (reportId) => {
    try {
      console.log("Fetching recommendations for report:", reportId);
      const response = await axios.get(`/api/reports/${reportId}/recommendations`);
      console.log("Recommendations response:", response.data);
      setRecommendations(response.data.recommendations || []);
      setActiveRecommendationTab("image");
      
      if (response.data.recommendations && response.data.recommendations.length > 0) {
        showToast(`Found ${response.data.recommendations.length} image matches`);
      } else {
        showToast("No similar images found");
      }
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      showToast("Error finding image matches");
    }
  };
  
  // Fetch dashboard stats
  const fetchStats = async () => {
    try {
      console.log("Fetching stats...");
      const response = await axios.get("/api/reports/stats");
      console.log("Stats response:", response.data);
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };
  
  // Render markers on map (only show open reports)
  const renderMarkers = (reportsList) => {
    // Clear existing markers
    markersRef.current.forEach(marker => {
      if (mapRef.current) {
        mapRef.current.removeLayer(marker);
      }
    });
    markersRef.current = [];
    
    reportsList.forEach(report => {
      // Skip claimed reports
      if (report.status === "claimed") return;
      
      let iconColor;
      if (report.category === "lost") {
        iconColor = "#ef4444"; // Red for lost
      } else {
        iconColor = "#10b981"; // Green for found
      }
      
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
      
      const marker = L.marker([report.lat, report.lng], { icon }).addTo(mapRef.current);
      
      // Create popup content
      const popupContent = `
        <div class="map-popup">
          <h4><strong>${report.itemName}</strong> <span class="popup-category ${report.category}">(${report.category})</span></h4>
          <p class="popup-desc">${report.description || "No description"}</p>
          ${report.imageUrl ? `<img src="${report.imageUrl}" alt="${report.itemName}" class="popup-img" style="max-width: 150px; border-radius: 4px; margin: 5px 0;">` : ""}
          <div class="popup-details">
            <p><span class="label">📍 Location:</span> ${report.lat?.toFixed(4)}, ${report.lng?.toFixed(4)}</p>
            ${report.contact ? `<p><span class="label">📞 Contact:</span> ${report.contact}</p>` : ""}
            <p><span class="label">📅 Date:</span> ${new Date(report.createdAt).toLocaleDateString()}</p>
          </div>
          <button onclick="window.handleMarkerClick('${report._id}')" class="popup-action-btn">
            Find Similar Items
          </button>
        </div>
      `;
      
      marker.bindPopup(popupContent);
      
      marker.on("click", () => {
        // Fetch recommendations for this report
        fetchRecommendations(report._id);
        
        // Highlight this report in the list
        setTimeout(() => {
          const element = document.getElementById(`report-${report._id}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('highlight');
            setTimeout(() => element.classList.remove('highlight'), 2000);
          }
        }, 100);
      });
      
      markersRef.current.push(marker);
    });
  };
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { id, value, files } = e.target;
    if (id === "image") {
      setFormData(prev => ({ ...prev, image: files[0] }));
    } else {
      setFormData(prev => ({ ...prev, [id]: value }));
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.lat || !formData.lng) {
      showToast("Please select a location on the map first");
      return;
    }
    
    if (formData.contact && !/^\d{10}$/.test(formData.contact)) {
      showToast("Contact number must be 10 digits");
      return;
    }
    
    if (!formData.itemName || !formData.category || !formData.description) {
      showToast("Please fill all required fields");
      return;
    }
    
    const formDataToSend = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key] !== null && formData[key] !== undefined) {
        formDataToSend.append(key, formData[key]);
      }
    });
    
    try {
      const response = await axios.post("/api/reports", formDataToSend, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      showToast("✅ Report submitted successfully!");
      
      // Reset form
      setFormData({
        itemName: "",
        category: "lost",
        description: "",
        image: null,
        contact: "",
        lat: null,
        lng: null
      });
      
      // Clear selected marker
      removeSelectedMarker();
      
      // Refresh data
      fetchReports();
      fetchStats();
      
      // Also fetch matches for this location to show immediate matches
      fetchMatches(response.data.report.lat, response.data.report.lng);
      
    } catch (error) {
      console.error("Error submitting report:", error);
      showToast("Failed to submit report");
    }
  };
  
  // Handle map click
  const handleMapClick = (e) => {
    const clickedPoint = e.latlng;
    
    // Check if point is within KU polygon bounds
    const bounds = L.latLngBounds(KU_POLYGON);
    if (!bounds.contains(clickedPoint)) {
      showToast("⚠️ Please click inside the KU Campus boundary");
      return;
    }
    
    setSelectedLocation(clickedPoint);
    setFormData(prev => ({
      ...prev,
      lat: clickedPoint.lat,
      lng: clickedPoint.lng
    }));
    
    // Clear previous selected marker
    if (selectedMarkerRef.current) {
      mapRef.current.removeLayer(selectedMarkerRef.current);
    }
    
    // Add new selected marker
    selectedMarkerRef.current = L.marker(clickedPoint, {
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
    }).addTo(mapRef.current);
    
    selectedMarkerRef.current.bindPopup(`
      <div class="selected-location-popup">
        <strong>Selected Location</strong><br>
        ${clickedPoint.lat.toFixed(6)}, ${clickedPoint.lng.toFixed(6)}<br>
        <small>Will use this location for your report</small>
      </div>
    `).openPopup();
    
    // Fetch nearby reports and matches
    fetchNearbyReports(clickedPoint.lat, clickedPoint.lng);
    fetchMatches(clickedPoint.lat, clickedPoint.lng);
  };
  
  // Remove selected marker
  const removeSelectedMarker = () => {
    if (selectedMarkerRef.current) {
      mapRef.current.removeLayer(selectedMarkerRef.current);
      selectedMarkerRef.current = null;
    }
    setSelectedLocation(null);
    setFormData(prev => ({
      ...prev,
      lat: null,
      lng: null
    }));
  };
  
  // Handle claim report
  const handleClaim = async (reportId) => {
    if (!window.confirm("Are you sure you want to mark this report as claimed?")) return;
    
    try {
      await axios.post(`/api/reports/${reportId}/claim`);
      showToast("✅ Report marked as claimed!");
      
      // Refresh data - this will remove claimed reports from map and list
      fetchReports();
      fetchStats();
      
    } catch (error) {
      console.error("Error claiming report:", error);
      showToast("Failed to claim report");
    }
  };
  
  // Apply filters
  const applyFilters = () => {
    fetchReports();
  };
  
  // Reset filters
  const resetFilters = () => {
    setFilters({ search: "", category: "all", status: "open" });
    fetchReports();
  };
  
  // Filtered reports based on search
  const filteredReports = reports.filter(report => {
    const searchTerm = filters.search.toLowerCase();
    return (
      report.itemName.toLowerCase().includes(searchTerm) ||
      (report.description && report.description.toLowerCase().includes(searchTerm))
    );
  });
  
  // Initialize map click handler
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.off("click");
      mapRef.current.on("click", handleMapClick);
    }
  }, [formData.category, radius]);
  
  // Setup global function for popup buttons
  useEffect(() => {
    window.handleMarkerClick = (reportId) => {
      fetchRecommendations(reportId);
    };
    
    return () => {
      delete window.handleMarkerClick;
    };
  }, []);
  
  return (
    <div className="helpful-hand-container">
      {/* Toast Message */}
      {toast && (
        <div className="toast-message">
          {toast}
        </div>
      )}
      
      {/* Header */}
      <header className="helpful-header">
        <div className="header-content">
          <h1>Helpful Hands - KU Campus</h1>
          <p>Lost & Found Reporting System</p>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="main-content">
        {/* Top Section: Map and Report Form */}
        <div className="top-section">
          {/* Map Container */}
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
                  onChange={(e) => {
                    const newRadius = parseInt(e.target.value);
                    setRadius(newRadius);
                    if (selectedLocation) {
                      fetchNearbyReports(selectedLocation.lat, selectedLocation.lng);
                      fetchMatches(selectedLocation.lat, selectedLocation.lng);
                    }
                  }}
                />
                <div className="radius-hint">
                  <small>Adjusts how far to search for matches</small>
                </div>
              </div>
              
              {/* Remove Marker Button */}
              {selectedLocation && (
                <button 
                  className="remove-marker-btn"
                  onClick={removeSelectedMarker}
                  title="Remove selected location"
                >
                  <FiX /> Clear Location
                </button>
              )}
              
              <div className="map-legend">
                <span className="legend-item lost">● Lost</span>
                <span className="legend-item found">● Found</span>
                <span className="legend-item selected">📍 Selected</span>
              </div>
            </div>
            <div id="map" className="leaflet-map"></div>
            <div className="map-instructions">
              <p>📌 Click on map to select location for your report</p>
              <p>🖱️ Click on any marker to find similar items</p>
            </div>
          </div>
          
          {/* Report Form */}
          <div className="form-container">
            <h2><FiMapPin /> Report Lost/Found Item</h2>
            <form onSubmit={handleSubmit} encType="multipart/form-data">
              <div className="form-group">
                <label htmlFor="itemName">Item Name *</label>
                <input
                  type="text"
                  id="itemName"
                  value={formData.itemName}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Wallet, Keys, Phone"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="category">Category *</label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                >
                  <option value="lost">Lost</option>
                  <option value="found">Found</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="description">Description *</label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows="3"
                  placeholder="Describe the item in detail..."
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="contact">Contact Number (10 digits)</label>
                <input
                  type="tel"
                  id="contact"
                  value={formData.contact}
                  onChange={handleInputChange}
                  pattern="[0-9]{10}"
                  placeholder="9812345678"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="image">Upload Image (for better matching)</label>
                <input
                  type="file"
                  id="image"
                  accept="image/*"
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="form-group">
                <label>Selected Location *</label>
                <div className="location-display">
                  {selectedLocation ? (
                    <span className="location-coords">
                      📍 {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                    </span>
                  ) : (
                    <span className="location-hint">
                      Click on the map to select location inside KU Campus
                    </span>
                  )}
                </div>
              </div>
              
              <button type="submit" className="submit-btn">
                <span className="submit-btn-text">Submit Report</span>
              </button>
            </form>
          </div>
        </div>
        
        {/* Middle Section: Search and Recommendations */}
        <div className="middle-section">
          {/* Search Reports */}
          <div className="search-section">
            <div className="section-header">
              <h2><FiSearch /> Search Reports</h2>
              <div className="filters">
                <input
                  type="text"
                  placeholder="Search by name or description..."
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                  className="search-input"
                />
                <select
                  value={filters.category}
                  onChange={(e) => setFilters({...filters, category: e.target.value})}
                  className="filter-select"
                >
                  <option value="all">All Categories</option>
                  <option value="lost">Lost</option>
                  <option value="found">Found</option>
                </select>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                  className="filter-select"
                >
                  <option value="open">Open Only</option>
                  <option value="claimed">Claimed</option>
                  <option value="all">All Status</option>
                </select>
                <button onClick={applyFilters} className="filter-btn">
                  <FiFilter /> Apply
                </button>
                <button onClick={resetFilters} className="filter-btn reset">
                  Reset
                </button>
              </div>
            </div>
            
            <div className="reports-grid">
              {loading ? (
                <div className="loading">Loading reports...</div>
              ) : filteredReports.length === 0 ? (
                <div className="empty-state">No reports found</div>
              ) : (
                filteredReports.map(report => (
                  <div 
                    key={report._id} 
                    id={`report-${report._id}`}
                    className={`report-card ${report.category} ${report.status}`}
                  >
                    <div className="card-header">
                      <h3>{report.itemName}</h3>
                      <div className="card-badges">
                        <span className={`category-badge ${report.category}`}>
                          {report.category}
                        </span>
                        <span className={`status-badge ${report.status}`}>
                          {report.status}
                        </span>
                      </div>
                    </div>
                    
                    <p className="card-description">{report.description}</p>
                    
                    {report.imageUrl && (
                      <img
                        src={report.imageUrl}
                        alt={report.itemName}
                        className="card-image"
                        onClick={() => window.open(report.imageUrl, '_blank')}
                      />
                    )}
                    
                    <div className="card-details">
                      <div className="detail-item">
                        <span className="label">📍 Location:</span>
                        <span className="value">{report.lat?.toFixed(4)}, {report.lng?.toFixed(4)}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">📞 Contact:</span>
                        <span className="value">{report.contact || "Not provided"}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">📅 Date:</span>
                        <span className="value">{new Date(report.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="card-actions">
                      <button
                        onClick={() => {
                          if (mapRef.current) {
                            mapRef.current.setView([report.lat, report.lng], 18);
                            // Fetch recommendations when viewing on map
                            fetchRecommendations(report._id);
                          }
                        }}
                        className="action-btn view-on-map"
                      >
                        View on Map
                      </button>
                      <button
                        onClick={() => handleClaim(report._id)}
                        disabled={report.status === "claimed"}
                        className={`action-btn claim-btn ${report.status === "claimed" ? "disabled" : ""}`}
                      >
                        {report.status === "claimed" ? "✓ Claimed" : "Mark as Claimed"}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          {/* Recommendations Section */}
          <div className="recommendations-section">
            <div className="section-header">
              <h2>Suggested Matches</h2>
              <div className="section-tabs">
                <button 
                  className={`tab-btn ${activeRecommendationTab === "nearby" ? "active" : ""}`}
                  onClick={() => setActiveRecommendationTab("nearby")}
                >
                  Nearby ({matches.length})
                </button>
                <button 
                  className={`tab-btn ${activeRecommendationTab === "image" ? "active" : ""}`}
                  onClick={() => setActiveRecommendationTab("image")}
                >
                  Image Similarity ({recommendations.length})
                </button>
              </div>
            </div>
            
            <div className="matches-container">
              {activeRecommendationTab === "nearby" ? (
                matches.length === 0 ? (
                  <div className="empty-matches">
                    {selectedLocation ? "No matches found within selected radius" : "Select a location to see nearby matches"}
                  </div>
                ) : (
                  <div className="matches-list">
                    {matches.map(match => (
                      <div key={match._id} className="match-card">
                        <div className="match-header">
                          <h4>{match.itemName}</h4>
                          <span className="match-score">
                            {Math.round((match.combinedScore || match.score || 0) * 100)}% match
                          </span>
                        </div>
                        <p className="match-description">{match.description}</p>
                        <div className="match-details">
                          <span>📍 {match.distance}m away</span>
                          <span className={`match-category ${match.category}`}>
                            {match.category}
                          </span>
                        </div>
                        <div className="match-actions">
                          <button
                            onClick={() => {
                              if (mapRef.current) {
                                mapRef.current.setView([match.lat, match.lng], 18);
                              }
                            }}
                            className="match-btn"
                          >
                            View on Map
                          </button>
                          <button
                            onClick={() => handleClaim(match._id)}
                            className="match-btn claim"
                          >
                            Claim
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                recommendations.length === 0 ? (
                  <div className="empty-matches">
                    <p>Click on any report on the map or in the list to find image-based matches</p>
                    <p><small>💡 The system compares images to find visual matches</small></p>
                  </div>
                ) : (
                  <div className="matches-list">
                    {recommendations.map(rec => (
                      <div key={rec._id} className="match-card">
                        <div className="match-header">
                          <h4>{rec.itemName}</h4>
                          <span className="similarity-badge">
                            {Math.round((rec.similarity || 0) * 100)}% similar
                          </span>
                        </div>
                        {rec.imageUrl && (
                          <img
                            src={rec.imageUrl}
                            alt={rec.itemName}
                            className="match-image"
                          />
                        )}
                        <p className="match-description">{rec.description}</p>
                        <div className="match-details">
                          <span>📍 Similarity: {Math.round((rec.similarity || 0) * 100)}%</span>
                          <span className={`match-category ${rec.category}`}>
                            {rec.category}
                          </span>
                        </div>
                        <div className="match-actions">
                          <button
                            onClick={() => handleClaim(rec._id)}
                            className="match-btn claim"
                          >
                            Claim
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
            
            {/* Nearby Reports Summary */}
            {nearbyReports.length > 0 && (
              <div className="nearby-summary">
                <h4>📌 Nearby Reports ({nearbyReports.length})</h4>
                <div className="nearby-items">
                  {nearbyReports.slice(0, 5).map(report => (
                    <div key={report._id} className="nearby-item">
                      <span className="nearby-name">{report.itemName}</span>
                      <span className="nearby-distance">{report.distance}m</span>
                      <span className={`nearby-category ${report.category}`}>
                        {report.category}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Stats Footer */}
      <footer className="stats-footer">
        <div className="footer-content">
          <div className="stat-box">
            <div className="stat-icon">
              <FiAlertCircle />
            </div>
            <div className="stat-info">
              <h3 className="stat-number">{stats.total}</h3>
              <p className="stat-label">Total Reports</p>
            </div>
          </div>
          
          <div className="stat-box">
            <div className="stat-icon">
              <FiCheckCircle />
            </div>
            <div className="stat-info">
              <h3 className="stat-number">{stats.resolved}</h3>
              <p className="stat-label">Resolved</p>
            </div>
          </div>
          
          <div className="stat-box">
            <div className="stat-icon">
              <FiClock />
            </div>
            <div className="stat-info">
              <h3 className="stat-number">{stats.pending}</h3>
              <p className="stat-label">Pending</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}