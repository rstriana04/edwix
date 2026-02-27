/** Default pagination settings */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

/** Default ticket statuses seeded into the database */
export const DEFAULT_TICKET_STATUSES = [
  { name: 'Received', color: '#6B7280', sortOrder: 0, isDefault: true, isTerminal: false },
  { name: 'Diagnosing', color: '#3B82F6', sortOrder: 1, isDefault: false, isTerminal: false },
  { name: 'Waiting Parts', color: '#F59E0B', sortOrder: 2, isDefault: false, isTerminal: false },
  {
    name: 'Waiting Customer Approval',
    color: '#EF4444',
    sortOrder: 3,
    isDefault: false,
    isTerminal: false,
  },
  { name: 'In Repair', color: '#8B5CF6', sortOrder: 4, isDefault: false, isTerminal: false },
  { name: 'QA / Testing', color: '#06B6D4', sortOrder: 5, isDefault: false, isTerminal: false },
  {
    name: 'Ready for Pickup',
    color: '#10B981',
    sortOrder: 6,
    isDefault: false,
    isTerminal: false,
  },
  { name: 'Delivered', color: '#059669', sortOrder: 7, isDefault: false, isTerminal: false },
  { name: 'Closed', color: '#374151', sortOrder: 8, isDefault: false, isTerminal: true },
] as const;

/** Default device categories */
export const DEFAULT_DEVICE_CATEGORIES = [
  { name: 'Phone', icon: 'smartphone', sortOrder: 0 },
  { name: 'Tablet', icon: 'tablet', sortOrder: 1 },
  { name: 'Laptop', icon: 'laptop', sortOrder: 2 },
  { name: 'Desktop PC', icon: 'monitor', sortOrder: 3 },
  { name: 'Television', icon: 'tv', sortOrder: 4 },
  { name: 'Home Appliance', icon: 'refrigerator', sortOrder: 5 },
  { name: 'Electrical Equipment', icon: 'zap', sortOrder: 6 },
  { name: 'Other', icon: 'box', sortOrder: 7 },
] as const;

/** File upload limits */
export const FILE_LIMITS = {
  MAX_SIZE_BYTES: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_DOC_TYPES: ['application/pdf'],
} as const;
