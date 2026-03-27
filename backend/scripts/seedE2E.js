import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load backend logic
import User from '../src/models/User.js';
import Job from '../src/models/job.js';

// Load env relative to backend root
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/student_alumni';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const FRONTEND_E2E_DATA_PATH = path.join(__dirname, '../../frontend/e2e/e2e_data.json');

const ALUMNI_EMAIL = 'e2e_alumni@test.com';
const STUDENT_EMAIL = 'e2e_student@test.com';

async function seedE2E() {
  try {
    console.log(`🔌 Connecting to MongoDB at ${MONGO_URI}`);
    await mongoose.connect(MONGO_URI);
    
    // Clear out any old E2E testing data
    console.log('🧹 Cleaning previous E2E users and their jobs...');
    const oldAlumni = await User.findOne({ email: ALUMNI_EMAIL });
    if (oldAlumni) {
        await Job.deleteMany({ postedBy: oldAlumni._id });
    }
    
    await User.deleteMany({ email: { $in: [ALUMNI_EMAIL, STUDENT_EMAIL] } });

    // Hash dummy password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    // Create E2E Alumni
    const alumni = await User.create({
      name: 'E2E Alumni User',
      email: ALUMNI_EMAIL,
      password: hashedPassword,
      role: 'alumni',
      verified: true
    });

    // Create E2E Student
    const student = await User.create({
      name: 'E2E Student User',
      email: STUDENT_EMAIL,
      password: hashedPassword,
      role: 'student',
      verified: true
    });

    // Generate valid tokens
    const alumniToken = jwt.sign({ id: alumni._id }, JWT_SECRET, { expiresIn: '1h' });
    const studentToken = jwt.sign({ id: student._id }, JWT_SECRET, { expiresIn: '1h' });

    // Format output data matching frontend structure expectations 
    // Usually what authController returns to useAuth() block
    const e2eData = {
      alumni: {
        token: alumniToken,
        user: { _id: alumni._id.toString(), name: alumni.name, email: alumni.email, role: alumni.role }
      },
      student: {
        token: studentToken,
        user: { _id: student._id.toString(), name: student.name, email: student.email, role: student.role }
      }
    };

    // Make sure path exists prior to writing
    if (!fs.existsSync(path.dirname(FRONTEND_E2E_DATA_PATH))) {
      fs.mkdirSync(path.dirname(FRONTEND_E2E_DATA_PATH), { recursive: true });
    }

    fs.writeFileSync(FRONTEND_E2E_DATA_PATH, JSON.stringify(e2eData, null, 2));

    console.log(`✅ Success! Seeded Test Users.`);
    console.log(`📄 Wrote JWT payload mock file to ${FRONTEND_E2E_DATA_PATH}`);
    
    process.exit(0);

  } catch (error) {
    console.error('❌ E2E Seeder Error:', error);
    process.exit(1);
  }
}

seedE2E();
