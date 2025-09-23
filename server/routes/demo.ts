import { RequestHandler } from "express";
import { DemoResponse } from "@shared/api";

export const handleDemo: RequestHandler = (_req, res) => {
  const response: DemoResponse = {
    message: "Hello from Express server",
    timestamp: new Date().toISOString(),
    data: { version: "1.0", status: "ok" },
  };
  res.status(200).json(response);
};
