// Test setup and configuration
import { beforeAll, afterAll } from '@jest/globals';

// Mock console methods to reduce noise during testing
const originalConsole = { ...console };

beforeAll(() => {
  // Suppress console logs during tests unless explicitly needed
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
  console.info = jest.fn();
});

afterAll(() => {
  // Restore console methods
  Object.assign(console, originalConsole);
});

// Global test utilities
global.testUtils = {
  // Helper to create test user data
  createTestUser: (overrides = {}) => ({
    name: 'Test User',
    email: 'test@example.com',
    password: 'testpass123',
    role: 'user',
    ...overrides
  }),

  // Helper to create admin credentials
  getAdminCredentials: () => ({
    email: 'admin@demo.com',
    password: 'demo123'
  }),

  // Helper to extract token from auth response
  extractToken: (authResponse: any) => {
    return authResponse.body.data.token;
  },

  // Helper to create authorization header
  createAuthHeader: (token: string) => ({
    Authorization: `Bearer ${token}`
  })
};

// Extend Jest matchers for API testing
expect.extend({
  toBeValidApiResponse(received) {
    const pass = received && 
                 typeof received.success === 'boolean' &&
                 typeof received.message === 'string';
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid API response`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid API response with success and message properties`,
        pass: false,
      };
    }
  },

  toHaveValidToken(received) {
    const token = received.body?.data?.token;
    const pass = token && 
                 typeof token === 'string' &&
                 token.split('.').length === 3; // JWT format
    
    if (pass) {
      return {
        message: () => `expected response not to have a valid JWT token`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected response to have a valid JWT token`,
        pass: false,
      };
    }
  }
});

// Type declarations for custom matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidApiResponse(): R;
      toHaveValidToken(): R;
    }
  }
  
  var testUtils: {
    createTestUser: (overrides?: any) => any;
    getAdminCredentials: () => { email: string; password: string };
    extractToken: (authResponse: any) => string;
    createAuthHeader: (token: string) => { Authorization: string };
  };
} 