// Type declarations for api.js
declare module '../utils/api' {
  export interface LoginCredentials {
    username: string;
    password: string;
  }

  export interface PasswordChangeData {
    currentPassword: string;
    newPassword: string;
  }

  export interface ApiResponse<T = any> {
    data: T;
    message?: string;
  }

  export const auth: {
    login: (credentials: LoginCredentials) => Promise<ApiResponse>;
    getProfile: () => Promise<ApiResponse>;
    changePassword: (passwordData: PasswordChangeData) => Promise<ApiResponse>;
  };

  export const users: {
    getAll: () => Promise<ApiResponse>;
    create: (userData: any) => Promise<ApiResponse>;
    update: (id: string, userData: any) => Promise<ApiResponse>;
    delete: (id: string) => Promise<ApiResponse>;
  };

  export const classes: {
    getAll: () => Promise<ApiResponse>;
    create: (classData: any) => Promise<ApiResponse>;
    update: (id: string, classData: any) => Promise<ApiResponse>;
    delete: (id: string) => Promise<ApiResponse>;
  };

  export const subjects: {
    getAll: () => Promise<ApiResponse>;
    create: (subjectData: any) => Promise<ApiResponse>;
    update: (id: string, subjectData: any) => Promise<ApiResponse>;
    delete: (id: string) => Promise<ApiResponse>;
  };

  export const timetables: {
    getAll: () => Promise<ApiResponse>;
    generate: (data: any) => Promise<ApiResponse>;
    update: (id: string, data: any) => Promise<ApiResponse>;
    delete: (id: string) => Promise<ApiResponse>;
  };

  export const ai: {
    generateTimetable: (data: any) => Promise<ApiResponse>;
  };
}
