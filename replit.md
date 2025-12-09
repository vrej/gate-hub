# GateHub Application Management System

## Overview

GateHub is a web application that serves as a central hub for organizing approved services and applications. The platform uses PostgreSQL database with admin-managed data, allowing users to request access to unlisted services and featuring an admin panel for data management via CSV import or manual entry.

## Key Features

- Modern dashboard interface with filtering and search capabilities
- GateHub visual identity (blue #3D96FF and green #D7FFC0)
- Role-based access control with admin and user roles
- Department-based application approval system
- CSV import/export functionality for bulk data management
- User management system for administrators

## Recent Changes (January 2025)

### ✓ Completed Terminology Update: "Category" to "Department"

- Updated database schema in shared/schema.ts from `category` to `department`
- Modified database columns via SQL ALTER commands
- Updated all frontend components:
  - search-filters.tsx: Updated placeholders and labels from "Categories" to "Departments"
  - request-form.tsx: Changed form fields and validation from category to department
  - requests-table.tsx: Updated table headers, function names, and property references
  - admin-panel.tsx: Updated interfaces and form handling
  - dashboard.tsx: Changed filtering logic from categoryFilter to departmentFilter
- Updated server-side code:
  - api-routes.ts: Modified CSV import/export handling
  - storage interfaces and implementations
- Updated validation schemas in hooks/use-excel.tsx
- Integrated centralized DEPARTMENTS constants from shared/constants.ts

### Department List

The application uses a comprehensive department list including:

- Brand Design, Ecomm, IT, Marketing, Company-wide
- HR, Legal, Accounting, Sales, Forecasting Team
- IT Helpdesk, IT Developers, Developers Helpdesk
- Customer Satisfaction, Product Development, PMO

## Project Architecture

- **Frontend**: React with TypeScript, Tailwind CSS, shadcn/ui components
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Passport.js with session-based auth
- **State Management**: TanStack React Query
- **Routing**: Wouter for client-side routing

## Database Schema

- **Users**: id, username, password, email, firstName, lastName, department, role
- **Applications**: id, name, description, department, url, status, iconType, approvedDepartments
- **Requests**: id, applicationName, department, justification, applicationUrl, status, requestedBy, requestedAt
- **Activity Logs**: id, userId, action, details, timestamp

## User Preferences

- Prefers systematic approach to code updates
- Values consistency across frontend and backend
- Appreciates clear documentation of changes
- Expects comprehensive renaming when terminology changes

## Technical Notes

- Database uses snake_case (icon_type) while TypeScript uses camelCase (iconType)
- Applications have approvedDepartments array to control department-specific access
- CSV functionality supports bulk import/export with validation
- All forms use react-hook-form with Zod validation
