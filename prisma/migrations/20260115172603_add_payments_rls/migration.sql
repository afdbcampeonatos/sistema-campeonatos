-- Enable RLS on payments table
ALTER TABLE "payments" ENABLE ROW LEVEL SECURITY;

-- Create policy to restrict access to Service Role only
-- This ensures that only the server (via Prisma/Server Actions) can access this table
-- Public users (via Supabase Client) will have no access
CREATE POLICY "Enable access to service_role" ON "payments"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
