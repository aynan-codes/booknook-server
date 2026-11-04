import { Request, Response, NextFunction } from "express";

export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
  userName?: string;
}

export const verifyToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const cookie = req.headers.cookie;

    if (!cookie) {
      res.status(401).json({
        success: false,
        message: "Please login first.",
      });
      return;
    }

    const betterAuthUrl = process.env.BETTER_AUTH_URL;

    if (!betterAuthUrl) {
      console.error("BETTER_AUTH_URL is missing");

      res.status(500).json({
        success: false,
        message: "Authentication configuration error.",
      });
      return;
    }

    const response = await fetch(
      `${betterAuthUrl}/api/auth/get-session`,
      {
        method: "GET",
        headers: {
          cookie,
        },
      }
    );

    if (!response.ok) {
      res.status(401).json({
        success: false,
        message: "Invalid or expired session.",
      });
      return;
    }

    const data = await response.json();

    if (!data?.user?.id || !data?.user?.email) {
      res.status(401).json({
        success: false,
        message: "Please login first.",
      });
      return;
    }

    req.userId = data.user.id;
    req.userEmail = data.user.email;
    req.userName = data.user.name || "";

    next();
  } catch (error) {
    console.error("Better Auth session verification error:", error);

    res.status(500).json({
      success: false,
      message: "Authentication verification failed.",
    });
  }
};