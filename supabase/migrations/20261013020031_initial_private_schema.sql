-- Reviewed forward migration. Execute with a dedicated migration owner, never the web role.
CREATE SCHEMA IF NOT EXISTS behind_private;
REVOKE ALL ON SCHEMA behind_private FROM PUBLIC;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='behind_runtime') THEN
    CREATE ROLE behind_runtime NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN
    REVOKE ALL ON SCHEMA behind_private FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN
    REVOKE ALL ON SCHEMA behind_private FROM authenticated;
  END IF;
END $$;
CREATE TABLE behind_private.profiles (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), issuer text NOT NULL CHECK(length(issuer) BETWEEN 8 AND 2048), subject text NOT NULL CHECK(length(subject) BETWEEN 1 AND 255), created_at timestamptz NOT NULL DEFAULT now(), CONSTRAINT identity_unique UNIQUE(issuer,subject)
);
CREATE TABLE behind_private.preferences (
 user_id uuid PRIMARY KEY REFERENCES behind_private.profiles(id) ON DELETE CASCADE, reduced_motion boolean NOT NULL DEFAULT false, updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE behind_private.inquiries (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), request_id uuid NOT NULL UNIQUE, payload_hash text NOT NULL CHECK(length(payload_hash)=64), user_id uuid REFERENCES behind_private.profiles(id) ON DELETE SET NULL,
 name text NOT NULL CHECK(length(name) BETWEEN 2 AND 100), email text NOT NULL CHECK(length(email)<=254), topic text NOT NULL CHECK(topic IN ('General inquiry','Software & AI','Collaboration','Privacy')), message text NOT NULL CHECK(length(message) BETWEEN 20 AND 5000), status text NOT NULL DEFAULT 'new' CHECK(status IN ('new','in_progress','closed')), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX inquiries_created ON behind_private.inquiries(created_at DESC);
CREATE INDEX inquiries_user ON behind_private.inquiries(user_id);
CREATE TABLE behind_private.audit_records (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), actor_id uuid REFERENCES behind_private.profiles(id) ON DELETE SET NULL, event text NOT NULL CHECK(length(event)<=100), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_created ON behind_private.audit_records(created_at);
REVOKE ALL ON ALL TABLES IN SCHEMA behind_private FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA behind_private REVOKE ALL ON TABLES FROM PUBLIC;
GRANT USAGE ON SCHEMA behind_private TO behind_runtime;
GRANT SELECT,INSERT,UPDATE,DELETE ON behind_private.profiles,behind_private.preferences,behind_private.inquiries TO behind_runtime;
GRANT INSERT ON behind_private.audit_records TO behind_runtime;
-- Private schema is never exposed through PostgREST. Web DAL is the ownership boundary.
-- There are no public/exposed tables and no Supabase Auth policies.
