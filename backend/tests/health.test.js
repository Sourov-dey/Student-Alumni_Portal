import request from "supertest";
import mongoose from "mongoose";
import { app } from "../server.js";

describe("GET /api/health", () => {
  it("should return the health status", async () => {
    const res = await request(app).get("/api/health");
    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.service).toBe("au-job-portal-api");
  });
});

afterAll(async () => {
  // Close mongoose connection if it was opened by server.js
  await mongoose.connection.close();
});
