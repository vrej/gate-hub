-- Create statuses table
CREATE TABLE IF NOT EXISTS statuses (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#3b82f6' NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Insert default statuses
INSERT INTO statuses (name, description, color) VALUES
  ('approved', 'Application is approved for use', '#10b981'),
  ('pending', 'Application is pending review', '#f59e0b'),
  ('restricted', 'Application is restricted', '#ef4444')
ON CONFLICT (name) DO NOTHING;

