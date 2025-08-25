import { z } from 'zod';

// Custom validation functions
export const validatePassword = (password: string): boolean => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
  return passwordRegex.test(password);
};

export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone);
};

// Enhanced password schema with strength validation
export const strongPasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must not exceed 128 characters')
  .refine(
    (password) => validatePassword(password),
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  );

// Username validation
export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must not exceed 30 characters')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens');

// Phone number validation
export const phoneSchema = z
  .string()
  .optional()
  .refine(
    (phone) => !phone || validatePhoneNumber(phone),
    'Invalid phone number format'
  );

// Name validation
export const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(50, 'Name must not exceed 50 characters')
  .regex(/^[a-zA-Z\s\-']+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes');

// Email validation with additional checks
export const emailSchema = z
  .string()
  .email('Invalid email format')
  .max(255, 'Email must not exceed 255 characters')
  .transform((email) => email.toLowerCase());

// Date of birth validation
export const dateOfBirthSchema = z
  .string()
  .optional()
  .refine(
    (date) => {
      if (!date) return true;
      const birthDate = new Date(date);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      return age >= 13 && age <= 120;
    },
    'Age must be between 13 and 120 years'
  );

// Profile update validation with enhanced fields
export const updateProfileSchema = z.object({
  firstName: nameSchema.optional(),
  lastName: nameSchema.optional(),
  email: emailSchema.optional(),
  phone: phoneSchema,
  dateOfBirth: dateOfBirthSchema,
}).strict();

// Admin user creation schema
export const createAdminUserSchema = z.object({
  email: emailSchema,
  password: strongPasswordSchema,
  firstName: nameSchema,
  lastName: nameSchema,
  role: z.enum(['USER', 'ADMIN']).default('USER'),
});

// Bulk user operations
export const bulkUserActionSchema = z.object({
  userIds: z.array(z.string().cuid('Invalid user ID')).min(1, 'At least one user ID is required'),
  action: z.enum(['activate', 'deactivate', 'delete']),
});

// User search filters
export const userSearchFiltersSchema = z.object({
  search: z.string().optional(),
  role: z.enum(['USER', 'ADMIN']).optional(),
  isActive: z.boolean().optional(),
  createdAfter: z.string().datetime().optional(),
  createdBefore: z.string().datetime().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
  sortBy: z.enum(['createdAt', 'updatedAt', 'firstName', 'lastName', 'email']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;
export type CreateAdminUserDto = z.infer<typeof createAdminUserSchema>;
export type BulkUserActionDto = z.infer<typeof bulkUserActionSchema>;
export type UserSearchFiltersDto = z.infer<typeof userSearchFiltersSchema>; 