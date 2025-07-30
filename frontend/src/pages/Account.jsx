import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserData } from "../context/UserContext";
import { PostData } from "../context/PostContext";
import PostCard from "../components/PostCard";
import { FaArrowDownLong, FaArrowUp } from "react-icons/fa6";
import Modal from "../components/Modal";
import axios from "axios";
import { Loading } from "../components/Loading";
import { CiEdit } from "react-icons/ci";
import toast from "react-hot-toast";

const Account = ({ user }) => {
  const navigate = useNavigate();
  const { logoutUser, updateProfilePic, updateProfileName } = UserData();
  const { posts, reels, loading } = PostData();

  // Filter user's posts and reels
  const myPosts = posts?.filter((post) => post.owner._id === user._id) || [];
  const myReels = reels?.filter((reel) => reel.owner._id === user._id) || [];

  const [type, setType] = useState("post");
  const [index, setIndex] = useState(0);
  const [show, setShow] = useState(false);
  const [show1, setShow1] = useState(false);
  const [followersData, setFollowersData] = useState([]);
  const [followingsData, setFollowingsData] = useState([]);
  const [file, setFile] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [name, setName] = useState(user.name || "");
  const [showUpdatePass, setShowUpdatePass] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const prevReel = () => index > 0 && setIndex(index - 1);
  const nextReel = () => index < myReels.length - 1 && setIndex(index + 1);

  const logoutHandler = () => logoutUser(navigate);

  async function followData() {
    try {
      const { data } = await axios.get("/api/user/followdata/" + user._id);
      setFollowersData(data.followers);
      setFollowingsData(data.followings);
    } catch (error) {
      console.log(error);
    }
  }

  const changeFileHandler = (e) => setFile(e.target.files[0]);

  const changleImageHandler = () => {
    const formdata = new FormData();
    formdata.append("file", file);
    updateProfilePic(user._id, formdata, setFile);
  };

  const UpdateName = () => updateProfileName(user._id, name, setShowInput);

  async function updatePassword(e) {
    e.preventDefault();
    try {
      const { data } = await axios.post("/api/user/" + user._id, {
        oldPassword,
        newPassword,
      });
      toast.success(data.message);
      setOldPassword("");
      setNewPassword("");
      setShowUpdatePass(false);
    } catch (error) {
      toast.error(error.response.data.message);
    }
  }

  useEffect(() => {
    followData();
  }, [user]);

  return (
    <div className="bg-gray-100 min-h-screen flex flex-col items-center py-6">
      {loading ? (
        <Loading />
      ) : (
        <div className="w-full max-w-md space-y-4 px-4">
          {/* Profile Card - matches post width */}
          <div className="bg-white rounded-lg shadow-md p-6 w-full">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Profile Picture Section */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <img
                    src={user.profilePic.url}
                    alt="Profile"
                    className="w-20 h-20 rounded-full object-cover border-2 border-blue-100"
                  />
                  <label className="absolute bottom-0 right-0 bg-blue-500 text-white p-1 rounded-full cursor-pointer hover:bg-blue-600">
                    <input
                      type="file"
                      className="hidden"
                      onChange={changeFileHandler}
                      accept="image/*"
                    />
                    <CiEdit size={16} />
                  </label>
                </div>
                <button
                  onClick={changleImageHandler}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                  disabled={!file}
                >
                  Update
                </button>
              </div>

              {/* Profile Info Section */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {showInput ? (
                    <div className="flex items-center gap-2">
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        required
                      />
                      <button
                        onClick={UpdateName}
                        className="bg-green-500 text-white px-2 py-1 rounded text-sm"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <>
                      <h2 className="text-lg font-semibold">{user.name}</h2>
                      <button
                        onClick={() => setShowInput(true)}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <CiEdit size={18} />
                      </button>
                    </>
                  )}
                </div>

                <p className="text-gray-600 text-sm mb-1">{user.email}</p>
                <p className="text-gray-600 text-sm mb-3 capitalize">{user.gender}</p>

                <div className="flex gap-4 mb-3">
                  <button
                    onClick={() => setShow(true)}
                    className="text-sm hover:text-blue-500"
                  >
                    <span className="font-medium">{user.followers.length}</span> followers
                  </button>
                  <button
                    onClick={() => setShow1(true)}
                    className="text-sm hover:text-blue-500"
                  >
                    <span className="font-medium">{user.followings.length}</span> following
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowUpdatePass(!showUpdatePass)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                  >
                    {showUpdatePass ? "Cancel" : "Password"}
                  </button>
                  <button
                    onClick={logoutHandler}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>

            {/* Password Update Form */}
            {showUpdatePass && (
              <div className="mt-4 pt-4 border-t">
                <form onSubmit={updatePassword} className="space-y-2">
                  <input
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Old Password"
                    required
                  />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="New Password"
                    required
                  />
                  <button
                    type="submit"
                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm w-full"
                  >
                    Update Password
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Posts/Reels Toggle - matches post width */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden w-full">
            <div className="flex border-b">
              <button
                onClick={() => setType("post")}
                className={`flex-1 py-3 text-sm font-medium ${type === "post" ? "text-blue-500 border-b-2 border-blue-500" : "text-gray-500"}`}
              >
                Posts ({myPosts.length})
              </button>
              <button
                onClick={() => setType("reel")}
                className={`flex-1 py-3 text-sm font-medium ${type === "reel" ? "text-blue-500 border-b-2 border-blue-500" : "text-gray-500"}`}
              >
                Reels ({myReels.length})
              </button>
            </div>
          </div>

          {/* Content Section */}
          <div className="space-y-4 w-full">
            {type === "post" ? (
              myPosts.length > 0 ? (
                myPosts.map((post) => (
                  <PostCard type="post" value={post} key={post._id} />
                ))
              ) : (
                <div className="bg-white rounded-lg shadow-md p-6 text-center">
                  <p className="text-gray-500 text-sm">No posts yet</p>
                </div>
              )
            ) : myReels.length > 0 ? (
              <div className="relative">
                <PostCard type="reel" value={myReels[index]} key={myReels[index]._id} />
                <div className="absolute right-[-50px] top-1/2 transform -translate-y-1/2 flex flex-col gap-3">
                  {index > 0 && (
                    <button
                      onClick={prevReel}
                      className="bg-gray-500 hover:bg-gray-600 text-white p-2 rounded-full transition"
                    >
                      <FaArrowUp size={14} />
                    </button>
                  )}
                  {index < myReels.length - 1 && (
                    <button
                      onClick={nextReel}
                      className="bg-gray-500 hover:bg-gray-600 text-white p-2 rounded-full transition"
                    >
                      <FaArrowDownLong size={14} />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <p className="text-gray-500 text-sm">No reels yet</p>
              </div>
            )}
          </div>

          {/* Modals */}
          {show && (
            <Modal
              value={followersData}
              title="Followers"
              setShow={setShow}
            />
          )}
          {show1 && (
            <Modal
              value={followingsData}
              title="Following"
              setShow={setShow1}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default Account;