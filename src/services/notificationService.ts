import { PageType } from '../types';

export interface AppNotification {
  id: string;
  type: 'CRITICAL' | 'SUSPICIOUS' | 'VERIFIED' | 'INFO' | 'SYSTEM';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  targetPage?: PageType;
  targetNav?: string;
}

const STORAGE_KEY = 'dociscan_notifications_data';

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    type: 'CRITICAL',
    title: 'Tamper Detected in Passport',
    message: 'Copy-move forgery and altered MRZ detected in passport submission for Rohan Verma.',
    timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    read: false,
    targetPage: 'documents',
    targetNav: 'documents'
  },
  {
    id: 'notif-2',
    type: 'SUSPICIOUS',
    title: 'Font Inconsistency Flagged',
    message: 'Aadhaar Card font mismatch detected on Date of Birth field for Aarav Sharma.',
    timestamp: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
    read: false,
    targetPage: 'verification',
    targetNav: 'verification'
  },
  {
    id: 'notif-3',
    type: 'VERIFIED',
    title: 'Document Verified by AI',
    message: 'PAN Card validation successful with 99.8% NSDL database match for Priya Patel.',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    read: false,
    targetPage: 'documents',
    targetNav: 'documents'
  },
  {
    id: 'notif-4',
    type: 'INFO',
    title: 'New Officer Registered',
    message: 'New officer account created and assigned to Identity KYC department.',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    read: true,
    targetPage: 'users',
    targetNav: 'users'
  },
  {
    id: 'notif-5',
    type: 'SUSPICIOUS',
    title: 'Barcode Reflection Artifact',
    message: 'Secondary barcode check pending manual review for Driving License (Ananya Roy).',
    timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    read: true,
    targetPage: 'verification',
    targetNav: 'verification'
  },
  {
    id: 'notif-6',
    type: 'SYSTEM',
    title: 'System Security Check Complete',
    message: 'AI screening neural weights and encryption keys verified successfully.',
    timestamp: new Date(Date.now() - 1000 * 60 * 400).toISOString(),
    read: true,
    targetPage: 'history',
    targetNav: 'history'
  }
];

export function getNotifications(): AppNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw !== null) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error(e);
  }
  return INITIAL_NOTIFICATIONS;
}

export function saveNotifications(list: AppNotification[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('notifications:updated', { detail: list }));
  } catch (e) {
    console.error(e);
  }
}

export function getUnreadCount(): number {
  return getNotifications().filter(n => !n.read).length;
}

export function markAsRead(id: string) {
  const list = getNotifications().map(n => n.id === id ? { ...n, read: true } : n);
  saveNotifications(list);
}

export function markAllAsRead() {
  const list = getNotifications().map(n => ({ ...n, read: true }));
  saveNotifications(list);
}

export function deleteNotification(id: string) {
  const list = getNotifications().filter(n => n.id !== id);
  saveNotifications(list);
}

export function clearAllNotifications() {
  saveNotifications([]);
}

export function addNotification(item: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) {
  const list = getNotifications();
  const newNotif: AppNotification = {
    ...item,
    id: `notif-${Date.now()}`,
    timestamp: new Date().toISOString(),
    read: false
  };
  list.unshift(newNotif);
  saveNotifications(list);
  return newNotif;
}

// Live background simulator
const SIMULATED_EVENTS = [
  { type: 'CRITICAL' as const, title: 'Deepfake Tamper Alert', message: 'Photoshop cloning artifacts detected in uploaded photo layer.', targetPage: 'documents' as const },
  { type: 'VERIFIED' as const, title: 'Automated Screening Pass', message: 'Voter ID card EPIC verification completed successfully.', targetPage: 'documents' as const },
  { type: 'SUSPICIOUS' as const, title: 'QR Code Checksum Mismatch', message: 'Decoded QR text does not match front OCR text.', targetPage: 'verification' as const },
  { type: 'INFO' as const, title: 'Audit Trail Updated', message: 'New audit record logged by admin portal.', targetPage: 'history' as const },
];

let simTimer: any = null;

export function startLiveNotificationStream() {
  if (simTimer) return;
  simTimer = setInterval(() => {
    // 30% chance every 40s to trigger a real-time event
    if (Math.random() > 0.6) {
      const event = SIMULATED_EVENTS[Math.floor(Math.random() * SIMULATED_EVENTS.length)];
      addNotification(event);
    }
  }, 40000);
}
