import axios from "axios";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { LoadingAnimation } from "../components/Loading";
import { FaSearch } from "react-icons/fa";

const Search = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  async function fetchUsers() {
    if (!search.trim()) return;
    setLoading(true);
    try {
      const { data } = await axios.get("/api/user/all?search=" + search);
      setUsers(data);
    } catch (error) {
      console.log(error);
    }
    setLoading(false);
  }

  return (
    <div className="bg-gray-100 min-h-screen pt-8 pb-20">
      {/* Search Box */}
      <div className="flex justify-center mb-6">
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-md w-full max-w-md">
          <FaSearch className="text-gray-400 text-lg" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchUsers()}
            className="flex-1 outline-none text-sm"
            placeholder="Search users by name..."
          />
          <button
            onClick={fetchUsers}
            className="text-white bg-blue-500 px-4 py-1 text-sm rounded-full hover:bg-blue-600"
          >
            Search
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="flex flex-col items-center gap-4 px-4">
        {loading ? (
          <LoadingAnimation />
        ) : search.trim() === "" ? (
          <p className="text-gray-400">Type a name and press search</p>
        ) : users.length > 0 ? (
          users.map((user) => (
            <div
              key={user._id}
              className="bg-white w-full max-w-md flex items-center justify-between px-4 py-3 rounded-lg shadow-sm hover:shadow-md transition"
            >
              <Link to={`/user/${user._id}`} className="flex items-center gap-3">
                <img
                  src={user.profilePic.url}
                  alt={user.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <span className="font-medium text-gray-800">{user.name}</span>
              </Link>
              <Link
                to={`/user/${user._id}`}
                className="text-blue-600 text-sm hover:underline"
              >
                View Profile
              </Link>
            </div>
          ))
        ) : (
          <p className="text-gray-500">No users found</p>
        )}
      </div>
    </div>
  );
};

export default Search;
