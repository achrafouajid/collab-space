import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  status: z.enum(["PLANNING", "IN_PROGRESS", "COMPLETED"]).default("PLANNING"),
  dueDate: z.string().transform((val) => new Date(val)),
});

export type CreateProjectDto = z.infer<typeof createProjectSchema>;

export interface ProjectResponseDto {
  id: string;
  name: string;
  description: string;
  status: string;
  progress: number;
  dueDate: Date;
  metrics: {
    completed: number;
    inProgress: number;
    overdue: number;
  };
  team: { id: string; firstName: string; lastName: string }[];
}
