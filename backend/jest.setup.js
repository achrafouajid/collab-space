// Jest setup file for environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key';
process.env.PORT = '5001';
process.env.CORS_ORIGIN = 'http://localhost:3000';
process.env.BCRYPT_ROUNDS = '4'; // Lower rounds for faster tests 