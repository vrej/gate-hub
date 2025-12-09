import { Router, Request, Response, NextFunction } from 'express';
import { storage } from './storage';
import multer from 'multer';
import { parse } from 'csv-parse';
import { stringify } from 'csv-stringify';
import { createObjectCsvStringifier } from 'csv-writer';
import { insertApplicationSchema, heroBannerSchema } from '@shared/schema';
import { z } from 'zod';

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

// In-memory storage for hero banner (persists while server is running)
let heroBannerData = [
  {
    id: 1,
    title: "Application Command Center",
    subtitle: "Find and request access to approved software applications for your department.",
    brandName: "GateHub",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// In-memory storage for help content
let helpContentData = [
  {
    id: 1,
    title: "Help & Support",
    content: "Welcome to GateHub! This portal helps you discover and request access to approved software applications.",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const apiRouter = Router();

// Get all applications
apiRouter.get('/applications', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const applications = await storage.getApplications();
    res.json(applications);
  } catch (error) {
    next(error);
  }
});

// Get application by ID
apiRouter.get('/applications/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    const application = await storage.getApplication(id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    res.json(application);
  } catch (error) {
    next(error);
  }
});

// Create new application
apiRouter.post('/applications', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request body
    try {
      const validData = insertApplicationSchema.parse(req.body);
      const application = await storage.createApplication(validData);
      res.status(201).json(application);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      throw error;
    }
  } catch (error) {
    next(error);
  }
});

// Update application
apiRouter.patch('/applications/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    // Check if application exists
    const existingApp = await storage.getApplication(id);
    if (!existingApp) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Update application
    const updatedApp = await storage.updateApplication(id, req.body);
    res.json(updatedApp);
  } catch (error) {
    next(error);
  }
});

// Delete application
apiRouter.delete('/applications/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    // Check if application exists
    const existingApp = await storage.getApplication(id);
    if (!existingApp) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Delete the application
    await storage.deleteApplication(id);
    
    // Respond with success
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

// Get all requests
apiRouter.get('/requests', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requests = await storage.getRequests();
    res.json(requests);
  } catch (error) {
    next(error);
  }
});

// Update request status
apiRouter.patch('/requests/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    // Check if request exists
    const existingRequest = await storage.getRequest(id);
    if (!existingRequest) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Update request
    const { status } = req.body;
    if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const updatedRequest = await storage.updateRequest(id, { status });
    res.json(updatedRequest);
  } catch (error) {
    next(error);
  }
});

// Import applications from CSV
apiRouter.post('/import-csv', upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Parse CSV
    const csvData = req.file.buffer.toString('utf8');
    
    // Use csv-parse to convert CSV to objects
    const parser = parse(csvData, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    const records: any[] = [];
    for await (const record of parser) {
      records.push(record);
    }

    // Validate and import records
    let importedCount = 0;
    let errors: any[] = [];

    for (const record of records) {
      // Convert string values to appropriate types if needed
      // Convert status string to enum value if needed
      const appData = {
        name: record.name,
        description: record.description,
        department: record.department,
        url: record.url,
        status: record.status || 'approved',
        iconType: record.iconType || undefined
      };

      try {
        const validData = insertApplicationSchema.parse(appData);
        await storage.createApplication(validData);
        importedCount++;
      } catch (validationError) {
        errors.push({
          record: appData,
          errors: validationError instanceof z.ZodError ? validationError.errors : validationError
        });
      }
    }

    res.json({
      success: true,
      count: importedCount,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    next(error);
  }
});

// Export applications to CSV
apiRouter.get('/export-csv', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const applications = await storage.getApplications();
    
    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="applications.csv"');
    
    // Create CSV headers
    const csvStringifier = createObjectCsvStringifier({
      header: [
        { id: 'name', title: 'Name' },
        { id: 'description', title: 'Description' },
        { id: 'department', title: 'Department' },
        { id: 'url', title: 'URL' },
        { id: 'status', title: 'Status' },
        { id: 'iconType', title: 'Icon Type' }
      ]
    });
    
    // Write CSV header and records
    const header = csvStringifier.getHeaderString();
    const records = csvStringifier.stringifyRecords(applications);
    
    res.write(header);
    res.write(records);
    res.end();
  } catch (error) {
    next(error);
  }
});

// ============================================
// HERO BANNER API ROUTES
// ============================================

// Get active hero banner (public)
apiRouter.get('/hero-banner', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const activeBanner = heroBannerData.find(b => b.isActive) || heroBannerData[0];
    res.json(activeBanner);
  } catch (error) {
    next(error);
  }
});

// Get all hero banners (admin)
apiRouter.get('/hero-banner/admin', async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(heroBannerData);
  } catch (error) {
    next(error);
  }
});

// Update hero banner
apiRouter.put('/hero-banner/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id);
    
    // Handle "undefined" as ID (when no ID is passed)
    if (isNaN(id)) {
      // Update the first/active banner
      const index = heroBannerData.findIndex(b => b.isActive) || 0;
      if (index >= 0) {
        heroBannerData[index] = {
          ...heroBannerData[index],
          ...req.body,
          updatedAt: new Date().toISOString()
        };
        return res.json(heroBannerData[index]);
      }
      return res.status(404).json({ message: 'Hero banner not found' });
    }
    
    const index = heroBannerData.findIndex(b => b.id === id);
    if (index === -1) {
      return res.status(404).json({ message: 'Hero banner not found' });
    }
    
    // If setting this banner as active, deactivate others
    if (req.body.isActive) {
      heroBannerData.forEach(b => b.isActive = false);
    }
    
    heroBannerData[index] = {
      ...heroBannerData[index],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    res.json(heroBannerData[index]);
  } catch (error) {
    next(error);
  }
});

// Create hero banner
apiRouter.post('/hero-banner', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const newId = heroBannerData.length > 0 ? Math.max(...heroBannerData.map(b => b.id)) + 1 : 1;
    const newBanner = {
      id: newId,
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // If setting this banner as active, deactivate others
    if (newBanner.isActive) {
      heroBannerData.forEach(b => b.isActive = false);
    }
    
    heroBannerData.push(newBanner);
    res.status(201).json(newBanner);
  } catch (error) {
    next(error);
  }
});

// ============================================
// HELP CONTENT API ROUTES
// ============================================

// Get active help content (public)
apiRouter.get('/help-content', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const activeContent = helpContentData.find(h => h.isActive) || helpContentData[0];
    res.json(activeContent);
  } catch (error) {
    next(error);
  }
});

// Get all help content (admin)
apiRouter.get('/help-content/admin', async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(helpContentData);
  } catch (error) {
    next(error);
  }
});

// Update help content
apiRouter.put('/help-content/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      const index = helpContentData.findIndex(h => h.isActive) || 0;
      if (index >= 0) {
        helpContentData[index] = {
          ...helpContentData[index],
          ...req.body,
          updatedAt: new Date().toISOString()
        };
        return res.json(helpContentData[index]);
      }
      return res.status(404).json({ message: 'Help content not found' });
    }
    
    const index = helpContentData.findIndex(h => h.id === id);
    if (index === -1) {
      return res.status(404).json({ message: 'Help content not found' });
    }
    
    if (req.body.isActive) {
      helpContentData.forEach(h => h.isActive = false);
    }
    
    helpContentData[index] = {
      ...helpContentData[index],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    res.json(helpContentData[index]);
  } catch (error) {
    next(error);
  }
});