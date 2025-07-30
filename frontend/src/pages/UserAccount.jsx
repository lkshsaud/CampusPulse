import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PostData } from "../context/PostContext";
import PostCard from "../components/PostCard";
import { FaArrowDownLong, FaArrowUp } from "react-icons/fa6";
import axios from "axios";
import { Loading } from "../components/Loading";
import { UserData } from "../context/UserContext";
import Modal from "../components/Modal";
import { SocketData } from "../context/SocketContext";

const UserAccount = ({ user: loggedInUser }) => {
  const navigate = useNavigate();
  const { posts, reels } = PostData();
  const { followUser } = UserData();
  const { onlineUsers } = SocketData();
  const params = useParams();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState("post");
  const [index, setIndex] = useState(0);
  const [followed, setFollowed] = useState(false);
  const [show, setShow] = useState(false);
  const [show1, setShow1] = useState(false);
  const [followersData, setFollowersData] = useState([]);
  const [followingsData, setFollowingsData] = useState([]);

  // Fetch user data
  async function fetchUser() {
    try {
      const { data } = await axios.get("/api/user/" + params.id);
      setUser(data);
      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  }

  // Fetch follow data
  async function followData() {
    try {
      const { data } = await axios.get("/api/user/followdata/" + user._id);
      setFollowersData(data.followers);
      setFollowingsData(data.followings);
    } catch (error) {
      console.log(error);
    }
  }

  // Filter user's posts and reels
  const myPosts = posts?.filter((post) => post.owner._id === user?._id) || [];
  const myReels = reels?.filter((reel) => reel.owner._id === user?._id) || [];

  const prevReel = () => index > 0 && setIndex(index - 1);
  const nextReel = () => index < myReels.length - 1 && setIndex(index + 1);

  const followHandler = () => {
    setFollowed(!followed);
    followUser(user._id, fetchUser);
  };

  useEffect(() => {
    fetchUser();
  }, [params.id]);

  useEffect(() => {
    if (user?.followers?.includes(loggedInUser._id)) setFollowed(true);
  }, [user]);

  useEffect(() => {
    if (user) followData();
  }, [user]);

  if (loading) return <Loading />;
  if (!user) return <div className="text-center py-8">User not found</div>;

  return (
    <div className="bg-gray-100 min-h-screen flex flex-col items-center py-6">
      <div className="w-full max-w-md space-y-4 px-4">
        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow-md p-6 w-full">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Profile Picture */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <img
                  src={user.profilePic.url}
                  alt="Profile"
                  className="w-20 h-20 rounded-full object-cover border-2 border-blue-100"
                />
                {onlineUsers.includes(user._id) && (
                  <div className="absolute top-0 right-0 bg-green-500 text-white text-xs px-1 rounded-full">
                    Online
                  </div>
                )}
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <h2 className="text-lg font-semibold mb-1">{user.name}</h2>
              <p className="text-gray-600 text-sm mb-1">{user.email}</p>
              <p className="text-gray-600 text-sm capitalize mb-3">{user.gender}</p>

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

              {user._id !== loggedInUser._id && (
                <button
                  onClick={followHandler}
                  className={`px-4 py-2 rounded-md text-sm text-white ${
                    followed ? "bg-red-500 hover:bg-red-600" : "bg-blue-500 hover:bg-blue-600"
                  }`}
                >
                  {followed ? "Unfollow" : "Follow"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Posts/Reels Toggle */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden w-full">
          <div className="flex border-b">
            <button
              onClick={() => setType("post")}
              className={`flex-1 py-3 text-sm font-medium ${
                type === "post" ? "text-blue-500 border-b-2 border-blue-500" : "text-gray-500"
              }`}
            >
              Posts ({myPosts.length})
            </button>
            <button
              onClick={() => setType("reel")}
              className={`flex-1 py-3 text-sm font-medium ${
                type === "reel" ? "text-blue-500 border-b-2 border-blue-500" : "text-gray-500"
              }`}
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
    </div>
  );
};

export default UserAccount;