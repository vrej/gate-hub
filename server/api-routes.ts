import { Router, Request, Response, NextFunction } from 'express';
import { storage } from './storage';
import multer from 'multer';
import { parse } from 'csv-parse';
import { stringify } from 'csv-stringify';
import { createObjectCsvStringifier } from 'csv-writer';
import { insertApplicationSchema } from '@shared/schema';
import { z } from 'zod';

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

// We've replaced this with direct Zod validation in the import handler

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