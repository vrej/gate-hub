import { users, applications, requests, activityLogs } from "@shared/schema";
import type { User, InsertUser, Application, InsertApplication, Request, InsertRequest, ActivityLog, InsertActivityLog } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

const MemoryStore = createMemoryStore(session);

export const sessionStore = new MemoryStore({
  checkPeriod: 86400000, // prune expired entries every 24h
});

// Application storage
export const applicationStorage = {
  async getAll(): Promise<Application[]> {
    try {
      return await db.select().from(applications);
    } catch (error) {
      console.error('Error fetching applications:', error);
      return [];
    }
  },

  async getById(id: number): Promise<Application | undefined> {
    try {
      const result = await db.select().from(applications).where(eq(applications.id, id));
      return result[0];
    } catch (error) {
      console.error('Error fetching application:', error);
      return undefined;
    }
  },

  async create(data: InsertApplication): Promise<Application> {
    const result = await db.insert(applications).values(data).returning();
    return result[0];
  },

  async update(id: number, data: Partial<InsertApplication>): Promise<Application> {
    const result = await db.update(applications)
      .set(data)
      .where(eq(applications.id, id))
      .returning();
    return result[0];
  },

  async delete(id: number): Promise<void> {
    await db.delete(applications).where(eq(applications.id, id));
  },

  async createMany(appsData: InsertApplication[]): Promise<Application[]> {
    if (appsData.length === 0) return [];
    const result = await db.insert(applications).values(appsData).returning();
    return result;
  }
};

// User storage
export const userStorage = {
  async getAll(): Promise<User[]> {
    try {
      return await db.select().from(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  },

  async getById(id: number): Promise<User | undefined> {
    try {
      const result = await db.select().from(users).where(eq(users.id, id));
      return result[0];
    } catch (error) {
      console.error('Error fetching user:', error);
      return undefined;
    }
  },

  async getByUsername(username: string): Promise<User | undefined> {
    try {
      const result = await db.select().from(users).where(eq(users.username, username));
      return result[0];
    } catch (error) {
      console.error('Error fetching user by username:', error);
      return undefined;
    }
  },

  async getByEmail(email: string): Promise<User | undefined> {
    try {
      const result = await db.select().from(users).where(eq(users.email, email));
      return result[0];
    } catch (error) {
      console.error('Error fetching user by email:', error);
      return undefined;
    }
  },

  async create(data: InsertUser): Promise<User> {
    const result = await db.insert(users).values(data).returning();
    return result[0];
  },

  async update(id: number, data: Partial<InsertUser>): Promise<User> {
    const result = await db.update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return result[0];
  },

  async delete(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }
};

// Request storage
export const requestStorage = {
  async getAll(): Promise<Request[]> {
    try {
      return await db.select().from(requests).orderBy(desc(requests.requestedAt));
    } catch (error) {
      console.error('Error fetching requests:', error);
      return [];
    }
  },

  async getById(id: number): Promise<Request | undefined> {
    try {
      const result = await db.select().from(requests).where(eq(requests.id, id));
      return result[0];
    } catch (error) {
      console.error('Error fetching request:', error);
      return undefined;
    }
  },

  async create(data: InsertRequest): Promise<Request> {
    const result = await db.insert(requests).values(data).returning();
    return result[0];
  },

  async update(id: number, data: Partial<InsertRequest>): Promise<Request> {
    const result = await db.update(requests)
      .set(data)
      .where(eq(requests.id, id))
      .returning();
    return result[0];
  },

  async delete(id: number): Promise<void> {
    await db.delete(requests).where(eq(requests.id, id));
  }
};

// Activity log storage
export const activityLogStorage = {
  async getAll(): Promise<ActivityLog[]> {
    try {
      return await db.select().from(activityLogs).orderBy(desc(activityLogs.timestamp));
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      return [];
    }
  },

  async create(data: InsertActivityLog): Promise<ActivityLog> {
    const result = await db.insert(activityLogs).values(data).returning();
    return result[0];
  }
};

// Unified storage interface for backward compatibility
export const storage = {
  // Applications
  getApplications: applicationStorage.getAll,
  getApplicationById: applicationStorage.getById,
  createApplication: applicationStorage.create,
  updateApplication: applicationStorage.update,
  deleteApplication: applicationStorage.delete,
  createManyApplications: applicationStorage.createMany,
  
  // Users
  getUsers: userStorage.getAll,
  getUserById: userStorage.getById,
  getUserByUsername: userStorage.getByUsername,
  getUserByEmail: userStorage.getByEmail,
  createUser: userStorage.create,
  updateUser: userStorage.update,
  deleteUser: userStorage.delete,
  
  // Requests
  getRequests: requestStorage.getAll,
  getRequestById: requestStorage.getById,
  createRequest: requestStorage.create,
  updateRequest: requestStorage.update,
  deleteRequest: requestStorage.delete,
  
  // Activity Logs
  getActivityLogs: activityLogStorage.getAll,
  createActivityLog: activityLogStorage.create,
};