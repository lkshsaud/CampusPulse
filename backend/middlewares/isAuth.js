import jwt from "jsonwebtoken";
import { User } from "../models/userModel.js";

export const isAuth = async (req, res, next) => {
  try {
    let token;

    //  First try to get from cookies
    if (req.cookies?.token) {
      token = req.cookies.token;
    }

    //  If not in cookie, try Authorization header
    else if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    // If no token found
    if (!token) return res.status(403).json({ message: "Unauthorized" });

    // Verify token
    const decodedData = jwt.verify(token, process.env.JWT_SEC);
    req.user = await User.findById(decodedData.id);
    next();

  } catch (error) {
    res.status(500).json({
      message: "Please Login",
      error: error.message,
    });
  }
};
