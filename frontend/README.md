# PERN Stack Frontend

Modern React frontend with TypeScript, Vite, Redux Toolkit, and Tailwind CSS.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Visit http://localhost:3000

## 📁 Architecture

This frontend follows a modular architecture with feature-based organization:

```
src/
├── app/                   # Redux store and router configuration
├── modules/               # Feature modules
│   ├── user/             # User management
│   │   ├── components/   # User-specific components
│   │   ├── pages/        # User pages
│   │   ├── services/     # User API calls
│   │   ├── slice.ts      # Redux slice
│   │   └── types.ts      # User types
│   ├── product/
│   └── order/
├── components/           # Reusable components
│   ├── ui/              # Base UI components
│   ├── forms/           # Form components
│   └── layout/          # Layout components
├── layouts/             # Page layouts
├── hooks/               # Custom hooks
├── services/            # API services
├── utils/               # Utility functions
├── types/               # Global types
├── constants/           # App constants
└── styles/              # Global styles
```

## 🎨 UI Components

### Base Components

- **Button**: Multiple variants (primary, secondary, outline, danger)
- **Input**: Form inputs with validation states
- **Modal**: Accessible modal component
- **LoadingSpinner**: Loading indicators
- **ErrorBoundary**: Error boundary wrapper

### Form Components

- **LoginForm**: User authentication
- **RegisterForm**: User registration
- **ProfileForm**: User profile editing
- **PasswordChangeForm**: Password updates

### Layout Components

- **Header**: Navigation and user menu
- **Sidebar**: Application navigation
- **Footer**: Footer information
- **Layout**: Main page wrapper

## 🔄 State Management

### Redux Store Structure

```typescript
{
  auth: {
    user: User | null,
    token: string | null,
    isAuthenticated: boolean,
    isLoading: boolean
  },
  ui: {
    theme: 'light' | 'dark',
    sidebarOpen: boolean,
    notifications: Notification[]
  }
}
```

### Redux Slices

- **Auth Slice**: User authentication state
- **UI Slice**: UI state and preferences

### React Query Integration

Server state is managed with React Query for:

- User data fetching
- Product listings
- Order management
- Optimistic updates
- Background refetching

## 🌐 API Integration

### Service Layer

```typescript
// User service example
export const userService = {
  login: (credentials: LoginDto) => api.post('/users/login', credentials),
  register: (userData: RegisterDto) => api.post('/users/register', userData),
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data: UpdateProfileDto) => api.put('/users/profile', data),
}
```

### Custom Hooks

```typescript
// Authentication hook
export const useAuth = () => {
  const user = useAppSelector(state => state.auth.user)
  const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated)
  
  return { user, isAuthenticated }
}

// API hook with React Query
export const useUserProfile = () => {
  return useQuery({
    queryKey: ['user', 'profile'],
    queryFn: userService.getProfile,
    enabled: !!user,
  })
}
```

## 🎯 Routing

### Route Structure

```typescript
const routes = [
  // Public routes
  { path: '/', element: <HomePage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  
  // Protected routes
  { path: '/dashboard', element: <ProtectedRoute><Dashboard /></ProtectedRoute> },
  { path: '/profile', element: <ProtectedRoute><ProfilePage /></ProtectedRoute> },
  
  // Admin routes
  { path: '/admin', element: <AdminRoute><AdminDashboard /></AdminRoute> },
]
```

### Route Guards

- **ProtectedRoute**: Requires authentication
- **AdminRoute**: Requires admin role
- **GuestRoute**: Redirects authenticated users

## 🔧 Form Handling

### React Hook Form + Zod

```typescript
const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

type LoginFormData = z.infer<typeof loginSchema>

const LoginForm = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = (data: LoginFormData) => {
    // Handle form submission
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email')} />
      {errors.email && <span>{errors.email.message}</span>}
      
      <input {...register('password')} type="password" />
      {errors.password && <span>{errors.password.message}</span>}
      
      <button type="submit">Login</button>
    </form>
  )
}
```

## 🎨 Styling

### Tailwind CSS

The project uses Tailwind CSS with custom configuration:

```typescript
// Custom colors
const colors = {
  primary: { 50: '#eff6ff', 500: '#3b82f6', 600: '#2563eb' },
  secondary: { 50: '#f8fafc', 500: '#64748b', 600: '#475569' },
  success: { 50: '#f0fdf4', 500: '#22c55e', 600: '#16a34a' },
  error: { 50: '#fef2f2', 500: '#ef4444', 600: '#dc2626' },
}
```

### Component Classes

```css
/* Button variants */
.btn-primary { @apply bg-primary-600 text-white hover:bg-primary-700; }
.btn-secondary { @apply bg-secondary-600 text-white hover:bg-secondary-700; }

/* Form components */
.form-input { @apply border border-gray-300 rounded-lg px-3 py-2; }
.form-error { @apply text-sm text-error-600; }

/* Layout */
.card { @apply bg-white rounded-lg shadow-sm border; }
```

## 🔔 Notifications

Toast notifications using react-hot-toast:

```typescript
import toast from 'react-hot-toast'

// Success notification
toast.success('Profile updated successfully!')

// Error notification
toast.error('Failed to update profile')

// Loading notification
const loadingToast = toast.loading('Updating profile...')
toast.success('Profile updated!', { id: loadingToast })
```

## 🧪 Testing

### Testing Setup

```bash
# Run tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### Test Structure

```typescript
// Component test example
import { render, screen } from '@testing-library/react'
import { LoginForm } from './LoginForm'

describe('LoginForm', () => {
  it('should render login form', () => {
    render(<LoginForm />)
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument()
  })
})
```

### Testing Utilities

- **React Testing Library**: Component testing
- **Vitest**: Test runner
- **MSW**: API mocking
- **User Event**: User interaction testing

## 📱 Responsive Design

### Breakpoints

```css
sm: '640px'    /* Small devices */
md: '768px'    /* Medium devices */
lg: '1024px'   /* Large devices */
xl: '1280px'   /* Extra large devices */
2xl: '1536px'  /* 2X large devices */
```

### Mobile-First Approach

```typescript
// Responsive component example
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => (
    <Card key={item.id} className="w-full">
      {/* Card content */}
    </Card>
  ))}
</div>
```

## ⚡ Performance

### Optimization Features

- **Code Splitting**: Route-based lazy loading
- **Tree Shaking**: Dead code elimination
- **Bundle Analysis**: Webpack bundle analyzer
- **Image Optimization**: Lazy loading and WebP support
- **Memoization**: React.memo and useMemo

### Build Optimization

```typescript
// Vite build configuration
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          redux: ['@reduxjs/toolkit', 'react-redux'],
        },
      },
    },
  },
})
```

## 🔒 Security

### Security Measures

- **Input Sanitization**: XSS prevention
- **CSRF Protection**: Token validation
- **Secure Storage**: JWT in httpOnly cookies (recommended)
- **Route Guards**: Authentication checks
- **Error Boundaries**: Graceful error handling

### Environment Variables

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_APP_NAME=PERN Stack App
VITE_APP_VERSION=1.0.0
```

## 🚀 Build & Deployment

### Development Build

```bash
npm run dev
```

### Production Build

```bash
npm run build
npm run preview
```

### Deployment Options

1. **Vercel**: Zero-config deployment
2. **Netlify**: Git-based deployment
3. **Cloudflare Pages**: Edge deployment
4. **AWS S3 + CloudFront**: Custom setup

## 🔧 Development Tools

### VS Code Extensions

- **ES7+ React/Redux Snippets**: Code snippets
- **Auto Rename Tag**: HTML tag renaming
- **Tailwind CSS IntelliSense**: CSS class completion
- **TypeScript Importer**: Auto import suggestions

### Browser Extensions

- **React Developer Tools**: Component debugging
- **Redux DevTools**: State debugging
- **React Query DevTools**: Query debugging

## 🐛 Troubleshooting

### Common Issues

1. **Build Errors**
   - Check TypeScript errors: `npm run type-check`
   - Clear node_modules and reinstall
   - Update dependencies

2. **Styling Issues**
   - Rebuild Tailwind: `npx tailwindcss build`
   - Check class name conflicts
   - Verify Tailwind config

3. **API Connection**
   - Check VITE_API_BASE_URL
   - Verify backend is running
   - Check CORS configuration

4. **State Management**
   - Use Redux DevTools
   - Check action dispatching
   - Verify reducer logic

## 📚 Learning Resources

- [React Documentation](https://react.dev/)
- [Redux Toolkit Guide](https://redux-toolkit.js.org/)
- [React Query Docs](https://tanstack.com/query/latest)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Vite Guide](https://vitejs.dev/guide/)

## 🎯 Best Practices

### Component Structure

```typescript
// Component best practices
interface Props {
  title: string
  onSubmit: (data: FormData) => void
}

export const MyComponent: React.FC<Props> = ({ title, onSubmit }) => {
  // Component logic
  
  return (
    <div className="component-class">
      {/* JSX content */}
    </div>
  )
}

MyComponent.displayName = 'MyComponent'
```

### State Management

- Use local state for component-specific data
- Use Redux for global application state
- Use React Query for server state
- Keep state as flat as possible

### Performance Tips

- Use React.memo for expensive components
- Implement lazy loading for routes
- Optimize images and assets
- Use proper dependency arrays in useEffect 