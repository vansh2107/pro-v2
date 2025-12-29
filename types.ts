
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  ASSOCIATE = 'ASSOCIATE',
  CUSTOMER = 'CUSTOMER' 
}

export enum AssetType {
  STOCKS = 'Stocks',
  FIXED_DEPOSITS = 'Fixed Deposits',
  MUTUAL_FUNDS = 'Mutual Funds',
  BONDS = 'Bonds',
  PPF = 'PPF',
  LIFE_INSURANCE = 'Life Insurance',
  TERM_INSURANCE = 'Term Insurance'
}

// These represent the specific capability columns requested
export type PermissionKey = 
  | 'ADMIN_MODULES' 
  | 'ASSOCIATES' 
  | 'CUSTOMERS' 
  | 'WHOLE_FAMILY' 
  | 'EDIT_CUSTOMERS' 
  | 'DELETE_CASCADE' 
  | 'DOWNLOAD_PDF';

export interface RolePermission {
  role: UserRole;
  permissions: Record<PermissionKey, boolean>;
}

export interface User {
  id: string;
  name: string; 
  role: UserRole;
  email: string;
  assignedTo?: string; 
}

export interface FamilyMember {
  id: string;
  familyId: string; 
  name: string;
  relationship: string;
}

export interface Asset {
  id: string;
  familyId: string;
  memberId: string; 
  type: AssetType;
  value: number;
  details: Record<string, any>;
  lastUpdated: string;
}

export interface Document {
  id: string;
  familyId: string;
  memberId: string;
  category: AssetType | 'ID_PROOF' | 'TAX_FORMS';
  fileName: string;
  fileSize: string;
  uploadDate: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actingAsId?: string; 
  targetId?: string;
  action: string;
  details: string;
  timestamp: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
}

export interface AuthState {
  currentUser: User | null;
  actingUser: User | null;
  isImpersonating: boolean;
}
