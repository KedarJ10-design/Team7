import { prisma } from './prisma';

export interface AuditParams {
  actorId: string;
  targetMemberId?: string | null;
  entity: string;
  entityId: string;
  action: 'create' | 'update' | 'archive' | 'override' | 'react' | 'cheer' | string;
  oldValue?: unknown;
  newValue?: unknown;
}

/**
 * Write an immutable audit log entry.
 * Every progress update, profile edit, goal creation/update, or admin override
 * must call this function.
 */
export async function writeAuditLog({
  actorId,
  targetMemberId = null,
  entity,
  entityId,
  action,
  oldValue = null,
  newValue = null,
}: AuditParams) {
  try {
    return await prisma.auditLog.create({
      data: {
        actorId,
        targetMemberId,
        entity,
        entityId,
        action,
        oldValue: oldValue !== null && oldValue !== undefined ? JSON.stringify(oldValue) : null,
        newValue: newValue !== null && newValue !== undefined ? JSON.stringify(newValue) : null,
      },
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
}
