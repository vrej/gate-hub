-- Add addressed tracking fields to error_logs table
ALTER TABLE "error_logs" 
ADD COLUMN IF NOT EXISTS "addressed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "addressed_by" INTEGER REFERENCES "users"("id"),
ADD COLUMN IF NOT EXISTS "addressed_at" TIMESTAMP;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "idx_error_logs_addressed" ON "error_logs" ("addressed");
CREATE INDEX IF NOT EXISTS "idx_error_logs_addressed_by" ON "error_logs" ("addressed_by");
