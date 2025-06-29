// The server should run on localhost port 8000.
// This is where you should start writing server-side code for this application.
// startServer() is a function that starts the server
// the server will listen on .env.CLIENT_URL if set, otherwise 8000
import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { Server } from 'socket.io';
import * as http from 'http';

import answerController from './controllers/answer.controller';
import questionController from './controllers/question.controller';
import tagController from './controllers/tag.controller';
import commentController from './controllers/comment.controller';
import { FakeSOSocket } from './types/types';
import userController from './controllers/user.controller';
import messageController from './controllers/message.controller';

dotenv.config();

const MONGO_URL = `${process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017'}/fake_so`;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';
const port = parseInt(process.env.PORT || '8000');

const app = express();

let server: http.Server | undefined;
let socket: FakeSOSocket;

if (process.env.NODE_ENV !== 'test') {
  // Only create server and socket in non-test environment
  server = http.createServer(app);
  socket = new Server(server, {
    cors: { origin: '*' },
  });

  socket.on('connection', socket => {
    console.log('A user connected ->', socket.id);

    socket.on('disconnect', () => {
      console.log('User disconnected');
    });
  });

  process.on('SIGINT', async () => {
    await mongoose.disconnect();
    socket.close();
    server?.close(() => {
      console.log('Server closed.');
      process.exit(0);
    });
  });
} else {
  // Create mock socket for test environment
  socket = {
    emit: jest.fn(),
    on: jest.fn(),
    close: jest.fn(),
  } as unknown as FakeSOSocket;
}

function connectDatabase() {
  return mongoose.connect(MONGO_URL).catch(err => console.log('MongoDB connection error: ', err));
}

function startServer() {
  connectDatabase();
  server?.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

app.use(
  cors({
    credentials: true,
    origin: [CLIENT_URL],
  }),
);

app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('hello world');
  res.end();
});

app.use('/question', questionController(socket));
app.use('/tag', tagController());
app.use('/answer', answerController(socket));
app.use('/comment', commentController(socket));
app.use('/messaging', messageController(socket));
app.use('/user', userController());

// Export the app instance
export { app, server, startServer };
