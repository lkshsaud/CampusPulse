import React, { useState } from "react";
import AddPost from "../components/AddPost";
import { PostData } from "../context/PostContext";
import PostCard from "../components/PostCard";
import { FaArrowUp, FaArrowDownLong } from "react-icons/fa6";
import { Loading } from "../components/Loading";

const Reels = () => {
  const { reels, loading } = PostData();
  const [index, setIndex] = useState(0);

  const prevReel = () => {
    if (index === 0) return;
    setIndex(index - 1);
  };

  const nextReel = () => {
    if (index === reels.length - 1) return;
    setIndex(index + 1);
  };

  return (
    <>
      {loading ? (
        <Loading />
      ) : (
        <div className="bg-gray-100 min-h-screen">
          <div className="max-w-md mx-auto">
            <AddPost type="reel" />
            
            <div className="flex flex-col items-center gap-4 pb-8">
              {reels && reels.length > 0 ? (
                <div className="relative w-full">
                  <PostCard
                    key={reels[index]._id}
                    value={reels[index]}
                    type={"reel"}
                  />
                  
                  <div className="absolute right-[-60px] top-1/2 transform -translate-y-1/2 flex flex-col gap-6">
                    {index !== 0 && (
                      <button
                        className="bg-gray-500 text-white p-3 rounded-full hover:bg-gray-600 transition"
                        onClick={prevReel}
                      >
                        <FaArrowUp />
                      </button>
                    )}
                    {index !== reels.length - 1 && (
                      <button
                        className="bg-gray-500 text-white p-3 rounded-full hover:bg-gray-600 transition"
                        onClick={nextReel}
                      >
                        <FaArrowDownLong />
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-center py-8">No reels yet</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Reels;