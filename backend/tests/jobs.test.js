import request from "supertest";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { app } from "../server.js";
import { jest } from '@jest/globals';
import User from "../src/models/User.js";
import Job from "../src/models/job.js";

describe("Jobs Routes", () => {
  const testEmail = "alumni-job-poster@example.com";
  let token;
  let userId;

  beforeAll(async () => {
    // Clear collections
    await User.deleteMany({ email: testEmail });
    await Job.deleteMany({ company: "Test Company LLC" });

    // Create an alumni user capable of posting jobs
    const user = await User.create({
      name: "Alumni Job Poster",
      email: testEmail,
      password: "password123",
      role: "alumni",
      verified: true
    });

    userId = user._id;

    // Generate valid JWT token
    token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    await User.deleteMany({ email: testEmail });
    await Job.deleteMany({ company: "Test Company LLC" });
    await mongoose.connection.close();
  });

  describe("POST /api/jobs", () => {
    it("should successfully create a new job if user is alumni", async () => {
      const res = await request(app)
        .post("/api/jobs")
        .set("Authorization", `Bearer ${token}`)
        .send({
          title: "Junior Developer",
          company: "Test Company LLC",
          location: "Remote",
          type: "Full-time",
          description: "This is a great starting role requiring knowledge of React and Node.",
          requirements: ["React", "Node"]
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toBeDefined();
      expect(res.body.title).toBe("Junior Developer");
      expect(res.body.company).toBe("Test Company LLC");
    });

    it("should fail to create a job without authorization", async () => {
      const res = await request(app)
        .post("/api/jobs")
        .send({
          title: "Senior Developer",
          company: "Test Company LLC",
          description: "Missing auth header"
        });

      expect(res.statusCode).toBe(401);
    });

    it("should fail validation if required fields are missing", async () => {
      const res = await request(app)
        .post("/api/jobs")
        .set("Authorization", `Bearer ${token}`)
        .send({
          company: "Test Company LLC",
          // missing title and description
        });

      expect(res.statusCode).toBe(400); // Zod validation should catch this
    });
  });

  describe("GET /api/jobs", () => {
    it("should list active jobs", async () => {
      const res = await request(app).get("/api/jobs?limit=10");
      
      expect(res.statusCode).toBe(200);
      expect(res.body.items).toBeDefined();
      expect(Array.isArray(res.body.items)).toBeTruthy();
      
      // Because we inserted a job in the previous block, it should be listed.
      const foundJob = res.body.items.find(j => j.company === "Test Company LLC");
      expect(foundJob).toBeDefined();
    });
  });
});
