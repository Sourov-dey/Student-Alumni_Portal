import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { io, httpServer } from '../server.js';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  if (mongoose.connection) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
  
  if (io) {
    io.close();
  }
  if (httpServer) {
    httpServer.close();
  }
});
// Only initialize and terminate the connection
// Delegate data tear-downs to independent tests
