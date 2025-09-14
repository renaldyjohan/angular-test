import { Request, Response, NextFunction } from "express";

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  const statusCode = err.status || 500;

  console.error("Error:", err);

  res.status(statusCode).json({
    success: false,
    code: statusCode,
    message: err.message || "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err.stack : undefined
  });
}
