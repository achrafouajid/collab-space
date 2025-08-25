# PERN Stack Backend

Express.js backend with TypeScript, PostgreSQL, Redis, and comprehensive API documentation.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your database credentials

# Setup database
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed

# Start development server
npm run dev
```

## 📁 Architecture

This backend follows a modular architecture pattern with clean separation of concerns:

```
src/
├── modules/
│   ├── user/
│   │   ├── controller/     # HTTP request handlers
│   │   ├── service/        # Business logic
│   │   ├── repository/     # Data access layer
│   │   ├── dto/           # Data transfer objects
│   │   ├── router/        # Route definitions
│   │   ├── cache/         # Redis caching logic
│   │   └── validators/    # Input validation
│   ├── product/
│   └── order/
├── middleware/            # Express middleware
├── utils/                # Utility functions
├── app.ts               # Express app setup
└── server.ts           # Server entry point
```

## 🔌 API Endpoints

### Authentication

- `POST /api/v1/users/register` - Register new user
- `POST /api/v1/users/login` - User login
- `POST /api/v1/users/refresh-token` - Refresh access token

### User Management

- `GET /api/v1/users/profile` - Get user profile
- `PUT /api/v1/users/profile` - Update user profile
- `POST /api/v1/users/change-password` - Change password
- `GET /api/v1/users/check-email` - Check email availability

### Admin Endpoints

- `GET /api/v1/users` - Get all users (Admin only)
- `GET /api/v1/users/:id` - Get user by ID (Admin only)
- `DELETE /api/v1/users/:id` - Delete user (Admin only)

### Utility

- `GET /health` - Health check
- `GET /api-docs` - Swagger documentation

## 🔒 Authentication & Authorization

The API uses JWT tokens for authentication:

1. **Access Token**: Short-lived (7 days by default)
2. **Refresh Token**: Long-lived (30 days by default)

### Protected Routes

Include the access token in the Authorization header:

```
Authorization: Bearer <access_token>
```

### Role-Based Access Control

- **USER**: Standard user permissions
- **ADMIN**: Full access to all resources

## 📝 Request/Response Format

### Standard Response Format

```json
{
  "success": boolean,
  "message": string,
  "data": object | null,
  "meta": {
    "page": number,
    "limit": number,
    "total": number,
    "totalPages": number
  }
}
```

### Error Response Format

```json
{
  "success": false,
  "message": string,
  "error": string | null
}
```

## 🗄️ Database Schema

### User Model

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  firstName String
  lastName  String
  role      Role     @default(USER)
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  orders    Order[]
}
```

### Product Model

```prisma
model Product {
  id          String   @id @default(cuid())
  name        String
  description String?
  price       Decimal  @db.Decimal(10, 2)
  stock       Int      @default(0)
  imageUrl    String?
  category    String
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  orderItems  OrderItem[]
}
```

### Order Model

```prisma
model Order {
  id          String      @id @default(cuid())
  userId      String
  status      OrderStatus @default(PENDING)
  totalAmount Decimal     @db.Decimal(10, 2)
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  user        User        @relation(fields: [userId], references: [id])
  orderItems  OrderItem[]
}
```

## 🚦 Error Handling

The API uses custom error classes for consistent error handling:

- `ValidationError` (400) - Input validation failed
- `AuthenticationError` (401) - Authentication required
- `AuthorizationError` (403) - Insufficient permissions
- `NotFoundError` (404) - Resource not found
- `ConflictError` (409) - Resource conflict
- `DatabaseError` (500) - Database operation failed

## 📊 Logging

Structured logging with Winston:

```typescript
logger.info('User logged in', { userId, email });
logger.error('Database connection failed', { error });
```

Log levels: `error`, `warn`, `info`, `debug`

## 🔄 Caching

Redis caching is implemented for:

- User profiles
- User lists with pagination
- Authentication tokens (blacklisting)

Cache TTL: 1 hour by default

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

Test structure:
- Unit tests for services and utilities
- Integration tests for API endpoints
- Test database isolation

## 📈 Performance

### Optimizations Implemented

- Database query optimization with Prisma
- Redis caching for frequently accessed data
- Connection pooling
- Request rate limiting
- Compression middleware
- Efficient pagination

### Monitoring

- Request logging with Morgan
- Error tracking with Winston
- Health check endpoint
- Performance metrics

## 🔧 Development Tools

### Code Quality

- **ESLint**: TypeScript linting
- **Prettier**: Code formatting
- **Husky**: Git hooks for pre-commit checks

### Database Tools

- **Prisma Studio**: Visual database browser
- **Prisma Migrate**: Database migration management
- **Database Seeding**: Sample data for development

### API Documentation

- **Swagger/OpenAPI**: Interactive API documentation
- **JSDoc**: Code documentation

## 🚀 Deployment

### Environment Variables for Production

```env
NODE_ENV=production
PORT=5000
DATABASE_URL=your_production_database_url
REDIS_URL=your_production_redis_url
JWT_SECRET=your_super_secure_jwt_secret
CORS_ORIGIN=your_frontend_domain
LOG_LEVEL=warn
SWAGGER_ENABLED=false
```

### Build Commands

```bash
# Build TypeScript
npm run build

# Start production server
npm start
```

### Health Monitoring

Monitor these endpoints in production:

- `GET /health` - Application health
- Check logs for errors and performance metrics
- Monitor database connection pool
- Monitor Redis connection status

## 🔐 Security Checklist

- [x] Input validation with Zod
- [x] SQL injection prevention with Prisma
- [x] Password hashing with bcrypt
- [x] JWT token security
- [x] Rate limiting
- [x] CORS configuration
- [x] Security headers with Helmet
- [x] Error message sanitization
- [x] Environment variable validation

## 📚 Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs/)
- [Express.js Documentation](https://expressjs.com/)
- [Redis Documentation](https://redis.io/documentation)
- [JWT Best Practices](https://tools.ietf.org/html/rfc7519)

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check DATABASE_URL in .env
   - Ensure PostgreSQL is running
   - Verify credentials and database exists

2. **Redis Connection Failed**
   - Check REDIS_URL in .env
   - Ensure Redis is running
   - Check Redis authentication if required

3. **JWT Token Issues**
   - Verify JWT_SECRET is set
   - Check token expiration
   - Ensure proper Authorization header format

4. **Migration Issues**
   - Run `npm run prisma:generate` first
   - Check database permissions
   - Verify Prisma schema syntax 