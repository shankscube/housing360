import path from 'path';
import dotenv from 'dotenv';

// apps/api/src/config (or dist/config) -> repo root .env, shared by both apps
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
