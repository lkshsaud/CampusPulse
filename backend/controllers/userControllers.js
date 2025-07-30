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

// ─── 7) Get 7‑day rolling leaderboard ───────────────────────────────
export const getWeeklyLeaderboard = TryCatch(async (req, res) => {
  // 1. Date 7 days ago
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // 2. Aggregate popular posts in last week by owner
  const leaderboard = await Post.aggregate([
    { $match: { type: "popular", createdAt: { $gte: weekAgo } } },
    { $group: { _id: "$owner", tokens: { $sum: "$tokensAwarded" } } },
    { $sort: { tokens: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "userInfo"
      }
    },
    { $unwind: "$userInfo" },
    {
      $project: {
        _id: 0,
        userId: "$_id",
        name: "$userInfo.name",
        tokens: 1
      }
    }
  ]);

  // 3. Compute current user's tokens in last week
  const yourTokensResult = await Post.aggregate([
    { $match: { type: "popular", createdAt: { $gte: weekAgo }, owner: req.user._id } },
    { $group: { _id: null, tokens: { $sum: "$tokensAwarded" } } }
  ]);
  const yourTokens = yourTokensResult[0]?.tokens || 0;

  // 4. Send response
  res.json({ leaderboard, yourTokens });
});
