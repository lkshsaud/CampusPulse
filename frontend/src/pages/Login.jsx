import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserData } from "../context/UserContext";
import { PostData } from "../context/PostContext";
import { FaEnvelope, FaLock } from "react-icons/fa";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const { loginUser, loading } = UserData();
  const { fetchPosts } = PostData();

  const submitHandler = (e) => {
    e.preventDefault();
    loginUser(email, password, navigate, fetchPosts);
  };

  return (
    <>
      {loading ? (
        <h1 className="text-center mt-20 text-2xl text-blue-600 font-semibold">
          Loading...
        </h1>
      ) : (
        <div className="flex justify-center items-center min-h-screen bg-gradient-to-tr from-indigo-300 via-blue-100 to-yellow-100 px-4">
          <div className="flex flex-col md:flex-row bg-white bg-opacity-60 backdrop-blur-md shadow-xl rounded-3xl overflow-hidden w-full max-w-5xl">
            {/* Login Left Section */}
            <div className="w-full md:w-1/2 p-8 flex flex-col justify-center items-center">
              <h2 className="text-3xl font-bold text-gray-700 mb-4">
                Welcome Back!
              </h2>
              <p className="text-sm text-gray-600 mb-6 text-center">
                Login to your account to connect with friends and explore more.
              </p>

              <form
                onSubmit={submitHandler}
                className="w-full max-w-xs space-y-5"
              >
                {/* Email Input */}
                <div className="relative">
                  <FaEnvelope className="absolute top-3 left-3 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="Email"
                    className="pl-10 pr-4 py-2 w-full rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                  />
                </div>

                {/* Password Input */}
                <div className="relative">
                  <FaLock className="absolute top-3 left-3 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Password"
                    className="pl-10 pr-4 py-2 w-full rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-200 font-semibold"
                >
                  Login
                </button>
              </form>
            </div>

            {/* Right Section */}
            <div className="w-full md:w-1/2 bg-gradient-to-tr from-blue-400 to-yellow-400 flex flex-col justify-center items-center p-10 text-white text-center">
              <h2 className="text-4xl font-bold mb-4">CampusPulse</h2>
              <p className="text-lg mb-6">
                Join our community and experience the social world.
              </p>
              <Link
                to="/register"
                className="bg-white text-blue-500 px-6 py-2 rounded-full hover:bg-gray-100 transition duration-200 font-medium"
              >
                Create Account
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Login;
