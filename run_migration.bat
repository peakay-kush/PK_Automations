@echo off
REM Migration runner batch script
set DATABASE_URL=postgresql://neondb_owner:npg_LYDhC5bQg9Ol@ep-fragrant-darkness-ahx4mp1u-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require^&channel_binding=require
"C:\Program Files\nodejs\node.exe" scripts\migrate_to_postgres.js
