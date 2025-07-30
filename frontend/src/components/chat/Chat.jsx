import React from "react";
import { UserData } from "../../context/UserContext";

const Chat = ({ chat, setSelectedChat, isOnline }) => {
  const { user: currentUser } = UserData();

  // Find the other user (not the current logged-in user)
  const otherUser = chat.users.find((u) => u._id !== currentUser._id);

  const isLastMessageFromOtherUser =
    chat.latestMessage?.sender !== currentUser._id;

  return (
    <div
      className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-md cursor-pointer"
      onClick={() => setSelectedChat(chat)}
    >
      <div className="relative">
        <img
          src={otherUser.profilePic.url}
          alt="profile"
          className="w-10 h-10 rounded-full"
        />
        {isOnline && (
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
        )}
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-medium">{otherUser.name}</span>
        {chat.latestMessage && (
          <span
            className={`text-xs truncate max-w-[180px] ${
              isLastMessageFromOtherUser
                ? "font-bold text-black"
                : "text-gray-500"
            }`}
          >
            {chat.latestMessage.text}
          </span>
        )}
      </div>
    </div>
  );
};

export default Chat;
