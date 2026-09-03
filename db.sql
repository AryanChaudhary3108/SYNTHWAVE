-- Function to generate random alphanumeric IDs
CREATE OR REPLACE FUNCTION generate_random_id()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT string_agg(
      substring('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789' FROM floor(random() * 36 + 1)::int FOR 1),
      ''
    )
    FROM generate_series(1, 6)
  );
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = 'public';

-- Table for applications
CREATE TABLE applications (
    id TEXT PRIMARY KEY DEFAULT generate_random_id(),
    user_id UUID REFERENCES auth.users (id) ON DELETE CASCADE,
    real_name TEXT NOT NULL,
    age INTEGER NOT NULL,
    discord_user_id TEXT NOT NULL,
    microphone TEXT NOT NULL,
    other_servers TEXT NOT NULL,
    memorable_scenario TEXT NOT NULL,
    character_name VARCHAR(50) NOT NULL,
    backstory TEXT NOT NULL,
    goal TEXT NOT NULL,
    fail_rp TEXT NOT NULL,
    metagaming TEXT NOT NULL,
    powergaming TEXT NOT NULL,
    scenario1 TEXT NOT NULL,
    scenario2 TEXT NOT NULL,
    scenario3 TEXT NOT NULL,
    agreement BOOLEAN NOT NULL,
    last_submit_time TIMESTAMP DEFAULT now(),
    last_cooldown_check TIMESTAMP DEFAULT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP DEFAULT now()
);

-- Create the ENUM type for admin roles
CREATE TYPE admin_role AS ENUM ('admin', 'support');

-- Create the admins table
CREATE TABLE admins (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    username TEXT NOT NULL,
    role admin_role NOT NULL
);

-- Add a unique constraint for the email column to ensure no duplicates
ALTER TABLE admins ADD CONSTRAINT unique_email UNIQUE (email);

-- Create a policy for SELECT access
CREATE POLICY select_own_admin ON admins
FOR SELECT
USING (user_id = auth.uid());

-- Create a policy for UPDATE access
CREATE POLICY update_own_admin ON admins
FOR UPDATE
USING (user_id = auth.uid());

-- Table for tickets
CREATE TABLE tickets (
    id SERIAL PRIMARY KEY,
    title VARCHAR(50) NOT NULL,
    category VARCHAR(50) NOT NULL,
    status VARCHAR(10) DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    messages JSONB DEFAULT '[]'::JSONB,
    attachments text[],
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    last_updated TIMESTAMP DEFAULT now(),
    created_at TIMESTAMP DEFAULT now()
);

-- Create the ENUM type for feature status
CREATE TYPE feature_status AS ENUM ('enabled', 'disabled');

-- Create the features table
CREATE TABLE features (
    id SERIAL PRIMARY KEY,
    feature_name TEXT UNIQUE NOT NULL,
    status feature_status DEFAULT 'disabled' NOT NULL,
    description TEXT DEFAULT '',
    cooldown_time INTEGER DEFAULT 0, -- Cooldown time in minutes
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

ALTER TABLE features ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow reading all rows
CREATE POLICY read_features_policy
ON features
FOR SELECT
USING (true); -- This allows all rows to be read

-- Create a policy to allow admins to update rows
CREATE POLICY "Allow admin to update feature status"
ON features
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM admins
    WHERE admins.user_id = auth.uid()
  )
);

-- Insert initial features
INSERT INTO features (feature_name, status, description) VALUES
('application_form', 'disabled', 'Controls whether the application form feature is enabled');

-- Enable Row-Level Security on the table
CREATE INDEX idx_applications_user_id ON applications (user_id);
CREATE INDEX idx_applications_last_submit_time ON applications (last_submit_time);

-- Enable RLS
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_own_application ON applications
FOR SELECT
USING (user_id = auth.uid());

-- Allow users to insert new applications
CREATE POLICY insert_application ON applications
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Allow users to update their own applications
CREATE POLICY update_own_application ON applications
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Allow admins to view all applications
CREATE POLICY select_all_applications_admin ON applications
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM admins
        WHERE admins.user_id = auth.uid() AND admins.role = 'admin'
    )
);

-- Allow admins to update application status
CREATE POLICY update_status_admin ON applications
FOR UPDATE
USING (
    EXISTS (
        SELECT 1
        FROM admins
        WHERE admins.user_id = auth.uid() AND admins.role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM admins
        WHERE admins.user_id = auth.uid() AND admins.role = 'admin'
    ) AND status IN ('approved', 'rejected', 'pending')
);

-- Allow admins to delete applications
CREATE POLICY delete_application_admin ON applications
FOR DELETE
USING (
    EXISTS (
        SELECT 1
        FROM admins
        WHERE admins.user_id = auth.uid() AND admins.role = 'admin'
    )
);

-- Policies for tickets
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow user to create tickets"
ON tickets
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow user to read their tickets"
ON tickets
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Allow user to update their tickets"
ON tickets
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Allow admin and support to read all tickets"
ON tickets
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM admins
    WHERE admins.user_id = auth.uid()
  )
);

CREATE POLICY "Allow admin and support to update all tickets"
ON tickets
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM admins
    WHERE admins.user_id = auth.uid()
  )
);

CREATE POLICY "Allow admin and support to delete tickets"
ON tickets
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM admins
    WHERE admins.user_id = auth.uid()
  )
);

-- Indices for faster queries
CREATE INDEX idx_tickets_user_id ON tickets(user_id);
CREATE INDEX idx_tickets_last_updated ON tickets(last_updated);
CREATE INDEX idx_tickets_messages ON tickets USING gin(messages);

-- Trigger function to enforce application cooldown
CREATE OR REPLACE FUNCTION enforce_application_cooldown()
RETURNS TRIGGER AS $$
DECLARE
  feature_cooldown INTEGER;
  last_submit TIMESTAMP;
BEGIN
  -- Get the cooldown time for the application form
  SELECT cooldown_time
  INTO feature_cooldown
  FROM features
  WHERE feature_name = 'application_form';

  -- Check the user's last application submission
  SELECT last_submit_time
  INTO last_submit
  FROM applications
  WHERE user_id = NEW.user_id
  ORDER BY last_submit_time DESC
  LIMIT 1;

  -- If within cooldown, raise an error
  IF last_submit IS NOT NULL AND feature_cooldown > 0 AND
     (now() - last_submit) < (feature_cooldown || ' days')::interval THEN
    RAISE EXCEPTION 'You must wait % days before submitting another application.', feature_cooldown;
  END IF;

  -- Update the last_cooldown_check field
  NEW.last_cooldown_check = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER check_application_cooldown
BEFORE INSERT ON applications
FOR EACH ROW
EXECUTE FUNCTION enforce_application_cooldown();
