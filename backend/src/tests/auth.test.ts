import request from 'supertest';
import app from '../simple-api';

describe('Authentication Service Tests', () => {
  describe('User Registration', () => {
    const validUser = {
      name: 'Auth Test User',
      email: 'authtest@example.com',
      password: 'securepass123'
    };

    it('should create user with hashed password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(validUser)
        .expect(201);

      expect(response.body.data.user.name).toBe(validUser.name);
      expect(response.body.data.user.email).toBe(validUser.email);
      expect(response.body.data.user.role).toBe('user'); // Default role
      expect(response.body.data.user.isActive).toBe(true);
      expect(response.body.data.token).toBeDefined();
      
      // Password should not be in response
      expect(response.body.data.user.password).toBeUndefined();
    });

    it('should validate email format', async () => {
      const invalidUser = {
        ...validUser,
        email: 'invalid-email-format'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(invalidUser)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should enforce minimum password length', async () => {
      const weakPasswordUser = {
        ...validUser,
        email: 'weakpass@example.com',
        password: '123' // Too short
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(weakPasswordUser)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should enforce minimum name length', async () => {
      const shortNameUser = {
        ...validUser,
        email: 'shortname@example.com',
        name: 'A' // Too short
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(shortNameUser)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('User Login', () => {
    const testCredentials = {
      email: 'admin@demo.com',
      password: 'demo123'
    };

    it('should return valid JWT token on successful login', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(testCredentials)
        .expect(200);

      expect(response.body.data.token).toBeDefined();
      expect(typeof response.body.data.token).toBe('string');
      
      // Token should contain three parts (header.payload.signature)
      const tokenParts = response.body.data.token.split('.');
      expect(tokenParts).toHaveLength(3);
    });

    it('should return user information on successful login', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(testCredentials)
        .expect(200);

      const user = response.body.data.user;
      expect(user.email).toBe(testCredentials.email);
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('name');
      expect(user).toHaveProperty('role');
      expect(user).toHaveProperty('isActive');
      expect(user).toHaveProperty('createdAt');
      
      // Sensitive data should not be included
      expect(user.password).toBeUndefined();
    });

    it('should reject login with wrong password', async () => {
      const wrongCredentials = {
        email: testCredentials.email,
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(wrongCredentials)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid email or password');
      expect(response.body.data).toBeUndefined();
    });

    it('should reject login with non-existent email', async () => {
      const nonExistentCredentials = {
        email: 'nonexistent@example.com',
        password: 'somepassword'
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(nonExistentCredentials)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid email or password');
    });

    it('should handle case-sensitive email login', async () => {
      const upperCaseEmail = {
        email: testCredentials.email.toUpperCase(),
        password: testCredentials.password
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(upperCaseEmail)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Token Validation', () => {
    let validToken: string;

    beforeAll(async () => {
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@demo.com',
          password: 'demo123'
        });
      validToken = loginResponse.body.data.token;
    });

    it('should accept valid token for protected routes', async () => {
      const response = await request(app)
        .get('/api/v1/dashboard/statistics')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should reject expired/invalid tokens', async () => {
      const invalidToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid';
      
      const response = await request(app)
        .get('/api/v1/dashboard/statistics')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid or expired token');
    });

    it('should reject requests without authorization header', async () => {
      const response = await request(app)
        .get('/api/v1/dashboard/statistics')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access token required');
    });

    it('should reject malformed authorization headers', async () => {
      const response = await request(app)
        .get('/api/v1/dashboard/statistics')
        .set('Authorization', 'InvalidFormat')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
}); 