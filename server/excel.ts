import { Client } from "@microsoft/microsoft-graph-client";
import { TokenCredentialAuthenticationProvider } from "@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials";
import { ClientSecretCredential } from "@azure/identity";
import { Application, Request, insertApplicationSchema } from "@shared/schema";
import { storage } from "./storage";

// SharePoint Excel integration
export class ExcelService {
  private client: Client | null = null;
  private initialized = false;
  private siteId: string;
  private driveId: string;
  private fileId: string;
  private workbookId: string;

  constructor() {
    this.siteId = process.env.SHAREPOINT_SITE_ID || "";
    this.driveId = process.env.SHAREPOINT_DRIVE_ID || "";
    this.fileId = process.env.SHAREPOINT_FILE_ID || "";
    this.workbookId = process.env.SHAREPOINT_WORKBOOK_ID || "";
  }

  async initialize() {
    if (this.initialized) return;

    try {
      const tenantId = process.env.MICROSOFT_TENANT_ID;
      const clientId = process.env.MICROSOFT_CLIENT_ID;
      const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;

      if (!tenantId || !clientId || !clientSecret) {
        console.log("Microsoft Graph API credentials not configured");
        this.initialized = false;
        return;
      }

      const credential = new ClientSecretCredential(
        tenantId,
        clientId,
        clientSecret
      );

      const authProvider = new TokenCredentialAuthenticationProvider(credential, {
        scopes: ["https://graph.microsoft.com/.default"]
      });

      this.client = Client.initWithMiddleware({
        authProvider,
      });

      this.initialized = true;
      console.log("Excel service initialized");
    } catch (error) {
      console.error("Failed to initialize Excel service:", error);
      this.initialized = false;
    }
  }

  private async ensureInitialized() {
    if (!this.initialized) {
      await this.initialize();
    }
    
    if (!this.client) {
      throw new Error("Excel service not initialized");
    }
  }

  // Get applications from SharePoint Excel
  async getApplicationsFromExcel(): Promise<Application[]> {
    try {
      await this.ensureInitialized();
      
      if (!this.client) {
        console.log("Falling back to in-memory storage for applications");
        return storage.getApplications();
      }

      // Read from Excel table - this endpoint path may need to be adjusted based on your SharePoint configuration
      const response = await this.client.api(`/sites/${this.siteId}/drives/${this.driveId}/items/${this.fileId}/workbook/worksheets/Applications/usedRange`)
        .get();

      const rows = response.values;
      // Skip header row
      const dataRows = rows.slice(1);

      // Map Excel data to Application objects
      const applications: Application[] = dataRows.map((row: any[], index: number) => {
        return {
          id: index + 1,
          name: row[0] || "",
          description: row[1] || "",
          category: row[2] || "",
          url: row[3] || "",
          iconType: row[4] || "default",
          status: row[5] || "approved"
        };
      });

      return applications;

    } catch (error) {
      console.error("Failed to fetch applications from Excel:", error);
      // Fallback to in-memory storage
      return storage.getApplications();
    }
  }

  // Add a new application to SharePoint Excel
  async addApplicationToExcel(application: Application): Promise<boolean> {
    try {
      await this.ensureInitialized();
      
      if (!this.client) {
        return false;
      }

      // Format data for Excel
      const rowData = [
        application.name,
        application.description,
        application.category,
        application.url || "",
        application.iconType || "default",
        application.status || "approved"
      ];

      // Add row to Excel
      await this.client.api(`/sites/${this.siteId}/drives/${this.driveId}/items/${this.fileId}/workbook/worksheets/Applications/tables/Table1/rows`)
        .post({
          values: [rowData]
        });

      return true;
    } catch (error) {
      console.error("Failed to add application to Excel:", error);
      return false;
    }
  }

  // Get requests from SharePoint Excel
  async getRequestsFromExcel(): Promise<Request[]> {
    try {
      await this.ensureInitialized();
      
      if (!this.client) {
        console.log("Falling back to in-memory storage for requests");
        return storage.getRequests();
      }

      // Read from Excel table
      const response = await this.client.api(`/sites/${this.siteId}/drives/${this.driveId}/items/${this.fileId}/workbook/worksheets/Requests/usedRange`)
        .get();

      const rows = response.values;
      // Skip header row
      const dataRows = rows.slice(1);

      // Map Excel data to Request objects
      const requests: Request[] = dataRows.map((row: any[], index: number) => {
        return {
          id: index + 1,
          applicationName: row[0] || "",
          category: row[1] || "",
          justification: row[2] || "",
          applicationUrl: row[3] || "",
          status: row[4] || "pending",
          requestedBy: parseInt(row[5]) || 1,
          requestedAt: new Date(row[6] || Date.now())
        };
      });

      return requests;

    } catch (error) {
      console.error("Failed to fetch requests from Excel:", error);
      // Fallback to in-memory storage
      return storage.getRequests();
    }
  }

  // Add a new request to SharePoint Excel
  async addRequestToExcel(request: Request): Promise<boolean> {
    try {
      await this.ensureInitialized();
      
      if (!this.client) {
        return false;
      }

      // Format data for Excel
      const rowData = [
        request.applicationName,
        request.category,
        request.justification,
        request.applicationUrl || "",
        request.status || "pending",
        request.requestedBy.toString(),
        request.requestedAt.toISOString()
      ];

      // Add row to Excel
      await this.client.api(`/sites/${this.siteId}/drives/${this.driveId}/items/${this.fileId}/workbook/worksheets/Requests/tables/Table2/rows`)
        .post({
          values: [rowData]
        });

      return true;
    } catch (error) {
      console.error("Failed to add request to Excel:", error);
      return false;
    }
  }

  // Update request status in SharePoint Excel
  async updateRequestStatusInExcel(requestId: number, status: string): Promise<boolean> {
    try {
      await this.ensureInitialized();
      
      if (!this.client) {
        return false;
      }

      // Find the specific row - this is approximate as Excel doesn't have direct row indexing
      const allRequests = await this.getRequestsFromExcel();
      const targetRequest = allRequests.find(req => req.id === requestId);
      
      if (!targetRequest) {
        return false;
      }
      
      const rowIndex = allRequests.indexOf(targetRequest) + 2; // +2 because Excel is 1-based and we have a header row
      
      // Update cell 
      await this.client.api(`/sites/${this.siteId}/drives/${this.driveId}/items/${this.fileId}/workbook/worksheets/Requests/range(address='E${rowIndex}')`)
        .patch({
          values: [[status]]
        });

      return true;
    } catch (error) {
      console.error("Failed to update request status in Excel:", error);
      return false;
    }
  }
}

export const excelService = new ExcelService();
