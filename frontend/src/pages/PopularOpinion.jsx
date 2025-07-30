import React, { useEffect, useState } from "react";
import axios from "axios";

const PopularOpinion = () => {
  const [caption, setCaption] = useState("");
  const [posts, setPosts] = useState([]);

  const fetchPopular = async () => {
    const { data } = await axios.get("/api/popular");
    setPosts(data);
  };

  useEffect(() => { fetchPopular(); }, []);

  const submit = async () => {
    await axios.post("/api/popular/new", { caption });
    setCaption("");
    fetchPopular();
  };

  const likePost = async (id) => {
    await axios.post(`/api/popular/${id}/like`);
    fetchPopular();
  };

  return (
    <div className="p-4">
      <div className="mb-4 p-4 bg-white rounded shadow">
        <textarea
          placeholder="Post anonymously..."
          value={caption}
          onChange={e => setCaption(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <button onClick={submit} className="mt-2 px-4 py-2 bg-blue-500 text-white rounded">
          Post
        </button>
      </div>
      <div className="space-y-4">
        {posts.map((p, i) => (
          <div key={p._id} className="bg-white p-4 rounded shadow">
            <p className="text-sm text-gray-500">Anonymous {i + 1}</p>
            <p className="mb-2">{p.caption}</p>
            <div className="flex items-center gap-2">
              <button onClick={() => likePost(p._id)} className="text-blue-500">
                👍 {p.likes.length}
              </button>
              <button className="text-gray-500">💬 {p.comments.length}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PopularOpinion;
