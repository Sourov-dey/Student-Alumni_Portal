import request from "supertest";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { app } from "../server.js";
import User from "../src/models/User.js";
import Job from "../src/models/job.js";
import Application from "../src/models/application.js";

describe("Applications Routes", () => {
  const studentEmail = "student-app@example.com";
  const alumniEmail = "alumni-job@example.com";
  
  let studentToken, alumniToken;
  let studentId, alumniId;
  let jobId;
  let applicationId;

  beforeAll(async () => {
    // Clear collections
    await User.deleteMany({ email: { $in: [studentEmail, alumniEmail] } });
    await Job.deleteMany({ company: "Applications Corp" });
    await Application.deleteMany({});

    // Create Student
    const student = await User.create({
      name: "Student Applicant",
      email: studentEmail,
      password: "password123",
      role: "student",
      verified: true
    });
    studentId = student._id;
    studentToken = jwt.sign(
      { id: student._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );

    // Create Alumni
    const alumni = await User.create({
      name: "Alumni Recruiter",
      email: alumniEmail,
      password: "password123",
      role: "alumni",
      verified: true
    });
    alumniId = alumni._id;
    alumniToken = jwt.sign(
      { id: alumni._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );

    // Create Job by Alumni
    const job = await Job.create({
      title: "Internship Developer",
      company: "Applications Corp",
      description: "Come apply for this awesome internship.",
      postedBy: alumniId
    });
    jobId = job._id;
  });

  afterAll(async () => {
    await User.deleteMany({ email: { $in: [studentEmail, alumniEmail] } });
    await Job.deleteMany({ company: "Applications Corp" });
    await Application.deleteMany({});
    await mongoose.connection.close();
  });

  describe("POST /api/applications", () => {
    it("should successfully apply for a job as a student", async () => {
      // Create a mock PDF buffer
      const mockPdfBuffer = Buffer.from("%PDF-1.4 mock pdf content");
      
      const res = await request(app)
        .post("/api/applications")
        .set("Authorization", `Bearer ${studentToken}`)
        .field("jobId", jobId.toString())
        .field("coverLetter", "This is my cover letter!")
        .field("contactNumber", "1234567890")
        .attach("resume", mockPdfBuffer, "resume.pdf");

      expect(res.statusCode).toBe(201);
      expect(res.body).toBeDefined();
      expect(res.body.job.toString()).toBe(jobId.toString());
      
      // Save for next tests
      applicationId = res.body._id;
    });

    it("should fail to apply if role is not student", async () => {
      const res = await request(app)
        .post("/api/applications")
        .set("Authorization", `Bearer ${alumniToken}`)
        .field("jobId", jobId.toString())
        .field("coverLetter", "Trying as alumni")
        .field("contactNumber", "1234567890")
        .attach("resume", Buffer.from("pdf"), "resume.pdf");

      expect(res.statusCode).toBe(403);
    });
  });

  describe("GET /api/applications/job/:jobId", () => {
    it("should fetch applications for a job if requester is alumni", async () => {
      const res = await request(app)
        .get(`/api/applications/job/${jobId}`)
        .set("Authorization", `Bearer ${alumniToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.items).toBeDefined();
      expect(res.body.items.length).toBeGreaterThan(0);
      expect(res.body.items[0].student.email).toBe(studentEmail);
    });
  });

  describe("PATCH /api/applications/:id/status", () => {
    it("should update application status as an alumni", async () => {
      const res = await request(app)
        .patch(`/api/applications/${applicationId}/status`)
        .set("Authorization", `Bearer ${alumniToken}`)
        .send({
          status: "shortlisted"
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe("shortlisted");
    });
    
    it("should fail validation if status is unknown", async () => {
      const res = await request(app)
        .patch(`/api/applications/${applicationId}/status`)
        .set("Authorization", `Bearer ${alumniToken}`)
        .send({
          status: "magical_status"
        });

      expect(res.statusCode).toBe(400);
    });
  });
});
