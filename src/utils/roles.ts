import { Employee } from '../types';

export const isMaster = (employee?: Employee): boolean => {
  if (!employee) return false;
  if (employee.isMaster === true) return true;
  const role = (employee.roleTitle || '').trim().toLowerCase();
  if (role === 'master' || role === 'master admin' || role.includes('master')) return true;
  const username = (employee.username || '').trim().toLowerCase();
  if (username === 'arthur') return true;
  return false;
};

export const isSuperAdmin = (employee?: Employee): boolean => {
  if (!employee) return false;
  if (isMaster(employee)) return true;
  return employee.isAssociate === true || (employee.roleTitle || '').toLowerCase().includes('super admin');
};

export const isAdmin = (employee?: Employee): boolean => {
  if (!employee) return false;
  if (isMaster(employee) || isSuperAdmin(employee)) return true;
  const role = (employee.roleTitle || '').toLowerCase();
  return role.includes('admin') || role.includes('director') || role.includes('principal');
};

export const isPedagogicalCoordinator = (employee?: Employee): boolean => {
  if (!employee) return false;
  if (isMaster(employee)) return true;
  const role = (employee.roleTitle || '').toLowerCase();
  return role.includes('coordinator') || role.includes('pedagogic') || role.includes('pedagógic');
};

/**
 * Strict check: Only Administrators & Master can edit, upload, change, or remove slideshows in Collections.
 * Teachers can only view and download them.
 */
export const canManageCollections = (employee?: Employee): boolean => {
  if (!employee) return false;
  if (isMaster(employee) || employee.isAssociate) return true;
  const role = (employee.roleTitle || '').toLowerCase();
  return role.includes('admin') || employee.permissions?.includes('edit:collections');
};

/**
 * Eligible Approvers: Master, Administrator or Pedagogical Coordinator
 */
export const isCurriculumApprover = (employee?: Employee): boolean => {
  if (!employee) return false;
  if (isMaster(employee)) return true;
  return isAdmin(employee) || isPedagogicalCoordinator(employee);
};

/**
 * Group Slideshow Editing: Master, Assigned teacher of that group or higher-ups (Admin/Coordinator)
 */
export const canEditGroupSlideshow = (employee?: Employee, groupTeacherName?: string): boolean => {
  if (!employee) return false;
  if (isMaster(employee) || isAdmin(employee) || isPedagogicalCoordinator(employee)) return true;
  if (groupTeacherName && (
    employee.name.toLowerCase() === groupTeacherName.toLowerCase() ||
    employee.username.toLowerCase() === groupTeacherName.toLowerCase()
  )) {
    return true;
  }
  return false;
};

/**
 * Staff Deletion Authority:
 * - Master can delete ANY user, including Super Admins, administrators, teachers, and staff (except own active session).
 * - Non-Master users CANNOT delete the Master or other Super Admins.
 */
export const canDeleteTargetEmployee = (actor?: Employee, target?: Employee): { canDelete: boolean; reason?: string } => {
  if (!actor || !target) return { canDelete: false, reason: 'Invalid employee reference.' };
  if (actor.id === target.id) {
    return { canDelete: false, reason: 'You cannot remove your currently active logged-in account.' };
  }
  // Master can delete truly anyone, including Super Admins
  if (isMaster(actor)) {
    return { canDelete: true };
  }
  // Target is Master: Non-master cannot delete
  if (isMaster(target)) {
    return { canDelete: false, reason: 'Master accounts cannot be removed.' };
  }
  // Target is Super Admin: Only Master can delete Super Admins
  if (isSuperAdmin(target)) {
    return { canDelete: false, reason: 'Only the Master can remove Super Admins.' };
  }
  // Super Admin can delete other roles (teachers, secretaries, coordinators)
  if (isSuperAdmin(actor)) {
    return { canDelete: true };
  }
  if (actor.permissions?.includes('manage:staff') || actor.permissions?.includes('edit:staff')) {
    return { canDelete: true };
  }
  return { canDelete: false, reason: 'You do not have permission to delete staff members.' };
};
