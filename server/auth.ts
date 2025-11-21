import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

async function hashPassword(password: string) {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

async function comparePasswords(supplied: string, stored: string) {
  return bcrypt.compare(supplied, stored);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "whybrands-session-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      secure: process.env.NODE_ENV === "production",
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        // Try to find user by username first, then by email
        let user = await storage.getUserByUsername(username);
        
        // If not found by username, try email
        if (!user) {
          user = await storage.getUserByEmail(username);
        }
        
        // Check if user exists and password matches
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Invalid username/email or password" });
        } else {
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Auth routes
  app.post("/api/register", async (req, res, next) => {
    try {
      const { username, password, firstName, lastName, email } = req.body;
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already in use" });
      }
      
      // Create new user with hashed password
      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        username,
        password: hashedPassword,
        firstName,
        lastName,
        email,
        isAdmin: false, // Default to non-admin
      });
      
      // Create activity log
      await storage.createActivityLog({
        userId: user.id,
        action: "REGISTER",
        details: `User ${username} registered`,
      });
      
      // Log in the user
      req.login(user, (err) => {
        if (err) return next(err);
        
        // Return user without password
        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info?.message || "Authentication failed" });
      
      req.login(user, async (loginErr) => {
        if (loginErr) return next(loginErr);
        
        // Create activity log
        await storage.createActivityLog({
          userId: user.id,
          action: "LOGIN",
          details: `User ${user.username} logged in`,
        });
        
        // Return user without password
        const { password, ...userWithoutPassword } = user;
        res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/logout", async (req, res, next) => {
    if (req.user) {
      const userId = req.user.id;
      const username = req.user.username;
      
      req.logout((err) => {
        if (err) return next(err);
        
        // Create activity log asynchronously
        storage.createActivityLog({
          userId,
          action: "LOGOUT",
          details: `User ${username} logged out`,
        }).catch(console.error);
        
        res.sendStatus(200);
      });
    } else {
      res.sendStatus(200);
    }
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    // Return user without password
    const { password, ...userWithoutPassword } = req.user as SelectUser;
    res.json(userWithoutPassword);
  });
  
  // Admin route to get all users
  app.get("/api/users", async (req, res) => {
    if (!req.isAuthenticated() || !(req.user as SelectUser).isAdmin) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    try {
      const users = await storage.getUsers();
      // Remove passwords before sending
      const sanitizedUsers = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.json(sanitizedUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve users" });
    }
  });
  
  // Admin route to create a new user
  app.post("/api/admin/users", async (req, res, next) => {
    // Check if the user is authenticated and an admin
    if (!req.isAuthenticated() || !(req.user as SelectUser).isAdmin) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    try {
      const { username, password, firstName, lastName, email, isAdmin, department } = req.body;
      
      // Validate required fields
      if (!username || !password || !firstName || !lastName || !email) {
        return res.status(400).json({ message: "All required fields must be provided" });
      }
      
      // Check for duplicate users
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already in use" });
      }
      
      // Create the new user
      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        username,
        password: hashedPassword,
        firstName,
        lastName,
        email,
        isAdmin: isAdmin || false,
        department
      });
      
      // Log this activity
      await storage.createActivityLog({
        userId: req.user.id,
        action: "CREATE_USER",
        details: `Admin created user: ${username}`,
      });
      
      // Return the created user without password
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  });
}
