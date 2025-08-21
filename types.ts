export interface Employee {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  contact: string;
  address: string;
  position: string;
  department: string;
  performance: number; // Score from 0 to 100
  income: number;
  avatarUrl: string;
  isActive: boolean;
  dateOfBirth: string; // YYYY-MM-DD
  joiningDate: string; // YYYY-MM-DD
  payFrequency: 'Monthly' | 'Bi-weekly' | 'Weekly' | 'Annually';
  gender: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
}