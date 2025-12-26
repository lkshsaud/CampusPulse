import React from "react";
import { FiSearch, FiFilter, FiMapPin, FiCheckCircle } from "react-icons/fi";

const ReportsList = ({ 
  reports = [], 
  filters = {}, 
  onFiltersChange, 
  onClaim,
  onViewOnMap 
}) => {
  const handleClaim = async (reportId) => {
    if (!window.confirm("Are you sure you want to mark this as claimed?")) return;
    
    try {
      const response = await fetch(`/api/reports/${reportId}/claim`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });
      
      if (response.ok) {
        alert("✅ Report marked as claimed!");
        if (onClaim) onClaim();
      } else {
        alert("Failed to claim report");
      }
    } catch (error) {
      console.error("Error claiming report:", error);
      alert("Error claiming report");
    }
  };

  const handleFilterChange = (key, value) => {
    if (onFiltersChange) {
      onFiltersChange({ ...filters, [key]: value });
    }
  };

  const resetFilters = () => {
    if (onFiltersChange) {
      onFiltersChange({ search: "", category: "all", status: "open" });
    }
  };

  const applyFilters = () => {
    if (onClaim) onClaim(); // Refreshes the reports list
  };

  // Filter reports based on current filters
  const filteredReports = reports.filter(report => {
    const searchTerm = filters.search.toLowerCase();
    const matchesSearch = 
      report.itemName.toLowerCase().includes(searchTerm) ||
      (report.description && report.description.toLowerCase().includes(searchTerm));
    
    const matchesCategory = filters.category === "all" || report.category === filters.category;
    const matchesStatus = filters.status === "all" || report.status === filters.status;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="search-section">
      <div className="section-header">
        <h2><FiSearch /> Search Reports</h2>
        <div className="filters">
          <input
            type="text"
            placeholder="Search by name or description..."
            value={filters.search || ""}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            className="search-input"
          />
          
          <select
            value={filters.category || "all"}
            onChange={(e) => handleFilterChange("category", e.target.value)}
            className="filter-select"
          >
            <option value="all">All Categories</option>
            <option value="lost">Lost</option>
            <option value="found">Found</option>
          </select>
          
          <select
            value={filters.status || "open"}
            onChange={(e) => handleFilterChange("status", e.target.value)}
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
        {filteredReports.length === 0 ? (
          <div className="empty-state">
            <FiSearch className="empty-icon" />
            <p>No reports found</p>
            <p className="hint">Try changing your search filters</p>
          </div>
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
                    {report.category === "lost" ? "🔴 Lost" : "🟢 Found"}
                  </span>
                  <span className={`status-badge ${report.status}`}>
                    {report.status === "open" ? "⏳ Open" : "✅ Claimed"}
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
                  <span className="value">
                    {new Date(report.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              
              <div className="card-actions">
                <button
                  onClick={() => onViewOnMap && onViewOnMap(report)}
                  className="action-btn view-on-map"
                >
                  <FiMapPin /> View on Map
                </button>
                
                <button
                  onClick={() => handleClaim(report._id)}
                  disabled={report.status === "claimed"}
                  className={`action-btn claim-btn ${report.status === "claimed" ? "disabled" : ""}`}
                >
                  <FiCheckCircle /> 
                  {report.status === "claimed" ? "Claimed" : "Mark as Claimed"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ReportsList;