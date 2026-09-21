import dotenv from 'dotenv';
import path from 'path';

const root = path.resolve(__dirname, '../../');
const testEnv = process.env.TEST_ENV || 'local';

// Layered load: base .env supplies defaults, then .env.<TEST_ENV> overrides
// values for that target environment (e.g. TEST_ENV=staging -> .env.staging).
// Both files are optional — dotenv silently no-ops if a file is missing, which
// keeps this working in CI where values instead come from real env vars/secrets.
dotenv.config({ path: path.join(root, '.env') });
dotenv.config({ path: path.join(root, `.env.${testEnv}`), override: true });

function readEnv(name: string, fallback: string): string {
  const value = process.env[name];
  return value === undefined || value === '' ? fallback : value;
}

export interface EnvConfig {
  testEnv: string;
  baseUrl: string;
  apiBaseUrl: string;
  adminUsername: string;
  adminPassword: string;
}

export const env: EnvConfig = {
  testEnv,
  baseUrl: readEnv('BASE_URL', 'https://opensource-demo.orangehrmlive.com'),
  apiBaseUrl: readEnv('API_BASE_URL', 'https://reqres.in'),
  adminUsername: readEnv('ADMIN_USERNAME', 'Admin'),
  adminPassword: readEnv('ADMIN_PASSWORD', 'admin123'),
};
