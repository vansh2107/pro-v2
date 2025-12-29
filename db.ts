
import { 
  User, UserRole, Asset, Document, AuditLog, AssetType, 
  FamilyMember, PermissionKey, RolePermission
} from './types';

export let users: User[] = [
  { id: 'a', name: 'Alice (Super)', role: UserRole.SUPER_ADMIN, email: 'alice@wealthguard.com' },
  { id: 'b', name: 'Bob (Admin)', role: UserRole.ADMIN, email: 'bob@wealthguard.com' },
  { id: 'c', name: 'Charlie (Admin)', role: UserRole.ADMIN, email: 'charlie@wealthguard.com' },
  { id: 'd', name: 'David (Assoc)', role: UserRole.ASSOCIATE, email: 'david@wealthguard.com' },
  { id: 'e', name: 'Eve (Assoc)', role: UserRole.ASSOCIATE, email: 'eve@wealthguard.com' },
  { id: 'f_acc', name: 'Frank Family', role: UserRole.CUSTOMER, email: 'frank@client.com', assignedTo: 'd' },
  { id: 'i_acc', name: 'Isabella Family', role: UserRole.CUSTOMER, email: 'isabella@client.com', assignedTo: 'e' },
];

// Backend Table: PERMISSIONS
// Persists the role-level configurations
let rolePermissions: RolePermission[] = [
  {
    role: UserRole.SUPER_ADMIN,
    permissions: {
      ADMIN_MODULES: true,
      ASSOCIATES: true,
      CUSTOMERS: true,
      WHOLE_FAMILY: true,
      EDIT_CUSTOMERS: true,
      DELETE_CASCADE: true,
      DOWNLOAD_PDF: true,
    }
  },
  {
    role: UserRole.ADMIN,
    permissions: {
      ADMIN_MODULES: false,
      ASSOCIATES: true,
      CUSTOMERS: true,
      WHOLE_FAMILY: false,
      EDIT_CUSTOMERS: true,
      DELETE_CASCADE: true,
      DOWNLOAD_PDF: true,
    }
  },
  {
    role: UserRole.ASSOCIATE,
    permissions: {
      ADMIN_MODULES: false,
      ASSOCIATES: false,
      CUSTOMERS: true,
      WHOLE_FAMILY: false,
      EDIT_CUSTOMERS: true,
      DELETE_CASCADE: false,
      DOWNLOAD_PDF: true,
    }
  },
  {
    role: UserRole.CUSTOMER,
    permissions: {
      ADMIN_MODULES: false,
      ASSOCIATES: false,
      CUSTOMERS: true,
      WHOLE_FAMILY: true,
      EDIT_CUSTOMERS: false,
      DELETE_CASCADE: false,
      DOWNLOAD_PDF: true,
    }
  }
];

// Mock API: GET /permissions
export const getRolePermissions = () => JSON.parse(JSON.stringify(rolePermissions)) as RolePermission[];

// Mock API: POST /permissions/update
export const updateRolePermission = (role: UserRole, key: PermissionKey, value: boolean) => {
  const roleEntry = rolePermissions.find(rp => rp.role === role);
  if (roleEntry) {
    roleEntry.permissions[key] = value;
    return true;
  }
  return false;
};

// Security check helper: hasPermission(role, module/action)
export const checkRolePermission = (role: UserRole, key: PermissionKey): boolean => {
  const roleEntry = rolePermissions.find(rp => rp.role === role);
  return roleEntry ? roleEntry.permissions[key] : false;
};

export const addUser = (user: User) => { users.push(user); };
export const updateUser = (id: string, updates: Partial<User>) => {
  const idx = users.findIndex(u => u.id === id);
  if (idx !== -1) users[idx] = { ...users[idx], ...updates };
};
export const deleteUser = (id: string) => { users = users.filter(u => u.id !== id); };

export let familyMembers: FamilyMember[] = [
  { id: 'i_1', familyId: 'i_acc', name: 'Isabella', relationship: 'Primary' },
  { id: 'f_1', familyId: 'f_acc', name: 'Frank', relationship: 'Primary' },
];

let assets: Asset[] = [
  { id: '1', familyId: 'f_acc', memberId: 'f_1', type: AssetType.STOCKS, value: 50000, details: { symbol: 'AAPL' }, lastUpdated: '2024-03-20' },
];

let documents: Document[] = [];
let auditLogs: AuditLog[] = [];

export const getAssets = () => [...assets];
export const addAsset = (asset: Asset) => { assets.push(asset); };
export const deleteAsset = (id: string) => { assets = assets.filter(a => a.id !== id); };
export const getDocuments = () => [...documents];
export const addDocument = (doc: Document) => { documents.push(doc); };
export const getFamilyMembers = (familyId?: string) => familyId ? familyMembers.filter(m => m.familyId === familyId) : [...familyMembers];
export const addFamilyMember = (member: FamilyMember) => { familyMembers.push(member); };
export const deleteFamilyMember = (id: string) => { familyMembers = familyMembers.filter(m => m.id !== id); };
export const getAuditLogs = () => [...auditLogs].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
export const addAuditLog = (log: Omit<AuditLog, 'id'>) => {
  const newLog = { ...log, id: Math.random().toString(36).substr(2, 9) };
  auditLogs.push(newLog);
};
