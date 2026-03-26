import request from "supertest";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { app } from "../server.js";
import User from "../src/models/User.js";
import Otp from "../src/models/Otp.js";
import { jest } from '@jest/globals';

// Mock fetch for reCAPTCHA
global.fetch = jest.fn();

describe("Auth Routes", () => {
  const testEmail = "testuser@example.com";
  const testPassword = "password123";
  const testOtp = "123456";

  beforeAll(async () => {
    // Clear user and OTP collections before tests
    await User.deleteMany({ email: testEmail });
    await Otp.deleteMany({ email: testEmail });
  });

  afterAll(async () => {
    await User.deleteMany({ email: testEmail });
    await Otp.deleteMany({ email: testEmail });
    await mongoose.connection.close();
  });

  describe("POST /api/auth/signup", () => {
    it("should register a user when valid data and OTP is provided", async () => {
      // 1. Manually insert an OTP into the database
      const salt = await bcrypt.genSalt(10);
      const hashedOtp = await bcrypt.hash(testOtp, salt);
      
      await Otp.create({
        email: testEmail,
        otp: hashedOtp,
        createdAt: new Date()
      });

      // 2. Call the signup endpoint
      const res = await request(app)
        .post("/api/auth/signup")
        .send({
          name: "Test User",
          email: testEmail,
          password: testPassword,
          role: "student",
          otp: testOtp
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe("User registered successfully");
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe(testEmail);
    });

    it("should fail signup if OTP is invalid", async () => {
      // Create another fresh OTP
      const salt = await bcrypt.genSalt(10);
      const hashedOtp = await bcrypt.hash("654321", salt);
      
      await Otp.create({
        email: "failuser@example.com",
        otp: hashedOtp,
        createdAt: new Date()
      });

      const res = await request(app)
        .post("/api/auth/signup")
        .send({
          name: "Fail User",
          email: "failuser@example.com",
          password: "password123",
          role: "student",
          otp: "wrongotp"
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe("Invalid OTP");
      
      await User.deleteMany({ email: "failuser@example.com" });
    });
  });

  describe("POST /api/auth/login", () => {
    it("should login a user with correct credentials and captcha", async () => {
      // Mock successful ReCAPTCHA verification
      global.fetch.mockResolvedValueOnce({
        json: async () => ({ success: true })
      });

      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: testEmail,
          password: testPassword,
          captchaToken: "mock-captcha-token"
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe("Login successful");
      expect(res.body.token).toBeDefined();
    });

    it("should fail login with wrong credentials", async () => {
      global.fetch.mockResolvedValueOnce({
        json: async () => ({ success: true })
      });

      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: testEmail,
          password: "wrongpassword",
          captchaToken: "mock-captcha-token"
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toBe("Invalid email or password");
    });
  });
});
