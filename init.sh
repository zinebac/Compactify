#!/bin/bash
# ============================================================
# Compactify — PostgreSQL initialization script
# Creates app_user and app_schema.
# Table creation is delegated to Prisma (prisma db push).
#
# Runs automatically inside the postgres container on first
# start-up (via /docker-entrypoint-initdb.d/).
# Reads APP_DB_PASSWORD from the container environment.
# ============================================================
set -e

APP_DB_PASSWORD="${APP_DB_PASSWORD:-app_password}"

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
  -- Create app_user (skip if already exists)
  DO \$\$
  BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_user') THEN
      CREATE USER app_user WITH PASSWORD '${APP_DB_PASSWORD}';
    END IF;
  END
  \$\$;

  -- Grant database connection
  DO \$\$ BEGIN
    EXECUTE format('GRANT CONNECT ON DATABASE %I TO app_user', current_database());
  END \$\$;

  -- Create app_schema
  CREATE SCHEMA IF NOT EXISTS app_schema;

  -- Full permissions on the schema (allows app_user to CREATE tables via Prisma)
  GRANT ALL ON SCHEMA app_schema TO app_user;

  -- Set default search_path so Prisma targets app_schema automatically
  ALTER USER app_user SET search_path TO app_schema;
EOSQL
