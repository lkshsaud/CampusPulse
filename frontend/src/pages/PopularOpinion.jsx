import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { IoHeartOutline, IoHeart } from "react-icons/io5";
import { FiSend } from "react-icons/fi";
import { FaUserSecret } from "react-icons/fa";

export default function PopularOpinion() {
  const [caption, setCaption] = useState("");
  const [posts, setPosts] = useState([]);
  const [commentInputs, setCommentInputs] = useState({});
  const textareaRef = useRef(null);

  // Fetch posts on mount
  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const { data } = await axios.get("/api/post/popular", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    });
    setPosts(data);
  };

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = ta.scrollHeight + "px";
    }
  }, [caption]);

  const handlePost = async () => {
    if (!caption.trim()) return;
    await axios.post(
      "/api/post/popular",
      { caption },
      { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
    );
    setCaption("");
    fetchPosts();
  };

  const handleLike = async (id) => {
    await axios.post(
      `/api/post/popular/${id}/like`,
      {},
      { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
    );
    fetchPosts();
  };

  const handleComment = async (id) => {
    const text = commentInputs[id]?.trim();
    if (!text) return;
    await axios.post(
      `/api/post/popular/${id}/comment`,
      { comment: text },
      { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
    );
    setCommentInputs(prev => ({ ...prev, [id]: "" }));
    fetchPosts();
  };

  const userId = localStorage.getItem("userId");

  // color palette for icons
  const colors = ["#EF4444","#3B82F6","#10B981","#8B5CF6","#F59E0B"];

  return (
    <div className="max-w-2xl mx-auto p-4 pb-20 space-y-6">

      {/* Top box: light-blue */}
      <div className="bg-blue-50 rounded-xl shadow p-5">
        <textarea
          ref={textareaRef}
          className="w-full border border-gray-200 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-200 min-h-[4rem] overflow-hidden"
          placeholder="Share your thoughts anonymously..."
          value={caption}
          onChange={e => setCaption(e.target.value)}
        />
        <button
          className="mt-3 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          onClick={handlePost}
        >
          Post
        </button>
      </div>

      {/* Posts (white cards) */}
      {posts.length === 0 ? (
        <p className="text-center text-gray-500">No opinions yet.</p>
      ) : (
        posts.map((p, idx) => {
          const liked = p.likes.map(id => id.toString()).includes(userId);
          // pick color by anonymousOrder or index
          const iconColor = colors[p.anonymousOrder % colors.length];

          return (
            <div
              key={p._id}
              className="bg-white rounded-xl shadow-lg p-5 space-y-4"
            >
              {/* Header with mask icon */}
              <div className="flex items-center space-x-3">
                <FaUserSecret
                  className="text-2xl"
                  style={{ color: iconColor }}
                />
                <div>
                  <div className="font-semibold text-gray-800">
                    Anonymous {p.anonymousOrder}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(p.createdAt).toLocaleDateString(undefined, {
                      month: "long",
                      day: "numeric"
                    })}
                  </div>
                </div>
              </div>

              {/* Caption */}
              <div className="text-gray-900">{p.caption}</div>

              {/* Image, if any */}
              {p.post?.url && (
                <img
                  src={p.post.url}
                  alt=""
                  className="w-full rounded-lg object-cover"
                />
              )}

              {/* Like & comment buttons */}
              <div className="flex items-center space-x-6 text-gray-600">
                <button
                  onClick={() => handleLike(p._id)}
                  className="flex items-center space-x-1 focus:outline-none"
                >
                  {liked ? (
                    <IoHeart className="text-red-500 text-2xl transition-colors" />
                  ) : (
                    <IoHeartOutline className="text-2xl hover:text-red-400 transition-colors" />
                  )}
                  <span className="text-lg">{p.likes.length}</span>
                </button>

                <button
                  onClick={() =>
                    setCommentInputs(prev => ({
                      ...prev,
                      [p._id]: prev[p._id] ?? ""
                    }))
                  }
                  className="flex items-center space-x-1 focus:outline-none"
                >
                  <FiSend className="text-2xl hover:text-blue-500 transition-colors" />
                  <span className="text-lg">{p.comments.length}</span>
                </button>
              </div>

              {/* Comment section */}
              {commentInputs[p._id] !== undefined && (
                <div className="space-y-3">
                  <div className="flex">
                    <input
                      type="text"
                      className="flex-1 p-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
                      placeholder="Add a comment..."
                      value={commentInputs[p._id]}
                      onChange={e =>
                        setCommentInputs(prev => ({
                          ...prev,
                          [p._id]: e.target.value
                        }))
                      }
                    />
                    <button
                      onClick={() => handleComment(p._id)}
                      className="px-4 bg-green-600 text-white rounded-r-lg hover:bg-green-700 transition-colors"
                    >
                      Send
                    </button>
                  </div>

                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {p.comments.map((c, i) => (
                      <div
                        key={i}
                        className="flex items-start space-x-2 text-sm"
                      >
                        <div className="font-semibold text-gray-800">
                          Anonymous
                        </div>
                        <div className="text-gray-700">{c.comment}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
