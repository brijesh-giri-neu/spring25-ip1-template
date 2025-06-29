import supertest from 'supertest';
import mongoose from 'mongoose';
import { app } from '../../app';
import * as util from '../../services/user.service';
import { SafeUser, User } from '../../types/types';

const mockUser: User = {
  _id: new mongoose.Types.ObjectId(),
  username: 'user1',
  password: 'password',
  dateJoined: new Date('2024-12-03'),
};

const mockSafeUser: SafeUser = {
  _id: mockUser._id,
  username: 'user1',
  dateJoined: new Date('2024-12-03'),
};

const mockUserJSONResponse = {
  _id: mockUser._id?.toString(),
  username: 'user1',
  dateJoined: new Date('2024-12-03').toISOString(),
};

let saveUserSpy: jest.SpyInstance;
let loginUserSpy: jest.SpyInstance;
let updatedUserSpy: jest.SpyInstance;
let getUserByUsernameSpy: jest.SpyInstance;
let deleteUserByUsernameSpy: jest.SpyInstance;

describe('Test userController', () => {
  beforeAll(() => {
    saveUserSpy = jest.spyOn(util, 'saveUser');
    loginUserSpy = jest.spyOn(util, 'loginUser');
    updatedUserSpy = jest.spyOn(util, 'updateUser');
    getUserByUsernameSpy = jest.spyOn(util, 'getUserByUsername');
    deleteUserByUsernameSpy = jest.spyOn(util, 'deleteUserByUsername');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });
  
  describe('POST /signup', () => {
    it('should create a new user given correct arguments', async () => {
      const mockReqBody = {
        username: mockUser.username,
        password: mockUser.password,
      };

      saveUserSpy.mockResolvedValueOnce(mockSafeUser);

      const response = await supertest(app).post('/user/signup').send(mockReqBody);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUserJSONResponse);
      expect(saveUserSpy).toHaveBeenCalledWith({ ...mockReqBody, dateJoined: expect.any(Date) });
    });

    it('should return 400 for request missing username', async () => {
      const mockReqBody = {
        password: mockUser.password,
      };

      const response = await supertest(app).post('/user/signup').send(mockReqBody);

      expect(response.status).toBe(400);
      expect(response.text).toEqual('Invalid user body');
    });

    it('should return 400 for request missing password', async () => {
      const mockReqBody = {
        username: mockUser.username,
      };
      const response = await supertest(app).post('/user/signup').send(mockReqBody);
      expect(response.status).toBe(400);
      expect(response.text).toEqual('Invalid user body');
    });

    it('should return 400 for empty string username', async () => {
      const mockReqBody = {
        username: ' ',
        password: mockUser.password,
      };
      const response = await supertest(app).post('/user/signup').send(mockReqBody);
      expect(response.status).toBe(400);
      expect(response.text).toEqual('Invalid user body');
    });

    it('should return 400 for empty string password', async () => {
      const mockReqBody = {
        username: mockUser.username,
        password: ' ',
      };
      const response = await supertest(app).post('/user/signup').send(mockReqBody);
      expect(response.status).toBe(400);
      expect(response.text).toEqual('Invalid user body');
    });

    it('should return 400 if saveUser returns an error', async () => {
      const mockReqBody = {
        username: mockUser.username,
        password: mockUser.password,
      };

      saveUserSpy.mockResolvedValueOnce({ error: 'User already exists' });

      const response = await supertest(app).post('/user/signup').send(mockReqBody);
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'User already exists' });
    });
  });

  describe('POST /login', () => {
    it('should succesfully login for a user given correct arguments', async () => {
      const mockReqBody = {
        username: mockUser.username,
        password: mockUser.password,
      };

      loginUserSpy.mockResolvedValueOnce(mockSafeUser);

      const response = await supertest(app).post('/user/login').send(mockReqBody);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUserJSONResponse);
      expect(loginUserSpy).toHaveBeenCalledWith(mockReqBody);
    });

    it('should return 400 for request missing username', async () => {
      const mockReqBody = {
        password: mockUser.password,
      };

      const response = await supertest(app).post('/user/login').send(mockReqBody);

      expect(response.status).toBe(400);
      expect(response.text).toEqual('Invalid user body');
    });

    it('should return 401 if loginUser returns an error', async () => {
      const mockReqBody = {
        username: mockUser.username,
        password: 'wrongPassword',
      };

      loginUserSpy.mockResolvedValueOnce({ error: 'Invalid credentials' });

      const response = await supertest(app).post('/user/login').send(mockReqBody);
      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: 'Invalid credentials' });
    });
  });

  describe('PATCH /resetPassword', () => {
    it('should succesfully return updated user object given correct arguments', async () => {
      const mockReqBody = {
        username: mockUser.username,
        password: 'newPassword',
      };

      updatedUserSpy.mockResolvedValueOnce(mockSafeUser);

      const response = await supertest(app).patch('/user/resetPassword').send(mockReqBody);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ ...mockUserJSONResponse });
      expect(updatedUserSpy).toHaveBeenCalledWith(mockUser.username, { password: 'newPassword' });
    });

    it('should return 400 for request missing username', async () => {
      const mockReqBody = {
        password: 'newPassword',
      };

      const response = await supertest(app).patch('/user/resetPassword').send(mockReqBody);

      expect(response.status).toBe(400);
      expect(response.text).toEqual('Invalid user body');
    });

    it('should return 400 for request missing password', async () => {
      const mockReqBody = {
        username: mockUser.username,
      };
      const response = await supertest(app).patch('/user/resetPassword').send(mockReqBody);
      expect(response.status).toBe(400);
      expect(response.text).toEqual('Invalid user body');
    });

    it('should return 404 if updateUser returns an error', async () => {
      const mockReqBody = {
        username: 'nonexistentuser',
        password: 'newPassword',
      };

      updatedUserSpy.mockResolvedValueOnce({ error: 'User not found' });
      const response = await supertest(app).patch('/user/resetPassword').send(mockReqBody);
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'User not found' });
    });
  });

  describe('GET /getUser', () => {
    it('should return the user given correct arguments', async () => {
      getUserByUsernameSpy.mockResolvedValueOnce(mockSafeUser);

      const response = await supertest(app).get(`/user/getUser/${mockUser.username}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUserJSONResponse);
      expect(getUserByUsernameSpy).toHaveBeenCalledWith(mockUser.username);
    });

    it('should return 400 if username not provided', async () => {
      const response = await supertest(app).get('/user/getUser/');
      expect(response.status).toBe(400);
    });

    it('should return 404 if getUserByUsername returns an error', async () => {
      getUserByUsernameSpy.mockResolvedValueOnce({ error: 'User not found' });
      const response = await supertest(app).get(`/user/getUser/${mockUser.username}`);

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'User not found' });
    });
  });

  describe('DELETE /deleteUser', () => {
    it('should return the deleted user given correct arguments', async () => {
      deleteUserByUsernameSpy.mockResolvedValueOnce(mockSafeUser);

      const response = await supertest(app).delete(`/user/deleteUser/${mockUser.username}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUserJSONResponse);
      expect(deleteUserByUsernameSpy).toHaveBeenCalledWith(mockUser.username);
    });

    it('should return 400 if username not provided', async () => {
      const response = await supertest(app).delete('/user/deleteUser/');
      expect(response.status).toBe(400);
    });

    it('should return 404 if deleteUserByUsername returns an error', async () => {
      deleteUserByUsernameSpy.mockResolvedValueOnce({ error: 'User not found' });
      const response = await supertest(app).delete(`/user/deleteUser/${mockUser.username}`);

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'User not found' });
    });
  });
});
