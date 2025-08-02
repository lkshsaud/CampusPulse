import { Post } from "../models/postModel.js";
import { User } from "../models/userModel.js";

export const createPopular = async (req, res) => {
  try {
    const count = await Post.countDocuments({ type: "popular" });
    const post = await Post.create({
      caption: req.body.caption,
      post: req.body.post || {},
      owner: req.user._id,
      type: "popular",
      anonymousOrder: count + 1
    });
    res.status(201).json(post);
  } catch (err) {
    console.error("Error in createPopular:", err);
    res.status(500).json({ message: "Error creating popular post", error: err.message });
  }
};

export const getPopular = async (req, res) => {
  try {
    const posts = await Post.find({ type: "popular" })
      .sort({ anonymousOrder: 1 })
      .lean();
    res.json(posts);
  } catch (err) {
    console.error("Error in getPopular:", err);
    res.status(500).json({ message: "Error fetching popular posts", error: err.message });
  }
};

export const likePopular = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const userId = req.user._id.toString();
    const hasLiked = post.likes.map(id => id.toString()).includes(userId);

    if (hasLiked) {
      post.likes = post.likes.filter(id => id.toString() !== userId);
      post.tokensAwarded = Math.max(0, post.tokensAwarded - 1);
      await post.save();

      await User.findByIdAndUpdate(post.owner, { $inc: { tokens: -1 } });
    } else {
      post.likes.push(req.user._id);
      post.tokensAwarded += 1;
      await post.save();

      await User.findByIdAndUpdate(post.owner, { $inc: { tokens: 1 } });
    }

    res.json(post);
  } catch (err) {
    console.error("Error in likePopular:", err);
    res.status(500).json({ message: "Error toggling like", error: err.message });
  }
};

export const commentPopular = async (req, res) => {
  try {
    const { comment } = req.body;
    if (!comment?.trim()) {
      return res.status(400).json({ message: "Comment cannot be empty" });
    }
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    post.comments.push({
      user: req.user._id,
      name: req.user.name,
      comment: comment.trim()
    });

    await post.save();
    res.status(200).json(post);
  } catch (err) {
    console.error("Error in commentPopular:", err);
    res.status(500).json({ message: "Error commenting on post", error: err.message });
  }
};
