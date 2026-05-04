# Collab Space

A complete full-stack PERN (PostgreSQL, Express.js, React, Node.js) application with modular architecture built with TypeScript Typing.

## 🚀 Features

### Backend (Express.js + TypeScript)
- ✅ **Express.js** with TypeScript
- ✅ **PostgreSQL** with Prisma ORM
- ✅ **Redis** for caching
- ✅ **JWT Authentication** with refresh tokens
- ✅ **Role-based Access Control** (RBAC)
- ✅ **Zod Validation** for request validation
- ✅ **Winston Logging** with structured logs
- ✅ **Swagger Documentation** (OpenAPI 3.0)
- ✅ **Jest Testing** with Supertest
- ✅ **ESLint + Prettier** for code quality
- ✅ **Rate Limiting** and security middleware
- ✅ **Error Handling** with custom error classes
- ✅ **Modular Architecture**

### Frontend (React + Vite + TypeScript)
- ✅ **React 19** with TypeScript
- ✅ **Vite** for fast development and building
- ✅ **Redux Toolkit** for state management
- ✅ **React Query** for server state management
- ✅ **React Router v6** for routing
- ✅ **Tailwind CSS** for styling
- ✅ **React Hook Form** with Zod validation
- ✅ **Headless UI** for accessible components
- ✅ **Framer Motion** for animations
- ✅ **Vitest** for testing
- ✅ **Responsive Design** with mobile-first approach

## 📁 Project Structure

```
project/
├── backend/                 # Express.js backend
│   ├── config/             # Configuration files
│   ├── prisma/             # Database schema and migrations
│   ├── src/
│   │   ├── modules/        # Feature modules (user, product, order)
│   │   │   ├── user/
│   │   │   │   ├── controller/
│   │   │   │   ├── service/
│   │   │   │   ├── repository/
│   │   │   │   ├── dto/
│   │   │   │   ├── router/
│   │   │   │   ├── cache/
│   │   │   │   └── validators/
│   │   │   ├── product/
│   │   │   └── order/
│   │   ├── middleware/      # Custom middleware
│   │   ├── utils/          # Utility functions
│   │   ├── app.ts          # Express app configuration
│   │   └── server.ts       # Server entry point
│   ├── tests/              # Test files
│   └── docs/               # API documentation
├── frontend/
├   ├── public/                   # Static assets(faviconmanifest, etc.)
│   ├── src/
│   ├── assets/              # Images, icons, fonts, SVGs
│   │
│   ├── components/          # Reusable UI components
│   │   ├── ui/              # Generic UI components (Button, Modal, etc.)
│   │   └── dashboard/       # Components specific to dashboard UI
│   │
│   ├── constants/           # App-wide constants (roles, paths, enums)
│   │
│   ├── hooks/               # Custom React hooks
│   │   ├── useStore.ts      # Typed useSelector/useDispatch (Redux)
│   │   └── useAuthCheck.ts  # Hook for checking user auth from localStorage
│   │
│   ├── layouts/             # Shared layout wrappers (e.g., MainLayout, AuthLayout)
│   │
│   ├── pages/               # Route-level pages
│   │   ├── auth/            # Login, Register, ForgotPassword
│   │   │   └── LoginPage.tsx
│   │   └── dashboard/       # Dashboard-related pages
│   │       └── DashboardPage.tsx
│   │
│   ├── router/              # React Router configuration
│   │   └── router.tsx       # Defines app routes and protected routing logic
│   │
│   ├── services/            # API calls (e.g., authService, userService)
│   │
│   ├── state/               # Redux Toolkit setup
│   │   ├── store.ts         # Redux store configuration
│   │   └── slices/          # Redux slices
│   │       └── authSlice.ts # Auth slice (contains actions like setUser, clearAuth)
│   │
│   ├── styles/              # Tailwind and global styles
│   │   └── index.css
│   │
│   ├── types/               # TypeScript types and interfaces
│   │
│   ├── utils/               # Utility functions (e.g., formatDate, storage helpers)
│   │
│   ├── App.tsx              # Main app wrapper (providers, routing)
│   ├── main.tsx             # Entry point for React + Vite
│   │── vite-env.d.ts        # Vite type declarations
│   │
│   └── tests/                   # Frontend test files (Vitest, React Testing Library)
│            # Test files
└── README.md
```

## 🛠️ Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- Redis 6+
- Git


### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env file with your database credentials
# DATABASE_URL="postgresql://username:password@localhost:5432/pern_db"
# REDIS_URL="redis://localhost:6379"
# JWT_SECRET="your-super-secret-jwt-key"

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Seed the database
npm run prisma:seed

# Start development server
npm run dev
```

The backend will start on http://localhost:5000

### 2. Frontend Setup

```bash
# Navigate to frontend directory (from project root)
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will start on http://localhost:3000

## 🔧 Environment Variables

### Backend (.env)

```env
# Server Configuration
NODE_ENV=development
PORT=5000
API_VERSION=v1

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/pern_db?schema=public"

# Redis
REDIS_URL="redis://localhost:6379"
REDIS_PASSWORD=""

# JWT
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-refresh-secret-here
JWT_REFRESH_EXPIRES_IN=30d

# CORS
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info

# API Documentation
SWAGGER_ENABLED=true

# Security
BCRYPT_ROUNDS=12
```

## 📚 API Documentation

When the backend is running, visit:
- Swagger UI: http://localhost:5000/api-docs
- Health Check: http://localhost:5000/health

## 🧪 Testing

### Backend Tests

```bash
cd backend

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Frontend Tests

```bash
cd frontend

# Run tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## 🏗️ Build for Production

### Backend

```bash
cd backend

# Build TypeScript
npm run build

# Start production server
npm start
```

### Frontend

```bash
cd frontend

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📋 Available Scripts

### Backend Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:seed` - Seed database with sample data
- `npm run prisma:studio` - Open Prisma Studio

### Frontend Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run type-check` - Type check without emitting

## 🔐 Authentication

The application includes a complete authentication system:

- User registration and login
- JWT tokens with refresh token rotation
- Password hashing with bcrypt
- Protected routes and role-based access control
- Password change functionality

### Default Users (after seeding)

- **Admin**: admin@example.com / password123
- **User**: user@example.com / password123

## 🛡️ Security Features

- Helmet.js for security headers
- CORS configuration
- Rate limiting
- Input validation with Zod
- SQL injection prevention with Prisma
- Password hashing with bcrypt
- JWT token security
- Error message sanitization

## 🚀 Deployment

### Using Docker (Recommended)

```bash
# Build and run with Docker Compose
docker-compose up -d
```

### Manual Deployment

1. Set up PostgreSQL and Redis servers
2. Configure environment variables for production
3. Build both frontend and backend
4. Deploy to your preferred hosting platform

### Recommended Hosting Platforms

- **Backend**: Railway, Render, Heroku, AWS, DigitalOcean
- **Frontend**: Vercel, Netlify, Cloudflare Pages
- **Database**: Supabase, PlanetScale, AWS RDS
- **Redis**: Redis Cloud, AWS ElastiCache

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

If you have any questions or need help with setup, please open an issue in the GitHub repository.

---

**Happy Coding! 🎉**
