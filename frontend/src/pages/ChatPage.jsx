
import React, { useEffect, useState } from "react";
import { ChatData } from "../context/ChatContext";
import axios from "axios";
import { FaSearch } from "react-icons/fa";
import Chat from "../components/chat/Chat";
import MessageContainer from "../components/chat/MessageContainer";
import { SocketData } from "../context/SocketContext";

const ChatPage = ({ user }) => {
  const { createChat, selectedChat, setSelectedChat, chats, setChats } = ChatData();
  const { onlineUsers } = SocketData();
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState(false);

  async function fetchAllUsers() {
    try {
      const { data } = await axios.get("/api/user/all?search=" + query);
      setUsers(data);
    } catch (error) {
      console.log(error);
    }
  }

  const getAllChats = async () => {
    try {
      const { data } = await axios.get("/api/messages/chats");
      setChats(data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchAllUsers();
  }, [query]);

  useEffect(() => {
    getAllChats();
  }, []);

  async function createNewChat(id) {
    await createChat(id);
    setSearch(false);
    getAllChats();
  }

  return (
    <div className="w-full md:max-w-5xl mx-auto p-4 pt-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-md p-4 h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Chats</h2>
            <button
              className="bg-blue-500 text-white px-3 py-1 rounded-full"
              onClick={() => setSearch(!search)}
            >
              {search ? "X" : <FaSearch />}
            </button>
          </div>
          {search ? (
            <div className="space-y-3">
              <input
                type="text"
                className="w-full border border-gray-300 rounded-md p-2"
                placeholder="Search users..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <div className="space-y-2">
                {users && users.length > 0 ? (
                  users.map((e) => (
                    <div
                      key={e._id}
                      onClick={() => createNewChat(e._id)}
                      className="cursor-pointer flex items-center gap-3 p-2 rounded-md hover:bg-gray-100"
                    >
                      <img src={e.profilePic.url} className="w-9 h-9 rounded-full" alt="" />
                      <p className="text-sm font-medium">{e.name}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No users found</p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {chats.map((e) => (
                <Chat
                  key={e._id}
                  chat={e}
                  setSelectedChat={setSelectedChat}
                  isOnline={onlineUsers.includes(e.users[0]._id)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="md:col-span-2 bg-white rounded-xl shadow-md p-4 h-[80vh]">
          {selectedChat === null ? (
            <div className="h-full flex items-center justify-center text-gray-500 text-xl">
              Hello 👋 {user.name}, select a chat to start conversation
            </div>
          ) : (
            <MessageContainer selectedChat={selectedChat} setChats={setChats} />
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
