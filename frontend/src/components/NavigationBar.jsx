import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { AiFillHome, AiOutlineHome } from "react-icons/ai";
import { BsCameraReelsFill, BsCameraReels } from "react-icons/bs";
import { IoSearchCircle, IoSearchCircleOutline } from "react-icons/io5";
import {
  IoChatbubbleEllipses,
  IoChatbubbleEllipsesOutline,
} from "react-icons/io5";
import { RiAccountCircleFill, RiAccountCircleLine } from "react-icons/ri";

const NavigationBar = () => {
  const location = useLocation();
  const [tab, setTab] = useState(location.pathname);

  useEffect(() => {
    setTab(location.pathname);
  }, [location.pathname]);

  const navItems = [
    {
      path: "/",
      activeIcon: <AiFillHome />,
      icon: <AiOutlineHome />,
    },
    {
      path: "/reels",
      activeIcon: <BsCameraReelsFill />,
      icon: <BsCameraReels />,
    },
    {
      path: "/search",
      activeIcon: <IoSearchCircle />,
      icon: <IoSearchCircleOutline />,
    },
    {
      path: "/chat",
      activeIcon: <IoChatbubbleEllipses />,
      icon: <IoChatbubbleEllipsesOutline />,
    },
    {
      path: "/account",
      activeIcon: <RiAccountCircleFill />,
      icon: <RiAccountCircleLine />,
    },
  ];

  return (
    <div className="fixed bottom-0 w-full bg-white shadow-md z-50">
      <div className="flex justify-around px-4 py-2">
        {navItems.map(({ path, icon, activeIcon }) => (
          <Link
            to={path}
            key={path}
            className={`group flex flex-col items-center text-xl transition-all ${
              tab === path ? "text-blue-600 scale-110" : "text-gray-500"
            } hover:text-blue-500 hover:scale-110 duration-200`}
          >
            <span>{tab === path ? activeIcon : icon}</span>
            <span
              className={`text-[10px] mt-1 ${
                tab === path ? "block" : "hidden group-hover:block"
              }`}
            >
              {path === "/"
                ? "Home"
                : path === "/reels"
                ? "Reels"
                : path === "/search"
                ? "Search"
                : path === "/chat"
                ? "Chats"
                : "Account"}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default NavigationBar;
