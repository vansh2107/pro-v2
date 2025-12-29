
import { users, addAuditLog, checkRolePermission } from './db';
import { User, UserRole, PermissionKey } from './types';

class AuthService {
  static getRoleLevel(role: UserRole): number {
    switch (role) {
      case UserRole.SUPER_ADMIN: return 4;
      case UserRole.ADMIN: return 3;
      case UserRole.ASSOCIATE: return 2;
      case UserRole.CUSTOMER: return 1;
      default: return 0;
    }
  }

  static login(id: string): User | null {
    const user = users.find(u => u.id === id);
    if (user) {
      addAuditLog({
        actorId: user.id,
        action: 'LOGIN',
        details: `${user.name} logged into the system`,
        timestamp: new Date().toISOString(),
        severity: 'INFO'
      });
      return user;
    }
    return null;
  }

  /**
   * Runtime Enforcement: hasPermission(role, capability)
   * Fetches data from the global matrix in db.ts
   */
  static hasPermission(user: User, key: PermissionKey): boolean {
    return checkRolePermission(user.role, key);
  }

  static getVisibleUsers(actor: User): User[] {
    // Check if actor has permission to see certain lists
    const canSeeAssociates = this.hasPermission(actor, 'ASSOCIATES');
    const canSeeCustomers = this.hasPermission(actor, 'CUSTOMERS');

    if (actor.role === UserRole.SUPER_ADMIN) return users.filter(u => u.id !== actor.id);
    
    if (actor.role === UserRole.ADMIN) {
        return users.filter(u => {
            if (u.role === UserRole.SUPER_ADMIN) return false;
            if (u.role === UserRole.ASSOCIATE && canSeeAssociates) return true;
            if (u.role === UserRole.CUSTOMER && canSeeCustomers) return true;
            return false;
        });
    }
    
    if (actor.role === UserRole.ASSOCIATE) {
        return users.filter(u => u.role === UserRole.CUSTOMER && u.assignedTo === actor.id && canSeeCustomers);
    }
    
    return [];
  }

  static canImpersonate(actor: User, target: User): boolean {
    if (actor.id === target.id) return false;
    const actorRank = this.getRoleLevel(actor.role);
    const targetRank = this.getRoleLevel(target.role);
    return actorRank > targetRank;
  }

  static canViewLogs(actor: User): boolean {
    return this.hasPermission(actor, 'ADMIN_MODULES');
  }
}

export default AuthService;
