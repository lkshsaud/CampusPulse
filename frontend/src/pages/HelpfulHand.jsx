import React, { useState, useEffect } from "react";
import axios from "axios";
import MapComponent from "../components/Mapcomponent";
import ReportForm from "../components/ReportForm";
import StatsFooter from "../components/StatsFooter";
import RecommendationsPanel from "../components/RecommendationsPanel";
import ReportsList from "../components/ReportsList";
import "../styles/helpful-hand.css";

const HelpfulHand = () => {
  // Main state
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [radius, setRadius] = useState(500);
  const [toast, setToast] = useState("");
  const [activeTab, setActiveTab] = useState("report");
  
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
  
  // Recommendations state
  const [recommendations, setRecommendations] = useState([]);
  const [matches, setMatches] = useState([]);
  const [nearbyReports, setNearbyReports] = useState([]);

  // Filters
  const [filters, setFilters] = useState({
    search: "",
    category: "all",
    status: "open"
  });

  // Show toast message
  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(""), 3000);
  };

  // Fetch all reports
  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/reports", {
        params: filters,
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setReports(response.data);
    } catch (error) {
      console.error("Error fetching reports:", error);
      showToast("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
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
        headers: { 
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
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
      
      // Clear selected location
      setSelectedLocation(null);
      
      // Refresh data
      fetchReports();
      
      // Fetch matches for new location
      if (response.data.report) {
        fetchMatches(response.data.report.lat, response.data.report.lng);
      }
      
    } catch (error) {
      console.error("Error submitting report:", error);
      showToast("Failed to submit report");
    }
  };

  // Fetch matches for location
  const fetchMatches = async (lat, lng) => {
    try {
      const response = await axios.get("/api/reports/matches", {
        params: { 
          lat, 
          lng, 
          category: formData.category, 
          radius,
          itemName: formData.itemName,
          description: formData.description
        },
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
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
        params: { lat, lng, radius },
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setNearbyReports(response.data.reports || []);
    } catch (error) {
      console.error("Error fetching nearby reports:", error);
    }
  };

  // Fetch image recommendations
  const fetchRecommendations = async (reportId) => {
    try {
      const response = await axios.get(`/api/reports/${reportId}/recommendations`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setRecommendations(response.data.recommendations || []);
      showToast(`Found ${response.data.recommendations.length} image matches`);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      showToast("No similar images found");
    }
  };

  // Handle map location selection
  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
    setFormData(prev => ({
      ...prev,
      lat: location.lat,
      lng: location.lng
    }));
    
    // Fetch nearby reports and matches
    fetchNearbyReports(location.lat, location.lng);
    fetchMatches(location.lat, location.lng);
  };

  // Handle marker click
  const handleMarkerClick = (report) => {
    fetchRecommendations(report._id);
  };

  // Remove selected location
  const handleRemoveLocation = () => {
    setSelectedLocation(null);
    setFormData(prev => ({
      ...prev,
      lat: null,
      lng: null
    }));
  };

  // Initialize
  useEffect(() => {
    fetchReports();
    
    // Setup global function for popup buttons
    window.handleMarkerClick = (reportId) => {
      fetchRecommendations(reportId);
    };
    
    return () => {
      delete window.handleMarkerClick;
    };
  }, []);

  return (
    <div className="helpful-hand-container">
      {toast && <div className="toast-message">{toast}</div>}
      
      <header className="helpful-header">
        <div className="header-content">
          <h1>Helpful Hands - KU Campus</h1>
          <p>Lost & Found Reporting System</p>
        </div>
      </header>
      
      <div className="main-content">
        <div className="top-section">
          <MapComponent
            center={[27.6191, 85.5394]}
            zoom={16}
            onLocationSelect={handleLocationSelect}
            onMarkerClick={handleMarkerClick}
            markers={reports.filter(r => r.status === "open")}
            selectedLocation={selectedLocation}
            radius={radius}
            onRadiusChange={setRadius}
            showRemoveButton={!!selectedLocation}
            onRemoveLocation={handleRemoveLocation}
          />
          
          <ReportForm
            formData={formData}
            onChange={setFormData}
            onSubmit={handleSubmit}
            selectedLocation={selectedLocation}
            onRemoveLocation={handleRemoveLocation}
          />
        </div>
        
        <div className="middle-section">
          <ReportsList
            reports={reports}
            filters={filters}
            onFiltersChange={setFilters}
            onClaim={fetchReports}
            onViewOnMap={(report) => {
              handleMarkerClick(report);
              fetchRecommendations(report._id);
            }}
          />
          
          <RecommendationsPanel
            matches={matches}
            recommendations={recommendations}
            nearbyReports={nearbyReports}
            onClaim={fetchReports}
          />
        </div>
      </div>
      
      <StatsFooter />
    </div>
  );
};

export default HelpfulHand;