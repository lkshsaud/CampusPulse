import React from "react";

const Message = ({ ownMessage, message }) => {
  return (
    <div className={`flex ${ownMessage ? "justify-end" : "justify-start"}`}>
      <div
        className={`px-4 py-2 rounded-lg max-w-[75%] ${
          ownMessage ? "bg-blue-500 text-white" : "bg-gray-200 text-black"
        }`}
      >
        {message}
      </div>
    </div>
  );
};

export default Message;
