import React, { useState } from "react";
import { ChatData } from "../../context/ChatContext.jsx";
import toast from "react-hot-toast";
import axios from "axios";

const MessageInput = ({ setMessages, selectedChat }) => {
  const [textMsg, setTextMsg] = useState("");
  const { setChats } = ChatData();

  const handleMessage = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post("/api/messages", {
        message: textMsg,
        recieverId: selectedChat.users[0]._id,
      });

      setMessages((prev) => [...prev, data]);
      setTextMsg("");

      setChats((prev) =>
        prev.map((chat) =>
          chat._id === selectedChat._id
            ? {
                ...chat,
                latestMessage: {
                  text: textMsg,
                  sender: data.sender,
                },
              }
            : chat
        )
      );
    } catch (error) {
      toast.error(error.response.data.message);
    }
  };

  return (
    <form onSubmit={handleMessage} className="flex gap-2 items-center">
      <input
        type="text"
        placeholder="Type a message..."
        className="flex-grow border border-gray-300 rounded-lg p-2"
        value={textMsg}
        onChange={(e) => setTextMsg(e.target.value)}
        required
      />
      <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-lg">
        Send
      </button>
    </form>
  );
};

export default MessageInput;
