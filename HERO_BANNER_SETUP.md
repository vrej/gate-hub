# Hero Banner Dynamic Content Setup

## Overview

The hero banner functionality allows administrators to dynamically update the main page hero section content through the admin panel.

## Database Migration

✅ **COMPLETED**: The hero banner table has been successfully created in the database.

### Manual Migration (Already Done)

The following SQL commands were executed to create the hero banner table:

```sql
-- Create hero_banner table for dynamic hero content
CREATE TABLE IF NOT EXISTS hero_banner (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL DEFAULT 'WhyBrands Application Portal',
    subtitle TEXT NOT NULL DEFAULT 'Find and request access to approved software applications for your department.',
    brand_name TEXT NOT NULL DEFAULT 'WhyBrands',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default hero banner content
INSERT INTO hero_banner (title, subtitle, brand_name, is_active)
VALUES (
    'WhyBrands Application Portal',
    'Find and request access to approved software applications for your department.',
    'WhyBrands',
    true
);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_hero_banner_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_hero_banner_updated_at
    BEFORE UPDATE ON hero_banner
    FOR EACH ROW
    EXECUTE FUNCTION update_hero_banner_updated_at();
```

### Using Drizzle Kit (Alternative)

```bash
# Generate migration
npx drizzle-kit generate

# Push to database
npx drizzle-kit push
```

## Features

### Admin Panel

- **Hero Banner Card**: Located in the admin actions section
- **Edit Button**: Opens modal to customize hero banner content
- **Live Preview**: Shows real-time preview of changes

### Modal Fields

- **Brand Name**: The company/brand name (e.g., "WhyBrands")
- **Title**: The main title text (will be combined with brand name)
- **Subtitle**: The descriptive text below the title
- **Active Status**: Toggle to activate/deactivate the banner

### API Endpoints

- `GET /api/hero-banner` - Get active hero banner (public)
- `GET /api/hero-banner/admin` - Get all hero banners (admin only)
- `PUT /api/hero-banner/:id` - Update hero banner (admin only)

## Usage

1. **Access Admin Panel**: Navigate to `/admin` as an administrator
2. **Find Hero Banner Card**: Look for the "Hero Banner" card in the admin actions section
3. **Click Edit**: Click "Edit Hero Banner" button
4. **Customize Content**:
   - Update brand name (e.g., "WhyBrands")
   - Update title (e.g., "Application Portal")
   - Update subtitle description
   - Toggle active status
5. **Preview Changes**: Use "Show Preview" button to see live preview
6. **Save**: Click "Update Hero Banner" to save changes

## Frontend Integration

The hero banner content is automatically loaded and displayed on the main applications page (`/`). The system falls back to default values if no active banner is found.

### Dynamic Content

- **Title**: Combines brand name with title text
- **Subtitle**: Shows the descriptive text
- **Responsive**: Works across all device sizes

## Database Schema

```typescript
interface HeroBanner {
  id: number;
  title: string;
  subtitle: string;
  brandName: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

## Security

- Only administrators can modify hero banner content
- All API endpoints are protected with `requireAdmin` middleware
- Form validation using Zod schemas

## Troubleshooting

### Migration Issues

- Ensure database connection is working
- Check if table already exists
- Verify PostgreSQL permissions

### Content Not Updating

- Check if banner is marked as active
- Verify API endpoint responses
- Clear browser cache
- Check for JavaScript errors in console

### Preview Not Working

- Ensure all required fields are filled
- Check form validation errors
- Verify modal is properly rendered
