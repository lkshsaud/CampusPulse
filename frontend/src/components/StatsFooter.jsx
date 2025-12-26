    import React, { useState, useEffect } from "react";
import { FiAlertCircle, FiCheckCircle, FiClock } from "react-icons/fi";

const StatsFooter = () => {
  const [stats, setStats] = useState({ total: 0, resolved: 0, pending: 0 });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/reports/stats", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  // Animate number counting
  const AnimatedNumber = ({ value }) => {
    const [displayValue, setDisplayValue] = useState(0);
    
    useEffect(() => {
      let start = 0;
      const end = value;
      const duration = 1000; // 1 second
      const increment = end / (duration / 16); // 60fps
      
      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          setDisplayValue(end);
          clearInterval(timer);
        } else {
          setDisplayValue(Math.floor(start));
        }
      }, 16);
      
      return () => clearInterval(timer);
    }, [value]);

    return <span className="animated-number">{displayValue}</span>;
  };

  if (loading) {
    return (
      <footer className="stats-footer loading">
        <div className="footer-content">Loading stats...</div>
      </footer>
    );
  }

  return (
    <footer className="stats-footer">
      <div className="footer-content">
        <div className="stat-box total">
          <div className="stat-icon">
            <FiAlertCircle />
          </div>
          <div className="stat-info">
            <h3 className="stat-number">
              <AnimatedNumber value={stats.total} />
            </h3>
            <p className="stat-label">Total Reports</p>
          </div>
        </div>
        
        <div className="stat-box resolved">
          <div className="stat-icon">
            <FiCheckCircle />
          </div>
          <div className="stat-info">
            <h3 className="stat-number">
              <AnimatedNumber value={stats.resolved} />
            </h3>
            <p className="stat-label">Resolved</p>
          </div>
        </div>
        
        <div className="stat-box pending">
          <div className="stat-icon">
            <FiClock />
          </div>
          <div className="stat-info">
            <h3 className="stat-number">
              <AnimatedNumber value={stats.pending} />
            </h3>
            <p className="stat-label">Pending</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default StatsFooter;