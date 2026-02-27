import crypto from 'crypto';

/** Generate a unique ticket number like TK-20260227-0001 */
export function generateTicketNumber(sequenceNum: number): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const seq = String(sequenceNum).padStart(4, '0');
  return `TK-${dateStr}-${seq}`;
}

/** Generate a unique quote number like QT-20260227-0001 */
export function generateQuoteNumber(sequenceNum: number): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const seq = String(sequenceNum).padStart(4, '0');
  return `QT-${dateStr}-${seq}`;
}

/** Generate a unique invoice number like INV-20260227-0001 */
export function generateInvoiceNumber(sequenceNum: number): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const seq = String(sequenceNum).padStart(4, '0');
  return `INV-${dateStr}-${seq}`;
}

/** Generate a unique purchase order number like PO-20260227-0001 */
export function generatePONumber(sequenceNum: number): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const seq = String(sequenceNum).padStart(4, '0');
  return `PO-${dateStr}-${seq}`;
}

/** Generate a random public access code for customer ticket lookup (8 chars alphanumeric) */
export function generatePublicAccessCode(): string {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

/** Generate a random SKU for parts */
export function generateSKU(prefix: string): string {
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `${prefix}-${random}`;
}
