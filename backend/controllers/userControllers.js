// src/controllers/userControllers.js

import TryCatch from "../utils/Trycatch.js";
import { User } from "../models/userModel.js";
import { Post } from "../models/postModel.js";
import getDataUrl from "../utils/urlGenrator.js";
import cloudinary from "cloudinary";
import bcrypt from "bcrypt";

// 1) Get my profile
export const myProfile = TryCatch(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");
  res.json(user);
});

// 2) Get another user's profile
export const userProfile = TryCatch(async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");
  if (!user) {
    return res.status(404).json({ message: "No User with this id" });
  }
  res.json(user);
});

// 3) Follow / Unfollow a user
export const followandUnfollowUser = TryCatch(async (req, res) => {
  const user = await User.findById(req.params.id);
  const loggedInUser = await User.findById(req.user._id);

  if (!user) {
    return res.status(404).json({ message: "No User with this id" });
  }

  if (user._id.equals(loggedInUser._id)) {
    return res.status(400).json({ message: "You can't follow yourself" });
  }

  if (user.followers.includes(loggedInUser._id)) {
    // Unfollow
    loggedInUser.followings.pull(user._id);
    user.followers.pull(loggedInUser._id);
    await loggedInUser.save();
    await user.save();
    return res.json({ message: "User Unfollowed" });
  } else {
    // Follow
    loggedInUser.followings.push(user._id);
    user.followers.push(loggedInUser._id);
    await loggedInUser.save();
    await user.save();
    return res.json({ message: "User Followed" });
  }
});

// 4) Get followers & followings data
export const userFollowerandFollowingData = TryCatch(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select("-password")
    .populate("followers", "-password")
    .populate("followings", "-password");

  res.json({
    followers: user.followers,
    followings: user.followings,
  });
});

// 5) Update profile (name + picture)
export const updateProfile = TryCatch(async (req, res) => {
  const user = await User.findById(req.user._id);
  const { name } = req.body;
  if (name) user.name = name;

  if (req.file) {
    const fileUrl = getDataUrl(req.file);
    await cloudinary.v2.uploader.destroy(user.profilePic.id);
    const myCloud = await cloudinary.v2.uploader.upload(fileUrl.content);
    user.profilePic = { id: myCloud.public_id, url: myCloud.secure_url };
  }

  await user.save();
  res.json({ message: "Profile updated" });
});

// 6) Update password
export const updatePassword = TryCatch(async (req, res) => {
  const user = await User.findById(req.user._id);
  const { oldPassword, newPassword } = req.body;

  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) {
    return res.status(400).json({ message: "Wrong old password" });
  }

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();
  res.json({ message: "Password Updated" });
});

// ─── 7) Weekly Leaderboard (sort all users by their current tokens) ─────────────────
export const getWeeklyLeaderboard = TryCatch(async (req, res) => {
  // 1) Fetch top 10 users by tokens
  const topUsers = await User.find()
    .sort({ tokens: -1 })
    .limit(10)
    .select("name tokens profilePic");

  // 2) Build leaderboard array
  const leaderboard = topUsers.map((u, idx) => ({
    rank: idx + 1,
    userId: u._id,
    name: u.name,
    tokens: u.tokens,
    profilePic: u.profilePic.url
  }));

  // 3) Get current user's total tokens
  const me = await User.findById(req.user._id).select("tokens");
  const yourTokens = me?.tokens || 0;

  // 4) Respond
  res.json({ leaderboard, yourTokens });
});
