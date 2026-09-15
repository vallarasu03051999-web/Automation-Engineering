import fs from 'fs';
import path from 'path';
import { EmployeeFixture } from '../types/employee';

export function loadEmployeeFixture(): EmployeeFixture {
  const filePath = path.resolve(__dirname, '../../data/employee.json');
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as EmployeeFixture;
}

export function generateUniqueEmployeeId(prefix: string): string {
  const suffix = Date.now().toString().slice(-6);
  return `${prefix}${suffix}`;
}
