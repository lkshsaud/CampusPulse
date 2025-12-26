import React, { useState } from "react";
import { FiSearch, FiFilter, FiMapPin, FiCheckCircle, FiExternalLink } from "react-icons/fi";

const ReportsList = ({ 
  reports = [], 
  filters = {}, 
  onFiltersChange, 
  onClaim,
  onViewOnMap,
  userToken = null
}) => {
  const [claimingId, setClaimingId] = useState(null);
  const [expandedReport, setExpandedReport] = useState(null);

  const handleClaim = async (reportId) => {
    if (!window.confirm("Are you sure you want to mark this as claimed? This action cannot be undone.")) return;
    
    setClaimingId(reportId);
    
    try {
      const token = userToken || localStorage.getItem("token");
      const response = await fetch(`/api/reports/${reportId}/claim`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert("✅ Report marked as claimed!");
        if (onClaim) onClaim();
      } else {
        alert(`Failed to claim report: ${data.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error claiming report:", error);
      alert("Error claiming report. Please try again.");
    } finally {
      setClaimingId(null);
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
    if (onClaim) onClaim();
  };

  const handleViewOnMap = (report) => {
    if (onViewOnMap) {
      onViewOnMap(report);
      
      // Scroll to top of page if needed
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // Highlight the report card
      const reportCard = document.getElementById(`report-${report._id}`);
      if (reportCard) {
        reportCard.classList.add('highlighted');
        setTimeout(() => {
          reportCard.classList.remove('highlighted');
        }, 2000);
      }
    }
  };

  const toggleExpandReport = (reportId) => {
    setExpandedReport(expandedReport === reportId ? null : reportId);
  };

  // Filter reports based on current filters
  const filteredReports = reports.filter(report => {
    const searchTerm = (filters.search || "").toLowerCase();
    const matchesSearch = 
      report.itemName?.toLowerCase().includes(searchTerm) ||
      (report.description && report.description.toLowerCase().includes(searchTerm));
    
    const matchesCategory = filters.category === "all" || report.category === filters.category;
    const matchesStatus = filters.status === "all" || report.status === filters.status;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="search-section">
      <div className="section-header">
        <h2><FiSearch /> Search Reports ({filteredReports.length})</h2>
        <div className="filters">
          <input
            type="text"
            placeholder="Search by name or description..."
            value={filters.search || ""}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            className="search-input"
            onKeyPress={(e) => e.key === 'Enter' && applyFilters()}
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
          
          <button onClick={applyFilters} className="filter-btn apply">
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
            <p>No reports found matching your criteria</p>
            <p className="hint">Try changing your search filters</p>
            <button onClick={resetFilters} className="btn btn-primary">
              Reset Filters
            </button>
          </div>
        ) : (
          filteredReports.map(report => (
            <div 
              key={report._id} 
              id={`report-${report._id}`}
              className={`report-card ${report.category} ${report.status} ${expandedReport === report._id ? 'expanded' : ''}`}
              onClick={() => toggleExpandReport(report._id)}
            >
              <div className="card-header">
                <h3>
                  {report.itemName}
                  {report.similarity && (
                    <span className="similarity-badge">
                      {Math.round(report.similarity * 100)}% Match
                    </span>
                  )}
                </h3>
                <div className="card-badges">
                  <span className={`category-badge ${report.category}`}>
                    {report.category === "lost" ? "🔴 Lost" : "🟢 Found"}
                  </span>
                  <span className={`status-badge ${report.status}`}>
                    {report.status === "open" ? "⏳ Open" : "✅ Claimed"}
                  </span>
                </div>
              </div>
              
              <p className="card-description">
                {expandedReport === report._id 
                  ? report.description || "No description provided"
                  : (report.description?.substring(0, 100) || "No description provided") + 
                    (report.description?.length > 100 ? "..." : "")}
                {report.description?.length > 100 && (
                  <span className="read-more">
                    {expandedReport === report._id ? " Read less" : " Read more"}
                  </span>
                )}
              </p>
              
              {report.imageUrl && (
                <div className="card-image-container">
                  <img
                    src={report.imageUrl}
                    alt={report.itemName}
                    className="card-image"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(report.imageUrl, '_blank');
                    }}
                    title="Click to view full image"
                  />
                  <button 
                    className="view-image-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(report.imageUrl, '_blank');
                    }}
                  >
                    <FiExternalLink /> View Full Image
                  </button>
                </div>
              )}
              
              <div className="card-details">
                <div className="detail-item">
                  <span className="label">📍 Location:</span>
                  <span className="value">
                    {report.lat?.toFixed(4)}, {report.lng?.toFixed(4)}
                    {report.distance && (
                      <span className="distance"> ({Math.round(report.distance)}m away)</span>
                    )}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="label">📞 Contact:</span>
                  <span className="value">
                    {report.contact || "Not provided"}
                    {report.contact && (
                      <a 
                        href={`tel:${report.contact}`}
                        className="contact-link"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Call
                      </a>
                    )}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="label">📅 Date:</span>
                  <span className="value">
                    {new Date(report.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                {report.owner?.name && (
                  <div className="detail-item">
                    <span className="label">👤 Reported by:</span>
                    <span className="value">{report.owner.name}</span>
                  </div>
                )}
              </div>
              
              <div className="card-actions" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => handleViewOnMap(report)}
                  className="action-btn view-on-map"
                  title="Center map on this location"
                >
                  <FiMapPin /> View on Map
                </button>
                
                <button
                  onClick={() => handleClaim(report._id)}
                  disabled={report.status === "claimed" || claimingId === report._id}
                  className={`action-btn claim-btn ${report.status === "claimed" || claimingId === report._id ? "disabled" : ""}`}
                  title={report.status === "claimed" ? "Already claimed" : "Mark as claimed"}
                >
                  {claimingId === report._id ? (
                    <>⏳ Processing...</>
                  ) : report.status === "claimed" ? (
                    <>✅ Claimed</>
                  ) : (
                    <><FiCheckCircle /> Mark as Claimed</>
                  )}
                </button>
              </div>
              
              {report.status === "claimed" && report.claimedBy && (
                <div className="claimed-info">
                  <p>✅ Claimed by: {report.claimedBy.name || "Anonymous"}</p>
                  <p>📅 Claimed on: {new Date(report.claimedAt).toLocaleDateString()}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ReportsList;