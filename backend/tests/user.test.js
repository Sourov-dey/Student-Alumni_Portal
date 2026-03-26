import request from "supertest";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { app } from "../server.js";
import User from "../src/models/User.js";

describe("User Routes", () => {
  const testEmail1 = "user1@example.com";
  const testEmail2 = "user2@example.com";
  
  let token1, token2;
  let userId1, userId2;

  beforeAll(async () => {
    // Clear collections
    await User.deleteMany({ email: { $in: [testEmail1, testEmail2] } });

    // Create User 1
    const user1 = await User.create({
      name: "Profile User One",
      email: testEmail1,
      password: "password123",
      role: "student",
      bio: "Initial Bio"
    });
    userId1 = user1._id;
    token1 = jwt.sign(
      { id: user1._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );

    // Create User 2 (to test forbidden updates)
    const user2 = await User.create({
      name: "Profile User Two",
      email: testEmail2,
      password: "password123",
      role: "student"
    });
    userId2 = user2._id;
    token2 = jwt.sign(
      { id: user2._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    await User.deleteMany({ email: { $in: [testEmail1, testEmail2] } });
    await mongoose.connection.close();
  });

  describe("GET /api/users/:id", () => {
    it("should successfully fetch a user by ID", async () => {
      const res = await request(app)
        .get(`/api/users/${userId1}`)
        .set("Authorization", `Bearer ${token1}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toBeDefined();
      expect(res.body.email).toBe(testEmail1);
      expect(res.body.bio).toBe("Initial Bio");
      expect(res.body.password).toBeUndefined(); // Password should not be returned
    });

    it("should fail to fetch if not authenticated", async () => {
      const res = await request(app)
        .get(`/api/users/${userId1}`);

      expect(res.statusCode).toBe(401);
    });
  });

  describe("PATCH /api/users/:id", () => {
    it("should successfully update your own profile details", async () => {
      const res = await request(app)
        .patch(`/api/users/${userId1}`)
        .set("Authorization", `Bearer ${token1}`)
        .send({
          bio: "Updated Bio Content",
          location: {
            city: "Silchar",
            country: "India"
          }
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toBeDefined();
      expect(res.body.bio).toBe("Updated Bio Content");
      expect(res.body.location.city).toBe("Silchar");
    });

    it("should fail to update if invalid data types are sent", async () => {
      const res = await request(app)
        .patch(`/api/users/${userId1}`)
        .set("Authorization", `Bearer ${token1}`)
        .send({
          skills: "React" // Needs to be an array according to Zod
        });

      expect(res.statusCode).toBe(400); 
    });

    it("should fail with 403 Forbidden if trying to update another user", async () => {
      // User 2 trying to update User 1's profile
      const res = await request(app)
        .patch(`/api/users/${userId1}`)
        .set("Authorization", `Bearer ${token2}`)
        .send({
          bio: "Hacked Bio"
        });

      expect(res.statusCode).toBe(403);
    });
  });
});
