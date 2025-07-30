import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { UserData } from "../context/UserContext";
import { SocketData } from "../context/SocketContext";

const Contacts = () => {
  const { user } = UserData();
  const { onlineUsers } = SocketData();
  const [contacts, setContacts] = useState([]);

  useEffect(() => {
    const fetchFollowData = async () => {
      try {
        const { data } = await axios.get(`/api/user/followdata/${user._id}`);
        const uniqueContacts = [
          ...new Map(
            [...data.followers, ...data.followings].map((u) => [u._id, u])
          ).values(),
        ];
        setContacts(uniqueContacts);
      } catch (error) {
        console.error("Failed to fetch contacts:", error);
      }
    };

    fetchFollowData();
  }, [user._id]);

  return (
    <div className="w-64 bg-white shadow-md rounded-lg p-4">
      <h2 className="text-lg font-bold mb-4">Contacts</h2>
      <div className="space-y-4">
        {contacts.length === 0 ? (
          <p className="text-gray-500">No contacts to show</p>
        ) : (
          contacts.map((contact) => (
            <Link
              key={contact._id}
              to={`/user/${contact._id}`}
              className="flex items-center gap-3 hover:bg-gray-100 p-2 rounded-lg transition"
            >
              <div className="relative">
                <img
                  src={contact.profilePic.url}
                  alt={contact.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                {onlineUsers.includes(contact._id) && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                )}
              </div>
              <p className="text-sm font-medium">{contact.name}</p>
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

export default Contacts;
