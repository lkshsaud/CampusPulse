import React, { useEffect, useRef, useState } from "react";
import { UserData } from "../../context/UserContext.jsx";
import axios from "axios";
import { LoadingAnimation } from "../Loading.jsx";
import Message from "./Message.jsx";
import MessageInput from "./MessageInput.jsx";
import { SocketData } from "../../context/SocketContext.jsx";

const MessageContainer = ({ selectedChat, setChats }) => {
  const [messages, setMessages] = useState([]);
  const { user } = UserData();
  const [loading, setLoading] = useState(false);
  const { socket } = SocketData();
  const messageContainerRef = useRef(null);

  useEffect(() => {
    socket.on("newMessage", (message) => {
      if (selectedChat._id === message.chatId) {
        setMessages((prev) => [...prev, message]);
      }

      setChats((prev) =>
        prev.map((chat) =>
          chat._id === message.chatId
            ? {
                ...chat,
                latestMessage: {
                  text: message.text,
                  sender: message.sender,
                },
              }
            : chat
        )
      );
    });

    return () => socket.off("newMessage");
  }, [socket, selectedChat, setChats]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("/api/messages/" + selectedChat.users[0]._id);
      setMessages(data);
      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [selectedChat]);

  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 border-b pb-2">
        <img src={selectedChat.users[0].profilePic.url} className="w-10 h-10 rounded-full" alt="" />
        <span className="font-medium">{selectedChat.users[0].name}</span>
      </div>

      {loading ? (
        <LoadingAnimation />
      ) : (
        <>
          <div
            ref={messageContainerRef}
            className="flex flex-col gap-4 flex-grow overflow-y-auto bg-gray-100 p-4 my-2 rounded-md"
          >
            {messages.map((e) => (
              <Message
                key={e._id}
                message={e.text}
                ownMessage={e.sender === user._id}
              />
            ))}
          </div>
          <MessageInput setMessages={setMessages} selectedChat={selectedChat} />
        </>
      )}
    </div>
  );
};

export default MessageContainer;
