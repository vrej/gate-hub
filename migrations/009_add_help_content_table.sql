-- Create help_content table for dynamic help content
CREATE TABLE IF NOT EXISTS help_content (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL DEFAULT 'Help & Support',
    content TEXT NOT NULL DEFAULT '<h2>Welcome to GateHub</h2><p>This portal helps you find and request access to approved software applications for your department.</p><h3>Getting Started</h3><ul><li>Browse available applications</li><li>Use filters to find specific tools</li><li>Request access to applications you need</li></ul><h3>Need More Help?</h3><p>Contact your IT department for additional support.</p>',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default help content
INSERT INTO help_content (title, content, is_active) 
VALUES (
    'Help & Support',
    '<h2>Welcome to GateHub</h2><p>This portal helps you find and request access to approved software applications for your department.</p><h3>Getting Started</h3><ul><li>Browse available applications</li><li>Use filters to find specific tools</li><li>Request access to applications you need</li></ul><h3>Need More Help?</h3><p>Contact your IT department for additional support.</p>',
    true
);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_help_content_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_help_content_updated_at
    BEFORE UPDATE ON help_content
    FOR EACH ROW
    EXECUTE FUNCTION update_help_content_updated_at();
