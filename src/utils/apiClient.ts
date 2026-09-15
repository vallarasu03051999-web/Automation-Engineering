import { APIRequestContext, request } from '@playwright/test';

/**
 * The OrangeHRM demo instance does not expose a public, key-free REST API for
 * PIM records, so per the assessment's guidance this client simulates the
 * "validate employee via API" step against ReqRes (https://reqres.in), a
 * public test API that echoes back whatever payload it is sent. Each UI
 * lifecycle step (create/update/delete) is mirrored here so the returned
 * payload can be cross-checked against what was entered in the UI.
 */
export class ApiClient {
  // Deliberately just the origin: a request path starting with "/" is resolved as an
  // absolute path against this base (WHATWG URL rules), so any "/api" prefix here would
  // silently be dropped from every request. The "/api" segment is kept in each call's path.
  private static readonly BASE_URL = 'https://reqres.in';

  private context: APIRequestContext | undefined;

  async init(): Promise<void> {
    this.context = await request.newContext({ baseURL: ApiClient.BASE_URL });
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

  async createEmployeeRecord(payload: {
    employeeId: string;
    firstName: string;
    lastName: string;
  }): Promise<{ id: string; firstName: string; lastName: string; employeeId: string }> {
    const response = await this.api.post('/api/users', { data: payload });
    if (!response.ok()) {
      throw new Error(`API create failed with status ${response.status()}`);
    }
    const body = await response.json();
    return { id: body.id, firstName: body.firstName, lastName: body.lastName, employeeId: body.employeeId };
  }

  async updateEmployeeRecord(
    recordId: string,
    payload: { jobTitle: string; employmentStatus: string },
  ): Promise<{ jobTitle: string; employmentStatus: string }> {
    const response = await this.api.put(`/api/users/${recordId}`, { data: payload });
    if (!response.ok()) {
      throw new Error(`API update failed with status ${response.status()}`);
    }
    const body = await response.json();
    return { jobTitle: body.jobTitle, employmentStatus: body.employmentStatus };
  }

  async deleteEmployeeRecord(recordId: string): Promise<number> {
    const response = await this.api.delete(`/api/users/${recordId}`);
    return response.status();
  }
}
