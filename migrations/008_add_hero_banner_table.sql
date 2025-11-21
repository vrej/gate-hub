-- Create hero_banner table for dynamic hero content
CREATE TABLE IF NOT EXISTS hero_banner (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL DEFAULT 'WhyBrands Application Portal',
    subtitle TEXT NOT NULL DEFAULT 'Find and request access to approved software applications for your department.',
    brand_name TEXT NOT NULL DEFAULT 'WhyBrands',
    is_active BOOLEAN NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default hero banner content
INSERT INTO hero_banner (title, subtitle, brand_name, is_active) 
VALUES (
    'WhyBrands Application Portal',
    'Find and request access to approved software applications for your department.',
    'WhyBrands',
    1
);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_hero_banner_updated_at
    AFTER UPDATE ON hero_banner
    FOR EACH ROW
BEGIN
    UPDATE hero_banner SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
