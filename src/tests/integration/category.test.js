const request = require('supertest');
const mongoose = require('mongoose');
const Category = require('../../models/category');
const User = require('../../models/user');
const { JsonWebTokenError } = require('jsonwebtoken');
let server;

// Dummy data
const categoryPayload = {
  invalid: { title: '' },
  filled: { title: 'Category A' }
};
const invalidCategoryId = '66758fbdf0695012c197a1b6';

const dummyUsers = {
  john: { name: 'John', email: 'john@john.com', password: 'jonhspwd' },
  james: { name: 'James', email: 'james@james.com', password: 'james123' }
};
let dummyUserToken = '';

async function createCategory(userToken, categoryData) {
  const res = await request(server)
    .post('/api/categories')
    .set('x-auth-token', userToken)
    .send(categoryData);

  return res;
}

async function createUser(userData) {
  const res = await request(server)
    .post('/api/auth/register')
    .send(userData);

  return res.body.token;
}

describe('/api/categories', () => {
  beforeAll(async () => {
    server = require('../../index');
  });

  afterAll(async () => {
    await server.close();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // create user
    // generate user token
    dummyUserToken = await createUser(dummyUsers.john);
  });

  afterEach(async () => {
    // reset mocks
    jest.restoreAllMocks();

    await Category.deleteMany({});
    await User.deleteMany({});
  });

  /*
    describe /get/
      [x] - 1. Handle error 500
      [x] - 2. Return status 200 and an array of categories
  */
  describe('GET /', () => {
    it('should handle error 500', async () => {
      jest.spyOn(Category, 'find').mockImplementation(() => {
        throw new Error('Server error');
      });

      const res = await request(server).get('/api/categories');

      expect(res.status).toBe(500);
    });

    it('should return status 200 and all categories', async () => {
      await Category.collection.insertMany([
        { title: 'Category A' },
        { title: 'Category B' },
        { title: 'Category C' }
      ]);

      const res = await request(server).get('/api/categories');

      expect(res.status).toBe(200);
      expect(res.body.categories.length).toBe(3);
    });
  });

  /*
    describe /get/:id
      [x] - 1. Handle error 500
      [x] - 2. Test with an invalid category ID (404)
      [x] - 3. Test with a valid category ID (category object + 200)
  */
  describe('GET :id', () => {
    it('should handle error 500', async () => {
      jest.spyOn(Category, 'findById').mockImplementation(() => {
        throw new Error('Server error');
      });

      const res = await request(server).get('/api/categories/' + '1');

      expect(res.status).toBe(500);
    });

    it('should return 404 if category doesn\'t exist', async () => {
      const res = await request(server)
        .get('/api/categories/' + invalidCategoryId);

      expect(res.status).toBe(404);
    });

    it('should return status 200 and category title if exists', async () => {
      const category = await createCategory(dummyUserToken, { title: 'Category D' });

      const res = await request(server)
        .get('/api/categories/' + category.body.category._id);

      expect(res.status).toBe(200);
      expect(res.body.category.title).toEqual('Category D');
    });
  });

  /*
    describe /post/
      [x] - 1. Handle error 500
      [x] - 2. Test request with missing or invalid data (400)
      [x] - 3. Successfully register a new category (201 + title property)
  */
  describe('POST', () => {
    it('should handle error 500', async () => {
      jest.spyOn(Category.prototype, 'save').mockImplementation(() => {
        throw new Error('Server error');
      });

      const res = await createCategory(dummyUserToken, categoryPayload.filled);

      expect(res.status).toBe(500);
    });

    it('should return 400 on missing or invalid inputs', async () => {
      const res = await createCategory(dummyUserToken, categoryPayload.invalid);

      expect(res.status).toBe(400);
    });

    it('should return status 201 and the created category title', async () => {
      const res = await createCategory(dummyUserToken, categoryPayload.filled);

      expect(res.status).toBe(201);
      expect(res.body.category.title).toEqual(categoryPayload.filled.title);
    });
  });

  /*
    describe /put/:id
      [x] - 1. Handle error 500
      [x] - 2. Test request with missing or invalid data (400)
      [x] - 3. Check if category exists with an invalid ID (404)
      [x] - 4. Check if user is the original poster (403)
      [x] - 5. Successfully update the category (200, title property)
  */
  describe('PUT :id', () => {
    it('should handle error 500', async () => {
      jest.spyOn(Category, 'findByIdAndUpdate').mockImplementation(() => {
        throw new Error('Server error');
      });

      const category = await createCategory(dummyUserToken, categoryPayload.filled);

      const res = await request(server)
        .put('/api/categories/' + category.body.category._id)
        .set('x-auth-token', dummyUserToken)
        .send({ title: 'New Category' });

      expect(res.status).toBe(500);
    });

    it('should return 400 on missing or invalid inputs', async () => {
      const category = await createCategory(dummyUserToken, { title: 'Category D' });

      const res = await request(server)
        .put('/api/categories/' + category.body.category._id)
        .set('x-auth-token', dummyUserToken)
        .send(categoryPayload.invalid);

      expect(res.status).toBe(400);
    });

    it('should return 404 if category doesn\'t exist', async () => {
      const res = await request(server)
        .put('/api/categories/' + invalidCategoryId)
        .set('x-auth-token', dummyUserToken)
        .send(categoryPayload.filled);

      expect(res.status).toBe(404);
    });

    it('should return 403 if user is not the original poster', async () => {
      const category = await createCategory(dummyUserToken, categoryPayload.filled);

      const newUserToken = await createUser(dummyUsers.james);

      const res = await request(server)
        .put('/api/categories/' + category.body.category._id)
        .set('x-auth-token', newUserToken)
        .send({ title: 'New Category' });

      expect(res.status).toBe(403);
    });

    it('should return 200 if the category was updated', async () => {
      const category = await createCategory(dummyUserToken, categoryPayload.filled);

      const res = await request(server)
        .put('/api/categories/' + category.body.category._id)
        .set('x-auth-token', dummyUserToken)
        .send({ title: 'New Category' });

      expect(res.status).toBe(200);
    });
  });

  /*
    describe /delete/:id
      [x] - 1. Handle error 500
      [x] - 2. Check if category exists with an invalid ID (404)
      [x] - 3. Check if user is the original poster (403)
      [x] - 4. Successfully delete the category (200 + title property)
  */
  describe('DELETE :id', () => {
    it('should handle error 500', async () => {
      jest.spyOn(Category, 'findByIdAndDelete').mockImplementation(() => {
        throw new Error('Server error');
      });

      const category = await createCategory(dummyUserToken, categoryPayload.filled);

      const res = await request(server)
        .delete('/api/categories/' + category.body.category._id)
        .set('x-auth-token', dummyUserToken);

      expect(res.status).toBe(500);
    });

    it('should return 404 if category doesn\'t exist', async () => {
      const res = await request(server)
        .delete('/api/categories/' + invalidCategoryId)
        .set('x-auth-token', dummyUserToken);

      expect(res.status).toBe(404);
    });

    it('should return 403 if user is not the original poster', async () => {
      const category = await createCategory(dummyUserToken, categoryPayload.filled);

      const newUserToken = await createUser(dummyUsers.james);

      const res = await request(server)
        .delete('/api/categories/' + category.body.category._id)
        .set('x-auth-token', newUserToken);

      expect(res.status).toBe(403);
    });

    it('should return 200 and the category title if the category was deleted', async () => {
      const category = await createCategory(dummyUserToken, categoryPayload.filled);;

      const res = await request(server)
        .delete('/api/categories/' + category.body.category._id)
        .set('x-auth-token', dummyUserToken);

      expect(res.status).toBe(200);
      expect(res.body.category.title).toEqual(categoryPayload.filled.title);
    });
  });
});