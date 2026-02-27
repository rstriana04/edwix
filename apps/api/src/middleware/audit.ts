import { prisma } from '../config/database';

interface AuditEntry {
  userId: string;
  action: 'create' | 'update' | 'delete';
  entityType: string;
  entityId: string;
  changes?: Record<string, { old: unknown; new: unknown }>;
  ipAddress?: string;
}

/** Records an audit log entry for a critical mutation */
export async function createAuditLog(entry: AuditEntry): Promise<void> {
  await prisma.auditLog.create({
    data: {
      userId: entry.userId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      changes: entry.changes ?? undefined,
      ipAddress: entry.ipAddress,
    },
  });
}

/**
 * Computes a diff between old and new objects, returning only changed fields.
 * Useful for building the `changes` object for audit logs.
 */
export function computeChanges(
  oldObj: Record<string, unknown>,
  newObj: Record<string, unknown>,
  fields: string[],
): Record<string, { old: unknown; new: unknown }> | undefined {
  const changes: Record<string, { old: unknown; new: unknown }> = {};

  for (const field of fields) {
    const oldVal = oldObj[field];
    const newVal = newObj[field];
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      changes[field] = { old: oldVal, new: newVal };
    }
  }

  return Object.keys(changes).length > 0 ? changes : undefined;
}
