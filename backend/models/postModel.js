import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
  caption: String,

  post: {
    id: String,
    url: String,
  },

  type: {
    type: String,
    required: true,           // “post”, “reel” or “popular”
  },

  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  anonymousOrder: {
    type: Number,
    default: null,            // will hold 1,2,3… for “popular” posts
  },
  tokensAwarded: {
    type: Number,
    default: 0,               // counts likes given on a “popular” post
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },

  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],

  comments: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      name: {
        type: String,
        required: true,
      },
      comment: {
        type: String,
        required: true,
      },
    },
  ],
});

export const Post = mongoose.model("Post", postSchema);
