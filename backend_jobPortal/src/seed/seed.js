import 'dotenv/config';
import mongoose from 'mongoose';
import Job from '../models/job.js';

const jobs = [
  {
    title: 'Software Engineer',
    company: 'Infosys',
    location: 'Bengaluru',
    department: 'CSE',
    type: 'Full-time',
    description: 'Work on backend systems using Node.js and MongoDB.',
    requirements: ['Node.js', 'MongoDB', 'Express'],
  },
  {
    title: 'Data Analyst Intern',
    company: 'TCS',
    location: 'Kolkata',
    department: 'IT',
    type: 'Internship',
    description: 'Assist data team with analysis and reporting.',
    requirements: ['Python', 'SQL', 'Excel'],
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✓ MongoDB connected for seeding');

    await Job.deleteMany(); // clear existing jobs
    await Job.insertMany(jobs); // insert sample jobs

    console.log('✓ Jobs seeded successfully');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
