import { Router } from "express";

import {
  registerUser,
  loginUser,
  getMyProfile,
  updateMyProfile,
  setPassword,
} from "../controllers/auth.controller";

import { googleLogin } from "../controllers/googleAuth.controller";
import { verifyToken } from "../middleware/auth.middleware";

const router = Router();

// Public Routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/google", googleLogin);

// Protected Routes
router.get("/profile", verifyToken, getMyProfile);
router.put("/profile", verifyToken, updateMyProfile);
router.put("/set-password", verifyToken, setPassword);

export default router;