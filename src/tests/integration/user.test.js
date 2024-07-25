const request = require('supertest');
const mongoose = require('mongoose');
const User = require('../../models/user');
let server;

const userPayload = {
  register: {
    invalid: { name: '', email: 'A', password: 'A' },
    filled: { name: 'John', email: 'john@john.com', password: 'jonhspwd' },
  },
  login: {
    invalid: { email: '', password: 'A' },
    filled: { email: 'john@john.com', password: 'jonhspwd' },
    incorrect: { email: 'john@john.com', password: 'jonh123' },
    wrongEmail: { email: 'john123@john.com', password: 'jonhspwd' }
  }
};

describe('/api/auth', () => {
  beforeAll(() => {
    server = require('../../index');
  });

  afterAll(async () => {
    await server.close();
    await mongoose.connection.close();
  });

  afterEach(async () => {
    // reset mocks
    jest.restoreAllMocks();

    await User.deleteMany({});
  });

  /*
    /api/auth/register route
      [x] - 1. Handle error 500
      [x] - 2. Verify if email, name or password is missing or invalid
      [x] - 3. Check if user exists
      [x] - 4. Successfully register
  */
  describe('/register', () => {
    it('should handle error 500', async () => {
      jest.spyOn(User, 'findOne').mockImplementation(() => {
        throw new Error('Test server error (POST /auth/register)');
      });

      const res = await request(server)
        .post('/api/auth/register')
        .send(userPayload.register.filled);

      expect(res.status).toBe(500);
    });

    it('should return 400 on missing or invalid inputs', async () => {
      const res = await request(server)
        .post('/api/auth/register')
        .send(userPayload.register.invalid);

      expect(res.status).toBe(400);
    });

    it('should return 400 if user already exists', async () => {
      await request(server)
        .post('/api/auth/register')
        .send(userPayload.register.filled);

      const res = await request(server)
        .post('/api/auth/register')
        .send(userPayload.register.filled);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('msg');
    });

    it('should return 200 and a token if user is registered successfully', async () => {
      const res = await request(server)
        .post('/api/auth/register')
        .send(userPayload.register.filled);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
    });
  });

  /*
    /api/auth/login route
      [x] - 1. Handle error 500
      [x] - 1. Verify if email or password is missing or invalid
      [x] - 2. Check if user exists
      [x] - 3. Validate credentials
      [x] - 4. Successfully log-in
  */
  describe('/login', () => {
    beforeEach(async () => {
      await request(server)
        .post('/api/auth/register')
        .send(userPayload.register.filled);
    });

    it('should handle error 500', async () => {
      jest.spyOn(User, 'findOne').mockImplementation(() => {
        throw new Error('Test server error (POST /auth/login)');
      });

      const res = await request(server)
        .post('/api/auth/login')
        .send(userPayload.login.filled);

      expect(res.status).toBe(500);
    });

    // email or password is missing or invalid
    it('should return 400 on missing or invalid inputs', async () => {
      const res = await request(server)
        .post('/api/auth/login')
        .send(userPayload.login.invalid);

      expect(res.status).toBe(400);
    });

    // wrong email
    it('should return 404 if user does\'t exist', async () => {
      const res = await request(server)
        .post('/api/auth/login')
        .send(userPayload.login.wrongEmail);

      expect(res.status).toBe(404);
    });

    // email exists, wrong password
    it('should return 400 if login is incorrect', async () => {
      const res = await request(server)
        .post('/api/auth/login')
        .send(userPayload.login.incorrect);

      expect(res.status).toBe(400);
    });

    // email and password match
    it('should return 200 and a token if credentials are valid', async () => {
      const res = await request(server)
        .post('/api/auth/login')
        .send(userPayload.login.filled);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
    });
  });
});