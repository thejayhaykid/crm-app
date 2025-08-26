import { z } from 'zod';

// Auth schemas
export const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Contact schemas
export const contactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  company: z.string().optional(),
  title: z.string().optional(),
  address: z.string().optional(),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
});

export const updateContactSchema = contactSchema.partial().extend({
  id: z.string().cuid(),
});

// Opportunity schemas
export const opportunitySchema = z.object({
  contactId: z.string().cuid().optional(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  value: z.number().positive('Value must be positive').optional(),
  currency: z.string().default('USD'),
  status: z.enum([
    'lead',
    'qualified',
    'proposal',
    'negotiating',
    'closed-won',
    'closed-lost',
  ]).default('lead'),
  probability: z.number().min(0).max(100).default(10),
  closeDate: z.date().optional(),
  stageOrder: z.number().default(0),
  wonDate: z.date().optional(),
  lostReason: z.string().optional(),
});

export const opportunityStatusUpdateSchema = z.object({
  id: z.string().cuid(),
  status: z.enum(['lead', 'qualified', 'proposal', 'negotiating', 'closed-won', 'closed-lost']),
  stageOrder: z.number(),
  wonDate: z.date().optional(),
  lostReason: z.string().optional(),
});

export const updateOpportunitySchema = opportunitySchema.partial().extend({
  id: z.string().cuid(),
});

// Communication schemas
export const communicationSchema = z.object({
  contactId: z.string().cuid().optional(),
  opportunityId: z.string().cuid().optional(),
  type: z.enum(['email', 'phone', 'meeting', 'task']),
  direction: z.enum(['inbound', 'outbound']),
  subject: z.string().optional(),
  content: z.string().optional(),
  scheduledDate: z.date().optional(),
  completedDate: z.date().optional(),
});

export const updateCommunicationSchema = communicationSchema.partial().extend({
  id: z.string().cuid(),
});

// Activity schemas
export const activitySchema = z.object({
  contactId: z.string().cuid().optional(),
  opportunityId: z.string().cuid().optional(),
  type: z.enum(['call', 'email', 'meeting', 'task', 'note']),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  dueDate: z.date().optional(),
  completedAt: z.date().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
});

export const updateActivitySchema = activitySchema.partial().extend({
  id: z.string().cuid(),
});

// Note schemas
export const noteSchema = z.object({
  contactId: z.string().cuid().optional(),
  opportunityId: z.string().cuid().optional(),
  content: z.string().min(1, 'Content is required'),
});

export const updateNoteSchema = noteSchema.partial().extend({
  id: z.string().cuid(),
});

// Tag schemas
export const tagSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').default('#3B82F6'),
});

export const updateTagSchema = tagSchema.partial().extend({
  id: z.string().cuid(),
});

// Document schemas
export const documentSchema = z.object({
  contactId: z.string().cuid().optional(),
  opportunityId: z.string().cuid().optional(),
  filename: z.string().min(1, 'Filename is required'),
  originalName: z.string().min(1, 'Original name is required'),
  mimeType: z.string().min(1, 'MIME type is required'),
  size: z.number().positive('Size must be positive'),
  uploadPath: z.string().min(1, 'Upload path is required'),
});

// Search and filter schemas
export const contactSearchSchema = z.object({
  query: z.string().optional(),
  company: z.string().optional(),
  tags: z.array(z.string().cuid()).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

export const opportunitySearchSchema = z.object({
  query: z.string().optional(),
  status: z.string().optional(),
  contactId: z.string().cuid().optional(),
  tags: z.array(z.string().cuid()).optional(),
  minValue: z.number().optional(),
  maxValue: z.number().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

// Dashboard schemas
export const dateRangeSchema = z.object({
  from: z.date(),
  to: z.date(),
});

// Types
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;
export type OpportunityInput = z.infer<typeof opportunitySchema>;
export type UpdateOpportunityInput = z.infer<typeof updateOpportunitySchema>;
export type CommunicationInput = z.infer<typeof communicationSchema>;
export type UpdateCommunicationInput = z.infer<typeof updateCommunicationSchema>;
export type ActivityInput = z.infer<typeof activitySchema>;
export type UpdateActivityInput = z.infer<typeof updateActivitySchema>;
export type NoteInput = z.infer<typeof noteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
export type TagInput = z.infer<typeof tagSchema>;
export type UpdateTagInput = z.infer<typeof updateTagSchema>;
export type DocumentInput = z.infer<typeof documentSchema>;
export type ContactSearchInput = z.infer<typeof contactSearchSchema>;
export type OpportunitySearchInput = z.infer<typeof opportunitySearchSchema>;
export type DateRangeInput = z.infer<typeof dateRangeSchema>;