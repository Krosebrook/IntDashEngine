
import { User } from '../types';

export const Permissions = {
  canEditKPI: (user: User | null) => 
    user?.role === 'admin' || user?.role === 'editor',
    
  canManageUsers: (user: User | null) => 
    user?.role === 'admin',
    
  canManageDepartments: (user: User | null) => 
    user?.role === 'admin',
    
  canAccessSettings: (user: User | null) => 
    user?.role === 'admin' || user?.role === 'editor',
    
  isReadOnly: (user: User | null) => 
    user?.role === 'viewer'
};
