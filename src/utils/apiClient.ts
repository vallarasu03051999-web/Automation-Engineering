import { APIRequestContext, APIResponse, request } from '@playwright/test';
import { env } from '../config/env';
import { logger } from './logger';

/**
 * The OrangeHRM demo instance does not expose a public, key-free REST API for
 * PIM records, so per the assessment's guidance this client simulates the
 * "validate employee via API" step against ReqRes (https://reqres.in), a
 * public test API that echoes back whatever payload it is sent. Each UI
 * lifecycle step (create/update/delete) is mirrored here so the returned
 * payload can be cross-checked against what was entered in the UI.
 */
export class ApiClient {
  private context: APIRequestContext | undefined;

  async init(): Promise<void> {
    this.context = await request.newContext({ baseURL: env.apiBaseUrl });
  }

  async dispose(): Promise<void> {
    await this.context?.dispose();
  }

  private get api(): APIRequestContext {
    if (!this.context) {
      throw new Error('ApiClient.init() must be called before making requests');
    }
    return this.context;
  }

  // Generic HTTP wrapper: every domain method below is built on top of these
  // four verbs, so logging, error handling and response parsing live in one
  // place instead of being repeated per endpoint.
  private async send(method: 'GET' | 'POST' | 'PUT' | 'DELETE', path: string, data?: unknown): Promise<APIResponse> {
    logger.debug(`API ${method} ${path}`, data ? { data } : undefined);
    const response = await this.api.fetch(path, { method, data });
    if (!response.ok()) {
      logger.error(`API ${method} ${path} failed`, { status: response.status() });
      throw new Error(`API ${method} ${path} failed with status ${response.status()}`);
    }
    return response;
  }

  async get<T>(path: string): Promise<T> {
    const response = await this.send('GET', path);
    return response.json() as Promise<T>;
  }

  async post<T>(path: string, data: unknown): Promise<T> {
    const response = await this.send('POST', path, data);
    return response.json() as Promise<T>;
  }

  async put<T>(path: string, data: unknown): Promise<T> {
    const response = await this.send('PUT', path, data);
    return response.json() as Promise<T>;
  }

  async delete(path: string): Promise<number> {
    const response = await this.send('DELETE', path);
    return response.status();
  }

  async createEmployeeRecord(payload: {
    employeeId: string;
    firstName: string;
    lastName: string;
  }): Promise<{ id: string; firstName: string; lastName: string; employeeId: string }> {
    return this.post('/api/users', payload);
  }

  async updateEmployeeRecord(
    recordId: string,
    payload: { jobTitle: string; employmentStatus: string },
  ): Promise<{ jobTitle: string; employmentStatus: string }> {
    return this.put(`/api/users/${recordId}`, payload);
  }

  async deleteEmployeeRecord(recordId: string): Promise<number> {
    return this.delete(`/api/users/${recordId}`);
  }
}
