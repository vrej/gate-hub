
import { db } from "./db";
import type { User, InsertUser, Application, InsertApplication, Request, InsertRequest, ActivityLog, InsertActivityLog } from "@shared/schema";
import { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    this.sessionStore = null; // We'll use a simple in-memory session for now
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const userKey = `user:${id}`;
    const userData = await db.get(userKey);
    if (!userData) return undefined;
    
    try {
      // Handle Replit database response format
      let rawData = userData;
      if (typeof userData === 'object' && userData.value !== undefined) {
        rawData = userData.value;
      }
      
      return typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
    } catch (error) {
      console.error(`Error parsing user data for ID ${id}:`, error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const users = await this.getUsers();
    return users.find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const users = await this.getUsers();
    return users.find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const users = await this.getUsers();
    const newId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
    const user: User = {
      id: newId,
      isAdmin: false,
      ...insertUser
    };
    
    await db.set(`user:${newId}`, JSON.stringify(user));
    
    // Update users list
    const updatedUsers = [...users, user];
    await db.set('users:list', JSON.stringify(updatedUsers.map(u => u.id)));
    
    return user;
  }

  async getUsers(): Promise<User[]> {
    const userIds = await db.get('users:list');
    if (!userIds) return [];
    
    let ids;
    try {
      // Handle Replit database response format
      let rawData = userIds;
      if (typeof userIds === 'object' && userIds.value !== undefined) {
        rawData = userIds.value;
      }
      
      ids = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
    } catch (error) {
      console.error('Error parsing user IDs:', error);
      return [];
    }
    
    const users: User[] = [];
    
    for (const id of ids) {
      const userData = await db.get(`user:${id}`);
      if (userData) {
        try {
          const user = typeof userData === 'string' ? JSON.parse(userData) : userData;
          users.push(user);
        } catch (error) {
          console.error(`Error parsing user data for ID ${id}:`, error);
        }
      }
    }
    
    return users;
  }

  // Application methods
  async getApplications(): Promise<Application[]> {
    console.log('Getting applications...');
    const appIds = await db.get('applications:list');
    console.log('Raw applications list from DB:', appIds);
    
    if (!appIds) {
      console.log('No applications list found, initializing empty list');
      // Initialize empty applications list if it doesn't exist
      await db.set('applications:list', JSON.stringify([]));
      return [];
    }
    
    let ids;
    try {
      // Handle Replit database response format - check for .ok and .value properties
      let rawData = appIds;
      if (typeof appIds === 'object' && appIds.ok === true && appIds.value !== undefined) {
        rawData = appIds.value;
        console.log('Extracted value from Replit DB response:', rawData);
      } else if (typeof appIds === 'object' && appIds.value !== undefined) {
        rawData = appIds.value;
        console.log('Extracted value (no ok flag):', rawData);
      }
      
      ids = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
      console.log('Parsed IDs:', ids);
    } catch (error) {
      console.error('Error parsing application IDs:', error);
      // Reset to empty array if corrupted
      await db.set('applications:list', JSON.stringify([]));
      return [];
    }
    
    // Ensure ids is an array
    if (!Array.isArray(ids)) {
      console.error('Application IDs is not an array:', ids);
      // Reset to empty array if not an array
      await db.set('applications:list', JSON.stringify([]));
      return [];
    }
    
    const applications: Application[] = [];
    console.log('Processing application IDs:', ids);
    
    for (const id of ids) {
      console.log(`Fetching application ${id}...`);
      const appData = await db.get(`application:${id}`);
      console.log(`Raw data for application ${id}:`, appData);
      
      if (appData) {
        try {
          // Handle Replit database response format
          let rawData = appData;
          if (typeof appData === 'object' && appData.ok === true && appData.value !== undefined) {
            rawData = appData.value;
          } else if (typeof appData === 'object' && appData.value !== undefined) {
            rawData = appData.value;
          }
          
          const app = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
          console.log(`Parsed application ${id}:`, app);
          applications.push(app);
        } catch (error) {
          console.error(`Error parsing application data for ID ${id}:`, error);
        }
      } else {
        console.log(`No data found for application ${id}`);
      }
    }
    
    console.log('Final applications array:', applications);
    return applications;
  }

  async getApplication(id: number): Promise<Application | undefined> {
    const appKey = `application:${id}`;
    const appData = await db.get(appKey);
    if (!appData) return undefined;
    
    try {
      // Handle Replit database response format
      let rawData = appData;
      if (typeof appData === 'object' && appData.ok === true && appData.value !== undefined) {
        rawData = appData.value;
      } else if (typeof appData === 'object' && appData.value !== undefined) {
        rawData = appData.value;
      }
      
      return typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
    } catch (error) {
      console.error(`Error parsing application data for ID ${id}:`, error);
      return undefined;
    }
  }

  async createApplication(insertApp: InsertApplication): Promise<Application> {
    console.log('Creating application with data:', insertApp);
    
    const applications = await this.getApplications();
    const newId = applications.length > 0 ? Math.max(...applications.map(a => a.id)) + 1 : 1;
    const application: Application = {
      id: newId,
      iconType: "default",
      status: "approved",
      approvedDepartments: [],
      ...insertApp
    };
    
    console.log('Saving application:', application);
    
    // Save the application
    await db.set(`application:${newId}`, JSON.stringify(application));
    
    // Get current applications list
    let currentIds = [];
    try {
      const existingIds = await db.get('applications:list');
      console.log('Existing IDs response:', existingIds);
      if (existingIds) {
        let rawData = existingIds;
        if (typeof existingIds === 'object' && existingIds.ok === true && existingIds.value !== undefined) {
          rawData = existingIds.value;
        } else if (typeof existingIds === 'object' && existingIds.value !== undefined) {
          rawData = existingIds.value;
        }
        currentIds = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
        if (!Array.isArray(currentIds)) {
          currentIds = [];
        }
      }
    } catch (error) {
      console.error('Error getting current applications list:', error);
      currentIds = [];
    }
    
    // Add new ID if not already present
    if (!currentIds.includes(newId)) {
      currentIds.push(newId);
      await db.set('applications:list', JSON.stringify(currentIds));
      console.log('Updated applications list with new ID:', currentIds);
    }
    
    console.log('Application created successfully with ID:', newId);
    return application;
  }

  async updateApplication(id: number, application: Partial<InsertApplication>): Promise<Application | undefined> {
    const existing = await this.getApplication(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...application };
    await db.set(`application:${id}`, JSON.stringify(updated));
    return updated;
  }

  async deleteApplication(id: number): Promise<boolean> {
    const existing = await this.getApplication(id);
    if (!existing) return false;
    
    await db.delete(`application:${id}`);
    
    // Update applications list
    const applications = await this.getApplications();
    const updatedIds = applications.filter(a => a.id !== id).map(a => a.id);
    await db.set('applications:list', JSON.stringify(updatedIds));
    
    return true;
  }

  // Request methods
  async getRequests(): Promise<Request[]> {
    const requestIds = await db.get('requests:list');
    if (!requestIds) {
      // Initialize empty requests list if it doesn't exist
      await db.set('requests:list', JSON.stringify([]));
      return [];
    }
    
    let ids;
    try {
      // Handle Replit database response format
      let rawData = requestIds;
      if (typeof requestIds === 'object' && requestIds.value !== undefined) {
        rawData = requestIds.value;
      }
      
      ids = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
    } catch (error) {
      console.error('Error parsing request IDs:', error);
      // Reset to empty array if corrupted
      await db.set('requests:list', JSON.stringify([]));
      return [];
    }
    
    // Ensure ids is an array
    if (!Array.isArray(ids)) {
      console.error('Request IDs is not an array:', ids);
      // Reset to empty array if not an array
      await db.set('requests:list', JSON.stringify([]));
      return [];
    }
    
    const requests: Request[] = [];
    
    for (const id of ids) {
      const requestData = await db.get(`request:${id}`);
      if (requestData) {
        try {
          const request = typeof requestData === 'string' ? JSON.parse(requestData) : requestData;
          requests.push(request);
        } catch (error) {
          console.error(`Error parsing request data for ID ${id}:`, error);
        }
      }
    }
    
    return requests;
  }

  async getRequest(id: number): Promise<Request | undefined> {
    const requestKey = `request:${id}`;
    const requestData = await db.get(requestKey);
    if (!requestData) return undefined;
    
    try {
      // Handle Replit database response format
      let rawData = requestData;
      if (typeof requestData === 'object' && requestData.value !== undefined) {
        rawData = requestData.value;
      }
      
      return typeof rawData === 'string' ? JSON.parse(rawData) : requestData;
    } catch (error) {
      console.error(`Error parsing request data for ID ${id}:`, error);
      return undefined;
    }
  }

  async createRequest(insertRequest: InsertRequest): Promise<Request> {
    const requests = await this.getRequests();
    const newId = requests.length > 0 ? Math.max(...requests.map(r => r.id)) + 1 : 1;
    const request: Request = {
      id: newId,
      requestedAt: new Date(),
      status: "pending",
      ...insertRequest
    };
    
    await db.set(`request:${newId}`, JSON.stringify(request));
    
    // Update requests list
    const updatedRequests = [...requests, request];
    await db.set('requests:list', JSON.stringify(updatedRequests.map(r => r.id)));
    
    return request;
  }

  async updateRequest(id: number, request: Partial<InsertRequest>): Promise<Request | undefined> {
    const existing = await this.getRequest(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...request };
    await db.set(`request:${id}`, JSON.stringify(updated));
    return updated;
  }

  // Activity log methods
  async createActivityLog(insertLog: InsertActivityLog): Promise<ActivityLog> {
    const logs = await this.getActivityLogs();
    const newId = logs.length > 0 ? Math.max(...logs.map(l => l.id)) + 1 : 1;
    const log: ActivityLog = {
      id: newId,
      timestamp: new Date(),
      ...insertLog
    };
    
    await db.set(`activityLog:${newId}`, JSON.stringify(log));
    
    // Update logs list
    const updatedLogs = [...logs, log];
    await db.set('activityLogs:list', JSON.stringify(updatedLogs.map(l => l.id)));
    
    return log;
  }

  async getActivityLogs(): Promise<ActivityLog[]> {
    const logIds = await db.get('activityLogs:list');
    if (!logIds) return [];
    
    let ids;
    try {
      // Handle Replit database response format
      let rawData = logIds;
      if (typeof logIds === 'object' && logIds.value !== undefined) {
        rawData = logIds.value;
      }
      
      ids = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
    } catch (error) {
      console.error('Error parsing activity log IDs:', error);
      return [];
    }
    
    const logs: ActivityLog[] = [];
    
    for (const id of ids) {
      const logData = await db.get(`activityLog:${id}`);
      if (logData) {
        try {
          const log = typeof logData === 'string' ? JSON.parse(logData) : logData;
          logs.push(log);
        } catch (error) {
          console.error(`Error parsing activity log data for ID ${id}:`, error);
        }
      }
    }
    
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
}
