import { pgTable, text, serial, integer, boolean, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema with role information
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  email: text("email").notNull().unique(),
  department: text("department"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  firstName: true,
  lastName: true,
  email: true,
  isAdmin: true,
  department: true,
});

// Application schema - will be synced with Excel
export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  department: text("department").notNull(),
  url: text("url"),
  iconType: text("icon_type").default("default"),
  status: text("status").default("approved").notNull(),
  approvedDepartments: text("approved_departments").array(),
});

export const insertApplicationSchema = createInsertSchema(applications).pick({
  name: true,
  description: true,
  department: true,
  url: true,
  iconType: true,
  status: true,
  approvedDepartments: true,
});

// Request schema - for application access requests
export const requests = pgTable("requests", {
  id: serial("id").primaryKey(),
  applicationName: text("application_name").notNull(),
  department: text("department").notNull(),
  justification: text("justification").notNull(),
  applicationUrl: text("application_url"),
  status: text("status").default("pending").notNull(),
  requestedBy: integer("requested_by").notNull(),
  requestedAt: timestamp("requested_at").defaultNow().notNull(),
});

export const insertRequestSchema = createInsertSchema(requests).pick({
  applicationName: true,
  department: true,
  justification: true,
  applicationUrl: true,
  requestedBy: true,
  status: true,
});

// Activity Log schema - for tracking activity
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  action: text("action").notNull(),
  details: text("details"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).pick({
  userId: true,
  action: true,
  details: true,
});

// Hero Banner schema - for managing homepage hero banner
export const heroBannerSchema = z.object({
  title: z.string().min(1, "Title is required"),
  subtitle: z.string().min(1, "Subtitle is required"),
  brandName: z.string().min(1, "Brand name is required"),
  isActive: z.boolean().default(true),
});

// Help Content schema - for managing help documentation
export const helpContentSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  isActive: z.boolean().default(true),
});

// Department type
export type Department = string;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type Application = typeof applications.$inferSelect;
export type ApplicationWithRelations = Application;

export type InsertRequest = z.infer<typeof insertRequestSchema>;
export type Request = typeof requests.$inferSelect;

export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;
