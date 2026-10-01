export type MembershipType = string;

export type GenderType = 'Male' | 'Female' | 'Other' | 'Prefer not to say';

export type MembershipStatus = 'active' | 'expired';

export interface MembershipPlan {
  id: string;
  name: string;
  durationMonths: number;
  durationDays?: number;
  price: number;
  description?: string;
  isDefault?: boolean;
}

export interface Member {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth: string; // YYYY-MM-DD
  gender: GenderType;
  membershipType: MembershipType;
  totalFee: number;
  paidAmount: number;
  balanceDue: number;
  joiningDate: string; // YYYY-MM-DD
  expiryDate: string; // YYYY-MM-DD
  status: MembershipStatus;
  emergencyContact?: string;
  notes?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MemberFormData {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  gender: GenderType;
  membershipType: MembershipType;
  totalFee: number;
  paidAmount: number;
  balanceDue: number;
  joiningDate: string;
  expiryDate: string;
  emergencyContact?: string;
  notes?: string;
}

export interface DashboardStats {
  totalMembers: number;
  activeMembers: number;
  expiredMembers: number;
  expiringSoon: number;
  totalRevenue: number;
  totalBalanceDue: number;
}
