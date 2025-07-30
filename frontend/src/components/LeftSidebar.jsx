import React from "react";
import { Link } from "react-router-dom";

const LeftSidebar = () => {
  return (
    <div className="w-full p-4 bg-white rounded-md shadow-md">
      <h2 className="text-lg font-bold text-gray-800 mb-2">Explore Our Community</h2>
      <p className="text-sm text-gray-500 mb-4">See what's trending in the community</p>
      <div className="flex flex-col gap-2">
        <Link
          to="/popular-opinion"
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          🔥 Popular Opinion
        </Link>
        <Link
          to="/helpful-hand"
          className="text-green-600 hover:text-green-800 font-medium"
        >
          🤝 Helpful Hand
        </Link>
        <Link
          to="/leaderboard"
          className="text-purple-600 hover:text-purple-800 font-medium"
        >
          🏆 Leaderboard
        </Link>
      </div>
    </div>
  );
};

export default LeftSidebar;
