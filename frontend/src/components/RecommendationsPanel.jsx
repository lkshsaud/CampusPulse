import React, { useState } from "react";
import { FiSearch } from "react-icons/fi";

const RecommendationsPanel = ({ 
  matches = [], 
  recommendations = [], 
  nearbyReports = [],
  onClaim 
}) => {
  const [activeTab, setActiveTab] = useState("nearby");

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

  return (
    <div className="recommendations-section">
      <div className="section-header">
        <h2>Suggested Matches</h2>
        <div className="section-tabs">
          <button 
            className={`tab-btn ${activeTab === "nearby" ? "active" : ""}`}
            onClick={() => setActiveTab("nearby")}
          >
            Nearby ({matches.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === "image" ? "active" : ""}`}
            onClick={() => setActiveTab("image")}
          >
            Image Similarity ({recommendations.length})
          </button>
        </div>
      </div>
      
      <div className="matches-container">
        {activeTab === "nearby" ? (
          matches.length === 0 ? (
            <div className="empty-matches">
              <FiSearch className="empty-icon" />
              <p>No matches found</p>
              <p className="hint">Select a location and item category to see matches</p>
            </div>
          ) : (
            <div className="matches-list">
              {matches.map(match => (
                <div key={match._id} className="match-card">
                  <div className="match-header">
                    <h4>{match.itemName}</h4>
                    <span className="match-score">
                      {Math.round((match.combinedScore || 0) * 100)}% match
                    </span>
                  </div>
                  
                  <p className="match-description">{match.description}</p>
                  
                  {match.imageUrl && (
                    <img
                      src={match.imageUrl}
                      alt={match.itemName}
                      className="match-image"
                      onClick={() => window.open(match.imageUrl, '_blank')}
                    />
                  )}
                  
                  <div className="match-details">
                    <span className="distance">
                      📍 {match.distance || 0}m away
                    </span>
                    <span className={`category ${match.category}`}>
                      {match.category}
                    </span>
                  </div>
                  
                  <div className="match-actions">
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
              <div className="empty-icon">🖼️</div>
              <p>No image matches found</p>
              <p className="hint">Click on any report marker to find similar images</p>
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
                      onClick={() => window.open(rec.imageUrl, '_blank')}
                    />
                  )}
                  
                  <p className="match-description">{rec.description}</p>
                  
                  <div className="match-details">
                    <span>Image Similarity: {Math.round((rec.imageSimilarity || 0) * 100)}%</span>
                    <span className={`category ${rec.category}`}>
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
  );
};

export default RecommendationsPanel;