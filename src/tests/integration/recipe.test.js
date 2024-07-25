const request = require('supertest');
const mongoose = require('mongoose');
let server;

const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../../config/env');

const Recipe = require('../../models/recipe');
const User = require('../../models/user');
const Category = require('../../models/category');

const dummyUsers = {
  john: { name: 'John', email: 'john@john.com', password: 'jonhspwd' },
  james: { name: 'James', email: 'james@james.com', password: 'james123' }
};

const invalidRecipeId = '666af7f6053411440daba697';
const invalidCategoryId = '666bf7f6053411440daba564';
let userToken = '';
let userId = '';
let categoryId = '';

// Create dummy data
async function createUser(userData) {
  const res = await request(server)
    .post('/api/auth/register')
    .send(userData);

  return res;
}

async function createCategory(categoryData) {
  const res = await request(server)
    .post('/api/categories')
    .set('x-auth-token', userToken)
    .send(categoryData);

  return res.body.category._id;
}

async function createRecipe(token, recipeData) {
  const res = await request(server)
    .post('/api/recipes')
    .set('x-auth-token', token)
    .send(recipeData);

  return res;
}

describe('/api/recipes', () => {
  beforeAll(async () => {
    server = require('../../index');
  });

  afterAll(async () => {
    await server.close();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    const user = await createUser(dummyUsers.john);
    userToken = user.body.token;

    const decoded = jwt.verify(userToken, jwtSecret);
    userId = decoded.user.id;

    categoryId = await createCategory({ title: 'Category A' });
  });

  afterEach(async () => {
    // Reset mocks
    jest.restoreAllMocks();

    await Recipe.deleteMany({});
    await User.deleteMany({});
    await Category.deleteMany({});
  });

  /*
    describe /get/
      [x] - 1. Handle error 500
      [x] - 2. Return status 200 and an array of recipes
  */
  describe('GET /', () => {
    it('should handle error 500', async () => {
      jest.spyOn(Recipe, 'find').mockImplementation(() => {
        throw new Error('Test server error (GET /recipes)');
      });

      const res = await request(server).get('/api/recipes');

      expect(res.status).toBe(500);
    });

    it('should return status 200 and all recipes', async () => {
      await Recipe.collection.insertMany([
        { user: userId, category: categoryId, title: 'Recipe A', ingredients: 'Ingredients A', directions: 'Directions A' },
        { user: userId, category: categoryId, title: 'Recipe B', ingredients: 'Ingredients B', directions: 'Directions B' },
        { user: userId, category: categoryId, title: 'Recipe C', ingredients: 'Ingredients C', directions: 'Directions C' }
      ]);

      const res = await request(server).get('/api/recipes');

      expect(res.status).toBe(200);
      expect(res.body.recipes.length).toBe(3);
    });
  });

  /*
    describe /get/:id
      [x] - 1. Handle error 500
      [x] - 2. Test with an invalid recipe ID (404)
      [x] - 3. Test with a valid recipe ID (recipe object + 200)
  */
  describe('GET :id', () => {
    it('should handle error 500', async () => {
      jest.spyOn(Recipe, 'findById').mockImplementation(() => {
        throw new Error('Test server error (GET:id /recipes)');
      });

      const res = await request(server).get('/api/recipes/' + '1');

      expect(res.status).toBe(500);
    });

    it('should return 404 if recipe doesn\'t exist', async () => {
      const res = await request(server)
        .get('/api/recipes/' + invalidRecipeId);

      expect(res.status).toBe(404);
    });

    it('should return 200 and a recipe object if exists', async () => {
      const recipe = await createRecipe(
        userToken,
        { category: categoryId, title: 'Recipe D', ingredients: 'Ingredients D', directions: 'Directions D' }
      );

      const recipeId = recipe.body.recipe._id;

      const res = await request(server)
        .get('/api/recipes/' + recipeId);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('recipe');
    });
  });

  /*
    describe /post/
      [x] - 1. Handle error 500
      [x] - 2. Test request with missing or invalid data (400)
      [x] - 3. Test with invalid category Id (404)
      [x] - 4. Successfully register a new category (201 + recipe property)
  */
  describe('POST', () => {
    it('should handle error 500', async () => {
      jest.spyOn(Recipe.prototype, 'save').mockImplementation(() => {
        throw new Error('Test server error (POST /recipes)');
      });

      const res = await createRecipe(
        userToken,
        { category: categoryId, title: 'Recipe D', ingredients: 'Ingredients D', directions: 'Directions D' }
      );

      expect(res.status).toBe(500);
    });

    it('should return 400 on missing or invalid inputs', async () => {
      const res = await createRecipe(
        userToken,
        { category: categoryId, title: '', ingredients: 'Ingredients D', directions: 'Directions D' }
      );

      expect(res.status).toBe(400);
    });

    it('should return 404 is category doesn\' exists', async () => {
      const res = await createRecipe(
        userToken,
        { category: invalidCategoryId, title: 'Recipe D', ingredients: 'Ingredients D', directions: 'Directions D' }
      );

      expect(res.status).toBe(404);
    });

    it('should return 201 and the recipe object', async () => {
      const res = await createRecipe(
        userToken,
        { category: categoryId, title: 'Recipe D', ingredients: 'Ingredients D', directions: 'Directions D' }
      );

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('recipe');
    });
  });

  /*
    describe /put/:id
      [x] - 1. Handle error 500
      [x] - 2. Test request with missing or invalid data (400)
      [x] - 3. Test with invalid category Id (404)
      [x] - 4. Test with invalid recipe Id (404)
      [x] - 5. Check if user is the original poster (403)
      [x] - 6. Successfully update the category (200, recipe object)
  */
  describe('PUT :id', () => {
    it('should handle error 500', async () => {
      jest.spyOn(Recipe, 'findByIdAndUpdate').mockImplementation(() => {
        throw new Error('Test server error (PUT /recipes)');
      });

      const recipe = await createRecipe(
        userToken,
        { category: categoryId, title: 'Recipe D', ingredients: 'Ingredients D', directions: 'Directions D' }
      );

      const res = await request(server)
        .put('/api/recipes/' + recipe.body.recipe._id)
        .set('x-auth-token', userToken)
        .send({ category: categoryId, title: 'Recipe E', ingredients: 'Ingredients E', directions: 'Directions E' });

      expect(res.status).toBe(500);
    });

    it('should return 400 on missing or invalid inputs', async () => {
      const recipe = await createRecipe(
        userToken,
        { category: categoryId, title: 'Recipe D', ingredients: 'Ingredients D', directions: 'Directions D' }
      );

      const res = await request(server)
        .put('/api/recipes/' + recipe.body.recipe._id)
        .set('x-auth-token', userToken)
        .send({ category: categoryId, title: '', ingredients: 'Ingredients D', directions: 'Directions D' })

      expect(res.status).toBe(400);
    });

    it('should return 404 if category doesn\'t exist', async () => {
      const recipe = await createRecipe(
        userToken,
        { category: categoryId, title: 'Recipe D', ingredients: 'Ingredients D', directions: 'Directions D' }
      );

      const res = await request(server)
        .put('/api/recipes/' + recipe.body.recipe._id)
        .set('x-auth-token', userToken)
        .send({ category: invalidCategoryId, title: 'Recipe D', ingredients: 'Ingredients D', directions: 'Directions D' })

      expect(res.status).toBe(404);
    });

    it('should return 404 if recipe doesn\'t exist', async () => {
      const res = await request(server)
        .put('/api/recipes/' + invalidRecipeId)
        .set('x-auth-token', userToken)
        .send({ category: categoryId, title: 'Recipe D', ingredients: 'Ingredients D', directions: 'Directions D' })

      expect(res.status).toBe(404);
    });

    it('should return 403 if user is not the original poster', async () => {
      const recipe = await createRecipe(
        userToken,
        { category: categoryId, title: 'Recipe D', ingredients: 'Ingredients D', directions: 'Directions D' }
      );

      const newUser = await createUser(dummyUsers.james);

      const res = await request(server)
        .put('/api/recipes/' + recipe.body.recipe._id)
        .set('x-auth-token', newUser.body.token)
        .send({ category: categoryId, title: 'Recipe D', ingredients: 'Ingredients D', directions: 'Directions D' });

      expect(res.status).toBe(403);
    });

    it('should return 200 and recipe object if the recipe was updated', async () => {
      const recipe = await createRecipe(
        userToken,
        { category: categoryId, title: 'Recipe D', ingredients: 'Ingredients D', directions: 'Directions D' }
      );

      const res = await request(server)
        .put('/api/recipes/' + recipe.body.recipe._id)
        .set('x-auth-token', userToken)
        .send({ category: categoryId, title: 'Recipe E', ingredients: 'Ingredients E', directions: 'Directions E' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('recipe');
    });
  });

  /*
    describe /delete/:id
      [x] - 1. Handle error 500
      [x] - 2. Check if recipe exists with an invalid ID (404)
      [x] - 3. Check if user is the original poster (403)
      [x] - 4. Successfully delete the recipe (200 + recipe object)
  */
  describe('DELETE :id', () => {
    it('should handle error 500', async () => {
      jest.spyOn(Recipe, 'findByIdAndDelete').mockImplementation(() => {
        throw new Error('Test server error (DELETE /recipes)');
      });

      const recipe = await createRecipe(
        userToken,
        { category: categoryId, title: 'Recipe D', ingredients: 'Ingredients D', directions: 'Directions D' }
      );

      const res = await request(server)
        .delete('/api/recipes/' + recipe.body.recipe._id)
        .set('x-auth-token', userToken);

      expect(res.status).toBe(500);
    });

    it('should return 404 is recipe doens\'t exist', async () => {
      const res = await request(server)
        .delete('/api/recipes/' + invalidRecipeId)
        .set('x-auth-token', userToken);

      expect(res.status).toBe(404);
    });

    it('should return 403 is user is not the original poster', async () => {
      const recipe = await createRecipe(
        userToken,
        { category: categoryId, title: 'Recipe D', ingredients: 'Ingredients D', directions: 'Directions D' }
      );

      const newUser = await createUser(dummyUsers.james);

      const res = await request(server)
        .delete('/api/recipes/' + recipe.body.recipe._id)
        .set('x-auth-token', newUser.body.token);

      expect(res.status).toBe(403);
    });

    it('should return 200 and recipe object if the recipe was deleted', async () => {
      const recipe = await createRecipe(
        userToken,
        { category: categoryId, title: 'Recipe D', ingredients: 'Ingredients D', directions: 'Directions D' }
      );

      const res = await request(server)
        .delete('/api/recipes/' + recipe.body.recipe._id)
        .set('x-auth-token', userToken);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('recipe');
    });
  });
});