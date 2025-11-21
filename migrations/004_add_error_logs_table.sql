-- Create error_logs table for system error tracking
CREATE TABLE IF NOT EXISTS "error_logs" (
  "id" SERIAL PRIMARY KEY,
  "level" VARCHAR(20) NOT NULL DEFAULT 'error',
  "message" TEXT NOT NULL,
  "stack" TEXT,
  "context" VARCHAR(100),
  "user_id" INTEGER REFERENCES "users"("id"),
  "request_id" VARCHAR(100),
  "metadata" JSON,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "idx_error_logs_created_at" ON "error_logs" ("created_at");
CREATE INDEX IF NOT EXISTS "idx_error_logs_level" ON "error_logs" ("level");
CREATE INDEX IF NOT EXISTS "idx_error_logs_context" ON "error_logs" ("context");
CREATE INDEX IF NOT EXISTS "idx_error_logs_user_id" ON "error_logs" ("user_id");
