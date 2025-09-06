import { z } from 'zod';


// Bulk user operations
export const bulkProjectActionSchema = z.object({
  projecIds: z.array(z.string().cuid('Invalid user ID')).min(1, 'At least one user ID is required'),
  action: z.enum(['activate', 'deactivate', 'delete']),
});

// Project search filters
export const userSearchFiltersSchema = z.object({
  search: z.string().optional(),
  isActive: z.boolean().optional(),
  createdAfter: z.string().datetime().optional(),
  createdBefore: z.string().datetime().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
  sortBy: z.enum(['createdAt', 'updatedAt', 'firstName', 'lastName', 'email']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});


export type BulkProjectActionDto = z.infer<typeof bulkProjectActionSchema>;
export type ProjectSearchFiltersDto = z.infer<typeof userSearchFiltersSchema>; 