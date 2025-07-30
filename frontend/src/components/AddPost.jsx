import React, { useState } from "react";
import { PostData } from "../context/PostContext";
import { LoadingAnimation } from "./Loading";
import { UserData } from "../context/UserContext";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { SocketData } from "../context/SocketContext";

const AddPost = ({ type }) => {
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState("");
  const [filePrev, setFilePrev] = useState("");
  const { user } = UserData();
  const { addPost, addLoading } = PostData();
  const { onlineUsers } = SocketData();

  const formatDate = format(new Date(), "MMMM do");

  const changeFileHandler = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.readAsDataURL(file);

    reader.onloadend = () => {
      setFilePrev(reader.result);
      setFile(file);
    };
  };

  const submitHandler = (e) => {
    e.preventDefault();
    const formdata = new FormData();
    formdata.append("caption", caption);
    formdata.append("file", file);
    addPost(formdata, setFile, setCaption, setFilePrev, type);
  };

  return (
    <div className="bg-gray-100 flex items-center justify-center pt-3 pb-4">
      <div className="bg-gradient-to-br from-white to-blue-50 p-8 rounded-xl shadow-lg max-w-md w-full border border-blue-100">
        <div className="flex items-center justify-between mb-4">
          <Link
            className="flex items-center space-x-2"
            to={`/user/${user._id}`}
          >
            <img
              src={user.profilePic?.url || "default-profile.png"}
              alt="profile"
              className="w-8 h-8 rounded-full"
            />
            {onlineUsers.includes(user._id) && (
              <div className="text-5xl font-bold text-green-400">.</div>
            )}
            <div>
              <p className="text-gray-800 font-semibold">{user.name}</p>
              <div className="text-gray-500 text-sm">{formatDate}</div>
            </div>
          </Link>
        </div>

        <form onSubmit={submitHandler}>
          <textarea
            className="w-full p-3 rounded-lg bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-200 text-lg placeholder-gray-500 resize-none shadow-sm"
            placeholder={`What's on your mind, ${user.name.split(' ')[0]}?`}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows="3"
          />

          {filePrev && (
            <div className="mt-3 mb-4 relative">
              {type === "post" ? (
                <img 
                  src={filePrev} 
                  alt="preview" 
                  className="w-full max-h-96 object-contain rounded-md border border-gray-300"
                />
              ) : (
                <video
                  controlsList="nodownload"
                  controls
                  src={filePrev}
                  className="w-full max-h-96 rounded-md border border-gray-300"
                />
              )}
              <button 
                type="button"
                onClick={() => {
                  setFilePrev("");
                  setFile("");
                }}
                className="absolute top-2 right-2 bg-gray-800 bg-opacity-70 text-white rounded-full p-1 hover:bg-red-500 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}

          <div className="border-t pt-3 flex justify-between items-center">
            <label className="flex items-center space-x-1 text-gray-600 cursor-pointer hover:bg-blue-100 px-2 py-1 rounded transition">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="font-medium">Photo/Video</span>
              <input 
                type="file" 
                className="hidden" 
                accept={type === "post" ? "image/*" : "video/*"}
                onChange={changeFileHandler}
                required={!caption.trim()}
              />
            </label>

            <button
              disabled={addLoading || (!caption.trim() && !file)}
              className={`px-4 py-2 rounded-md transition-all duration-150 ${
                addLoading || (!caption.trim() && !file)
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700 shadow"
              }`}
            >
              {addLoading ? <LoadingAnimation /> : "Post"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPost;
