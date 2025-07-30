// src/pages/Leaderboard.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";

export default function Leaderboard() {
  const [leaders, setLeaders] = useState([]);
  const [yourTokens, setYourTokens] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const { data } = await axios.get("/api/user/leaderboard/weekly", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setLeaders(data.leaderboard);
      setYourTokens(data.yourTokens);
    } catch (err) {
      console.error("Failed to fetch leaderboard", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 pb-20 space-y-6">
      {/* Your weekly tokens */}
      <div className="bg-white rounded-xl shadow p-5 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">
            Your Tokens This Week
          </h2>
          <p className="text-4xl font-bold text-blue-600">{yourTokens}</p>
        </div>
        <div className="text-gray-400 text-xs">
          Updated:{" "}
          {new Date().toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric"
          })}
        </div>
      </div>

      {/* Leaderboard Card */}
      <div className="bg-blue-50 rounded-xl shadow-lg p-5">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Top 10 Contributors
        </h2>
        {leaders.length === 0 ? (
          <p className="text-center text-gray-500">No data available.</p>
        ) : (
          <ul className="space-y-3">
            {leaders.map((u, idx) => (
              <li
                key={u.userId}
                className="bg-white rounded-lg p-4 flex justify-between items-center hover:bg-gray-50 transition"
              >
                <div className="flex items-center space-x-3">
                  <div className="text-gray-500 text-sm font-medium w-6">
                    #{idx + 1}
                  </div>
                  <div className="font-semibold text-gray-800">
                    {u.name}
                  </div>
                </div>
                <div className="text-blue-600 font-bold text-lg">
                  {u.tokens}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
