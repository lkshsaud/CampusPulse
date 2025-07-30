import React, { useEffect, useState } from "react";
import axios from "axios";

const Leaderboard = () => {
  const [leaders, setLeaders] = useState([]);

  useEffect(() => {
    axios.get("/api/user/leaderboard").then(res => setLeaders(res.data));
  }, []);

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Leaderboard</h2>
      <ol className="space-y-2">
        {leaders.map((u, i) => (
          <li key={u._id} className="flex justify-between">
            <span>{i + 1}. {u.name || u.username}</span>
            <span>{u.tokens}</span>
          </li>
        ))}
      </ol>
    </div>
  );
};

export default Leaderboard;
