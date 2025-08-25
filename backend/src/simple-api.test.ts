import request from 'supertest';
import app from './simple-api';

describe('PERN Stack API Tests', () => {
  let authToken: string;
  let userId: string;

  // Test Health Check
  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const response = await request(app)
        .get('/api/v1/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Server is healthy');
      expect(response.body.data.status).toBe('online');
    });
  });

  // Test Authentication Routes
  describe('Authentication', () => {
    describe('POST /api/v1/auth/register', () => {
      it('should register a new user successfully', async () => {
        const userData = {
          name: 'Test User',
          email: 'test@example.com',
          password: 'testpass123'
        };

        const response = await request(app)
          .post('/api/v1/auth/register')
          .send(userData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('User registered successfully');
        expect(response.body.data.user.email).toBe(userData.email);
        expect(response.body.data.user.name).toBe(userData.name);
        expect(response.body.data.token).toBeDefined();
        
        // Store token for future tests
        authToken = response.body.data.token;
        userId = response.body.data.user.id;
      });

      it('should reject registration with existing email', async () => {
        const userData = {
          name: 'Another User',
          email: 'test@example.com', // Same email as above
          password: 'testpass123'
        };

        const response = await request(app)
          .post('/api/v1/auth/register')
          .send(userData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('User already exists');
      });

      it('should reject registration with invalid data', async () => {
        const userData = {
          name: 'A', // Too short
          email: 'invalid-email', // Invalid email
          password: '123' // Too short
        };

        const response = await request(app)
          .post('/api/v1/auth/register')
          .send(userData)
          .expect(400);

        expect(response.body.success).toBe(false);
      });
    });

    describe('POST /api/v1/auth/login', () => {
      it('should login with valid credentials', async () => {
        const credentials = {
          email: 'admin@demo.com',
          password: 'demo123'
        };

        const response = await request(app)
          .post('/api/v1/auth/login')
          .send(credentials)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Login successful');
        expect(response.body.data.user.email).toBe(credentials.email);
        expect(response.body.data.token).toBeDefined();
      });

      it('should reject login with invalid credentials', async () => {
        const credentials = {
          email: 'admin@demo.com',
          password: 'wrongpassword'
        };

        const response = await request(app)
          .post('/api/v1/auth/login')
          .send(credentials)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Invalid email or password');
      });

      it('should reject login with non-existent user', async () => {
        const credentials = {
          email: 'nonexistent@example.com',
          password: 'somepassword'
        };

        const response = await request(app)
          .post('/api/v1/auth/login')
          .send(credentials)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Invalid email or password');
      });
    });
  });

  // Test Dashboard Routes
  describe('Dashboard', () => {
    beforeAll(async () => {
      // Login as admin to get token for protected routes
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@demo.com',
          password: 'demo123'
        });
      authToken = response.body.data.token;
    });

    describe('GET /api/v1/dashboard/statistics', () => {
      it('should return dashboard statistics for authenticated user', async () => {
        const response = await request(app)
          .get('/api/v1/dashboard/statistics')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('totalUsers');
        expect(response.body.data).toHaveProperty('activeUsers');
        expect(response.body.data).toHaveProperty('newUsersToday');
        expect(response.body.data).toHaveProperty('systemStatus');
        expect(typeof response.body.data.totalUsers).toBe('number');
      });

      it('should reject request without authentication', async () => {
        const response = await request(app)
          .get('/api/v1/dashboard/statistics')
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Access token required');
      });
    });

    describe('GET /api/v1/dashboard/activity', () => {
      it('should return recent activities', async () => {
        const response = await request(app)
          .get('/api/v1/dashboard/activity')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
        
        if (response.body.data.length > 0) {
          expect(response.body.data[0]).toHaveProperty('id');
          expect(response.body.data[0]).toHaveProperty('type');
          expect(response.body.data[0]).toHaveProperty('title');
          expect(response.body.data[0]).toHaveProperty('description');
        }
      });

      it('should respect limit parameter', async () => {
        const limit = 3;
        const response = await request(app)
          .get(`/api/v1/dashboard/activity?limit=${limit}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.length).toBeLessThanOrEqual(limit);
      });
    });
  });

  // Test User Management Routes
  describe('User Management', () => {
    describe('GET /api/v1/users', () => {
      it('should return list of users for authenticated user', async () => {
        const response = await request(app)
          .get('/api/v1/users')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body).toHaveProperty('meta');
        expect(response.body.meta).toHaveProperty('page');
        expect(response.body.meta).toHaveProperty('limit');
        expect(response.body.meta).toHaveProperty('total');
      });

      it('should filter users by search term', async () => {
        const response = await request(app)
          .get('/api/v1/users?search=admin')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        // Should find admin user
        const hasAdminUser = response.body.data.some((user: any) => 
          user.email.includes('admin') || user.name.toLowerCase().includes('admin')
        );
        expect(hasAdminUser).toBe(true);
      });

      it('should filter users by role', async () => {
        const response = await request(app)
          .get('/api/v1/users?role=admin')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        // All returned users should have admin role
        response.body.data.forEach((user: any) => {
          expect(user.role).toBe('admin');
        });
      });

      it('should support pagination', async () => {
        const response = await request(app)
          .get('/api/v1/users?page=1&limit=2')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.length).toBeLessThanOrEqual(2);
        expect(response.body.meta.limit).toBe(2);
        expect(response.body.meta.page).toBe(1);
      });
    });

    describe('POST /api/v1/users/create', () => {
      it('should create new user with admin privileges', async () => {
        const newUser = {
          name: 'New Test User',
          email: 'newtest@example.com',
          password: 'newpass123',
          role: 'user'
        };

        const response = await request(app)
          .post('/api/v1/users/create')
          .set('Authorization', `Bearer ${authToken}`)
          .send(newUser)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('User created successfully');
        expect(response.body.data.email).toBe(newUser.email);
        expect(response.body.data.name).toBe(newUser.name);
        expect(response.body.data.role).toBe(newUser.role);
      });

      it('should reject creation with existing email', async () => {
        const duplicateUser = {
          name: 'Duplicate User',
          email: 'admin@demo.com', // Existing email
          password: 'pass123',
          role: 'user'
        };

        const response = await request(app)
          .post('/api/v1/users/create')
          .set('Authorization', `Bearer ${authToken}`)
          .send(duplicateUser)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('User already exists');
      });

      it('should reject creation without admin token', async () => {
        // First, login as a regular user
        const userLogin = await request(app)
          .post('/api/v1/auth/login')
          .send({
            email: 'john@example.com',
            password: 'demo123'
          });

        const userToken = userLogin.body.data.token;

        const newUser = {
          name: 'Unauthorized User',
          email: 'unauthorized@example.com',
          password: 'pass123',
          role: 'user'
        };

        const response = await request(app)
          .post('/api/v1/users/create')
          .set('Authorization', `Bearer ${userToken}`)
          .send(newUser)
          .expect(403);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Admin access required');
      });
    });

    describe('GET /api/v1/users/:id', () => {
      it('should return user by ID', async () => {
        const response = await request(app)
          .get('/api/v1/users/1')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data).toHaveProperty('email');
        expect(response.body.data).toHaveProperty('name');
        expect(response.body.data).toHaveProperty('role');
      });

      it('should return 404 for non-existent user', async () => {
        const response = await request(app)
          .get('/api/v1/users/999999')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('User not found');
      });
    });
  });

  // Test Error Handling
  describe('Error Handling', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/v1/nonexistent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Route GET /api/v1/nonexistent not found');
    });

    it('should handle invalid JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send('invalid json')
        .set('Content-Type', 'application/json')
        .expect(400);

      // Should handle the error gracefully without crashing
    });
  });

  // Test JWT Token Validation
  describe('JWT Token Validation', () => {
    it('should reject invalid token format', async () => {
      const response = await request(app)
        .get('/api/v1/dashboard/statistics')
        .set('Authorization', 'Bearer invalid-token')
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid or expired token');
    });

    it('should reject missing authorization header', async () => {
      const response = await request(app)
        .get('/api/v1/dashboard/statistics')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access token required');
    });

    it('should reject malformed authorization header', async () => {
      const response = await request(app)
        .get('/api/v1/dashboard/statistics')
        .set('Authorization', 'InvalidFormat')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access token required');
    });
  });
}); 