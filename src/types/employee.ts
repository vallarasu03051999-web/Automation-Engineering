export interface NewEmployeeData {
  firstName: string;
  lastName: string;
  employeeIdPrefix: string;
  profilePicture?: string;
}

export interface JobUpdateData {
  jobTitle: string;
  employmentStatus: string;
}

export interface EmployeeFixture {
  newEmployee: NewEmployeeData;
  jobUpdate: JobUpdateData;
}

export interface NewSystemUserData {
  role: 'Admin' | 'ESS';
  employeeName: string;
  status: 'Enabled' | 'Disabled';
  username: string;
  password: string;
}
