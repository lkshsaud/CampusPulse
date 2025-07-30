import React from "react";
import AddPost from "../components/AddPost";
import PostCard from "../components/PostCard";
import { PostData } from "../context/PostContext";
import { Loading } from "../components/Loading";
import LeftSidebar from "../components/LeftSidebar";
import Contacts from "../components/Contacts";

const Home = () => {
  const { posts, loading } = PostData();

  return (
    <>
      {loading ? (
        <Loading />
      ) : (
        <div className="flex justify-center gap-6 px-4 pt-4">
          {/* Left Sidebar */}
          <div className="w-1/4 hidden lg:block">
            <LeftSidebar />
          </div>

          {/* Main Feed */}
          <div className="w-full max-w-2xl">
            <AddPost type="post" />
            {posts && posts.length > 0 ? (
              posts.map((e) => <PostCard value={e} key={e._id} type="post" />)
            ) : (
              <p className="text-center text-gray-500">No Post Yet</p>
            )}
          </div>

          {/* Contacts */}
          <div className="w-1/4 hidden lg:block">
            <Contacts />
          </div>
        </div>
      )}
    </>
  );
};

export default Home;
