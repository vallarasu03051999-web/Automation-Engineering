export interface NewEmployeeData {
  firstName: string;
  lastName: string;
  employeeIdPrefix: string;
  profilePicture: string;
}

export interface JobUpdateData {
  jobTitle: string;
  employmentStatus: string;
}

export interface Credentials {
  username: string;
  password: string;
}

export interface EmployeeFixture {
  newEmployee: NewEmployeeData;
  jobUpdate: JobUpdateData;
  credentials: Credentials;
}
