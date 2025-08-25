import express, { Request, Response } from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

// Extend Request interface to include user property
interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// In-memory data store (for testing without database)
const users: any[] = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@demo.com',
    password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/z.2QKkNp.', // demo123
    role: 'admin',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: '2',
    name: 'John Doe',
    email: 'john@example.com',
    password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/z.2QKkNp.', // demo123
    role: 'user',
    isActive: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: '3',
    name: 'Jane Smith',
    email: 'jane@example.com',
    password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/z.2QKkNp.', // demo123
    role: 'user',
    isActive: true,
    createdAt: new Date('2024-01-14'),
    updatedAt: new Date('2024-01-14')
  }
];

// Validation schemas
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6)
});

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['user', 'admin', 'moderator']).default('user')
});

// Auth middleware
const authenticateToken = (req: AuthenticatedRequest, res: Response, next: any): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ success: false, message: 'Access token required' });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any): void => {
    if (err) {
      res.status(403).json({ success: false, message: 'Invalid or expired token' });
      return;
    }
    req.user = user;
    next();
  });
};

// Helper functions
const generateToken = (userId: string, role: string) => {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '7d' });
};

const formatUser = (user: any) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  isActive: user.isActive,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});

// 🔐 AUTH ROUTES
app.post('/api/v1/auth/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password } = registerSchema.parse(req.body);
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = {
      id: String(users.length + 1),
      name, email, password: hashedPassword, role: 'user', isActive: true,
      createdAt: new Date(), updatedAt: new Date()
    };
    users.push(newUser);

    const token = generateToken(newUser.id, newUser.role);
    return res.status(201).json({
      success: true, message: 'User registered successfully',
      data: { user: formatUser(newUser), token }
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message || 'Registration failed' });
  }
});

app.post('/api/v1/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const user = users.find(u => u.email === email);
    if (!user || !user.isActive) {
      return res.status(400).json({ success: false, message: 'Invalid email or password' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ success: false, message: 'Invalid email or password' });
    }

    const token = generateToken(user.id, user.role);
    return res.json({
      success: true, message: 'Login successful',
      data: { user: formatUser(user), token }
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message || 'Login failed' });
  }
});

// 📊 DASHBOARD ROUTES
app.get('/api/v1/dashboard/statistics', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.isActive).length;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const newUsersToday = users.filter(u => new Date(u.createdAt) >= today).length;

  return res.json({
    success: true, message: 'Statistics retrieved successfully',
    data: { totalUsers, activeUsers, newUsersToday, systemStatus: 'online' }
  });
});

app.get('/api/v1/dashboard/activity', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 10;
  const activities = users.slice(-limit).reverse().map(user => ({
    id: `user_${user.id}`, type: 'user_registered', title: 'New user registered',
    description: `${user.name} created a new account`, time: user.createdAt, user: user.name
  }));

  return res.json({ success: true, message: 'Recent activities retrieved successfully', data: activities });
});

// 👥 USER MANAGEMENT ROUTES
app.get('/api/v1/users', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { search, role, page = 1, limit = 20 } = req.query;
  let filteredUsers = [...users];

  if (search) {
    filteredUsers = filteredUsers.filter(user => 
      user.name.toLowerCase().includes((search as string).toLowerCase()) ||
      user.email.toLowerCase().includes((search as string).toLowerCase())
    );
  }

  if (role && role !== '') {
    filteredUsers = filteredUsers.filter(user => user.role === role);
  }

  const startIndex = (Number(page) - 1) * Number(limit);
  const endIndex = startIndex + Number(limit);
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  return res.json({
    success: true, message: 'Users retrieved successfully',
    data: paginatedUsers.map(formatUser),
    meta: {
      page: Number(page), limit: Number(limit), total: filteredUsers.length,
      totalPages: Math.ceil(filteredUsers.length / Number(limit))
    }
  });
});

app.post('/api/v1/users/create', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const requestingUser = users.find(u => u.id === req.user?.userId);
    if (!requestingUser || requestingUser.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const { name, email, password, role } = createUserSchema.parse(req.body);
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = {
      id: String(users.length + 1), name, email, password: hashedPassword,
      role: role || 'user', isActive: true, createdAt: new Date(), updatedAt: new Date()
    };
    users.push(newUser);

    return res.status(201).json({
      success: true, message: 'User created successfully', data: formatUser(newUser)
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message || 'User creation failed' });
  }
});

app.get('/api/v1/users/:id', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const user = users.find(u => u.id === id);

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  return res.json({
    success: true, message: 'User retrieved successfully', data: formatUser(user)
  });
});

app.put('/api/v1/users/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, role, isActive } = req.body;

    const userIndex = users.findIndex(u => u.id === id);
    if (userIndex === -1) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (email && email !== users[userIndex].email) {
      const existingUser = users.find(u => u.email === email && u.id !== id);
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'Email already in use' });
      }
    }

    if (name) users[userIndex].name = name;
    if (email) users[userIndex].email = email;
    if (role) users[userIndex].role = role;
    if (typeof isActive === 'boolean') users[userIndex].isActive = isActive;
    users[userIndex].updatedAt = new Date();

    return res.json({
      success: true, message: 'User updated successfully', data: formatUser(users[userIndex])
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message || 'User update failed' });
  }
});

app.delete('/api/v1/users/:id', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  
  const requestingUser = users.find(u => u.id === req.user?.userId);
  if (!requestingUser || requestingUser.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }

  const userIndex = users.findIndex(u => u.id === id);
  if (userIndex === -1) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  if (id === req.user?.userId) {
    return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
  }

  users.splice(userIndex, 1);

  return res.json({ success: true, message: 'User deleted successfully' });
});

// Health check
app.get('/api/v1/health', (req: Request, res: Response) => {
  return res.json({
    success: true, message: 'Server is healthy',
    data: { status: 'online', timestamp: new Date(), uptime: process.uptime() }
  });
});

// Error handling
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('Server error:', err);
  return res.status(500).json({ success: false, message: 'Internal server error' });
});

app.use('*', (req: Request, res: Response) => {
  return res.status(404).json({ success: false, message: `Route ${req.method} ${req.originalUrl} not found` });
});

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📚 Health Check: http://localhost:${PORT}/api/v1/health`);
    console.log(`\n🔐 Demo Credentials:`);
    console.log(`   Email: admin@demo.com`);
    console.log(`   Password: demo123`);
  });
}

export default app; 