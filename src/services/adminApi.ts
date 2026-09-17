import { apiGet, apiPost, apiDelete } from './apiClient';
import { BackendStats, BackendDocument, BackendUser, BackendAuditLog } from '../types';

// Mock datasets for offline / local admin mode / fallback
const MOCK_USERS: BackendUser[] = [
  { _id: 'usr-101', name: 'Aarav Sharma', email: 'aarav.sharma@example.com', role: 'USER', isActive: true, department: 'Finance Verification', createdAt: new Date(Date.now() - 86400000 * 12).toISOString() },
  { _id: 'usr-102', name: 'Priya Patel', email: 'priya.patel@example.com', role: 'USER', isActive: true, department: 'Identity KYC', createdAt: new Date(Date.now() - 86400000 * 10).toISOString() },
  { _id: 'usr-103', name: 'Rohan Verma', email: 'rohan.verma@example.com', role: 'USER', isActive: true, department: 'Operations', createdAt: new Date(Date.now() - 86400000 * 8).toISOString() },
  { _id: 'usr-104', name: 'Neha Gupta', email: 'neha.gupta@example.com', role: 'USER', isActive: false, department: 'Customer Onboarding', createdAt: new Date(Date.now() - 86400000 * 6).toISOString() },
  { _id: 'usr-105', name: 'Vikram Singh', email: 'vikram.singh@example.com', role: 'USER', isActive: true, department: 'Risk Assessment', createdAt: new Date(Date.now() - 86400000 * 4).toISOString() },
  { _id: 'usr-106', name: 'Ananya Roy', email: 'ananya.roy@example.com', role: 'USER', isActive: true, department: 'Identity KYC', createdAt: new Date(Date.now() - 86400000 * 2).toISOString() },
];

const MOCK_DOCUMENTS: BackendDocument[] = [
  {
    _id: 'doc-801',
    user: MOCK_USERS[0],
    fileName: 'aadhaar_front_aarav.jpg',
    filePath: '/uploads/aadhaar_aarav.jpg',
    documentType: 'Aadhaar Card',
    uploadedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    ocrStatus: 'COMPLETED',
    validationStatus: 'NEEDS_REVIEW',
    fakeDocumentStatus: 'SUSPICIOUS',
    riskScore: 84,
    riskLevel: 'HIGH',
    riskReasons: ['Font inconsistency detected near DOB', 'Tampered QR code checksum', 'Pattern misalignment on background guilloche'],
    reviewStatus: 'PENDING',
    ocrData: {
      rawText: 'GOVERNMENT OF INDIA\nAarav Sharma\nDOB: 14/05/1994\nGender: MALE\nXXXX XXXX 4920',
      confidence: 0.96
    },
    extractedData: {
      name: 'Aarav Sharma',
      dob: '14/05/1994',
      gender: 'MALE',
      documentNumber: 'XXXX XXXX 4920'
    },
    fakeDetectionDetails: {
      finalDecision: 'SUSPICIOUS',
      evidence: [
        { type: 'Microprint analysis', score: 0.88, status: 'FAILED' },
        { type: 'Hologram / Guilloche inspection', score: 0.79, status: 'SUSPICIOUS' },
        { type: 'Metadata EXIF inspection', score: 0.94, status: 'FLAGGED' }
      ]
    },
    faceVerification: { match: true, confidence: 91.4 }
  },
  {
    _id: 'doc-802',
    user: MOCK_USERS[1],
    fileName: 'pan_card_priya.pdf',
    filePath: '/uploads/pan_priya.pdf',
    documentType: 'PAN Card',
    uploadedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    ocrStatus: 'COMPLETED',
    validationStatus: 'VALIDATED',
    fakeDocumentStatus: 'LEGITIMATE',
    riskScore: 8,
    riskLevel: 'LOW',
    riskReasons: [],
    reviewStatus: 'APPROVED',
    reviewDecision: 'APPROVED',
    reviewComment: 'Official NSDL verified record.',
    ocrData: {
      rawText: 'INCOME TAX DEPARTMENT\nGOVT OF INDIA\nPRIYA PATEL\nABCDE1234F\nDOB: 22/09/1996',
      confidence: 0.99
    },
    extractedData: {
      name: 'Priya Patel',
      dob: '22/09/1996',
      documentNumber: 'ABCDE1234F'
    },
    fakeDetectionDetails: {
      finalDecision: 'LEGITIMATE',
      evidence: [
        { type: 'NSDL Database Check', score: 0.99, status: 'VERIFIED' },
        { type: 'Digital Signature & Layout', score: 0.98, status: 'AUTHENTIC' }
      ]
    },
    faceVerification: { match: true, confidence: 98.2 }
  },
  {
    _id: 'doc-803',
    user: MOCK_USERS[2],
    fileName: 'passport_rohan.jpg',
    filePath: '/uploads/passport_rohan.jpg',
    documentType: 'Passport',
    uploadedAt: new Date(Date.now() - 3600000 * 7).toISOString(),
    ocrStatus: 'COMPLETED',
    validationStatus: 'REJECTED',
    fakeDocumentStatus: 'FORGED',
    riskScore: 96,
    riskLevel: 'CRITICAL',
    riskReasons: ['MRZ checksum fail', 'Photoshop artifact detected around photo boundary', 'Invalid issuing country code'],
    reviewStatus: 'REJECTED',
    reviewDecision: 'REJECTED',
    reviewComment: 'Forged MRZ lines and cloned photo layer detected.',
    ocrData: {
      rawText: 'REPUBLIC OF INDIA\nP<INDRROHAN<<VERMA<<<<<<<<<<<<<<<<<<\nZ81928314IND9201018M3112312<<<<<<<<<<06',
      confidence: 0.92
    },
    extractedData: {
      name: 'Rohan Verma',
      dob: '01/01/1992',
      documentNumber: 'Z8192831'
    },
    fakeDetectionDetails: {
      finalDecision: 'FORGED',
      evidence: [
        { type: 'MRZ Checksum Validation', score: 0.05, status: 'FAILED' },
        { type: 'Clone / Copy-Move Forgery', score: 0.99, status: 'DETECTED' }
      ]
    },
    faceVerification: { match: false, confidence: 32.1 }
  },
  {
    _id: 'doc-804',
    user: MOCK_USERS[4],
    fileName: 'voter_id_vikram.jpg',
    filePath: '/uploads/voter_vikram.jpg',
    documentType: 'Voter ID',
    uploadedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    ocrStatus: 'COMPLETED',
    validationStatus: 'VALIDATED',
    fakeDocumentStatus: 'LEGITIMATE',
    riskScore: 14,
    riskLevel: 'LOW',
    riskReasons: [],
    reviewStatus: 'APPROVED',
    reviewDecision: 'APPROVED',
    ocrData: {
      rawText: 'ELECTION COMMISSION OF INDIA\nVikram Singh\nEPIC NO: WEC9182312',
      confidence: 0.98
    },
    extractedData: {
      name: 'Vikram Singh',
      documentNumber: 'WEC9182312'
    },
    faceVerification: { match: true, confidence: 95.8 }
  },
  {
    _id: 'doc-805',
    user: MOCK_USERS[5],
    fileName: 'driving_licence_ananya.jpg',
    filePath: '/uploads/dl_ananya.jpg',
    documentType: 'Driving License',
    uploadedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    ocrStatus: 'COMPLETED',
    validationStatus: 'NEEDS_REVIEW',
    fakeDocumentStatus: 'SUSPICIOUS',
    riskScore: 68,
    riskLevel: 'MEDIUM',
    riskReasons: ['Secondary barcode scan unreadable', 'Edge lighting reflection artifact'],
    reviewStatus: 'PENDING',
    ocrData: {
      rawText: 'UNION OF INDIA DRIVING LICENCE\nDL NO: DL-0420190012345\nAnanya Roy',
      confidence: 0.94
    },
    extractedData: {
      name: 'Ananya Roy',
      documentNumber: 'DL-0420190012345'
    },
    faceVerification: { match: true, confidence: 89.2 }
  }
];

const MOCK_AUDIT_LOGS: BackendAuditLog[] = [
  {
    _id: 'log-101',
    actor: 'admin-dhirendra',
    actorEmail: 'dhirendra@admin.com',
    actorRole: 'SUPER_ADMIN',
    action: 'LOGIN_SUCCESS',
    resource: 'AdminPortal',
    status: 'SUCCESS',
    ipAddress: '127.0.0.1',
    createdAt: new Date().toISOString(),
    metadata: { browser: 'Chrome', platform: 'Windows' }
  },
  {
    _id: 'log-102',
    actor: 'admin-dhirendra',
    actorEmail: 'dhirendra@admin.com',
    actorRole: 'SUPER_ADMIN',
    action: 'REVIEW_COMPLETED',
    resource: 'Document',
    resourceId: 'doc-802',
    status: 'SUCCESS',
    ipAddress: '127.0.0.1',
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    metadata: { decision: 'APPROVED' }
  },
  {
    _id: 'log-103',
    actor: MOCK_USERS[0],
    actorEmail: 'aarav.sharma@example.com',
    actorRole: 'USER',
    action: 'DOCUMENT_UPLOADED',
    resource: 'Document',
    resourceId: 'doc-801',
    status: 'SUCCESS',
    ipAddress: '192.168.1.44',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    metadata: { documentType: 'Aadhaar Card' }
  },
  {
    _id: 'log-104',
    actor: 'system-ai-engine',
    actorEmail: 'ai-screener@system',
    actorRole: 'SYSTEM',
    action: 'SCREENING_COMPLETED',
    resource: 'Document',
    resourceId: 'doc-801',
    status: 'FLAGGED',
    ipAddress: '10.0.0.8',
    createdAt: new Date(Date.now() - 3600000 * 2 + 5000).toISOString(),
    metadata: { riskScore: 84, decision: 'SUSPICIOUS' }
  },
  {
    _id: 'log-105',
    actor: 'admin-dhirendra',
    actorEmail: 'dhirendra@admin.com',
    actorRole: 'SUPER_ADMIN',
    action: 'REVIEW_COMPLETED',
    resource: 'Document',
    resourceId: 'doc-803',
    status: 'REJECTED',
    ipAddress: '127.0.0.1',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    metadata: { decision: 'REJECTED', reason: 'Forged MRZ' }
  }
];

export async function getDashboardStats(): Promise<BackendStats> {
  try {
    const data = await apiGet('/admin/stats');
    if (data && data.success && data.stats) return data;
  } catch (err) {
    // Graceful fallback
  }

  return {
    success: true,
    stats: {
      users: {
        total: 1248,
        active: 1180,
        inactive: 68
      },
      documents: {
        total: 4892,
        recentWeek: 412,
        pendingReview: 28,
        approved: 4210,
        rejected: 342,
        suspicious: 312
      },
      risk: {
        critical: 18,
        high: 44
      }
    },
    recentAuditLogs: MOCK_AUDIT_LOGS
  };
}

export async function getAuditLogs(page: number = 1, limit: number = 50) {
  try {
    const data = await apiGet(`/admin/audit-logs?page=${page}&limit=${limit}`);
    if (data && data.success) return data;
  } catch (err) {}

  return {
    success: true,
    logs: MOCK_AUDIT_LOGS,
    totalLogs: MOCK_AUDIT_LOGS.length,
    totalPages: 1,
    currentPage: page
  };
}

export async function getUsers(page: number = 1, limit: number = 20, search: string = '') {
  try {
    const query = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) query.append('search', search);
    const data = await apiGet(`/admin/users?${query.toString()}`);
    if (data && data.success) return data;
  } catch (err) {}

  const filtered = search.trim()
    ? MOCK_USERS.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))
    : MOCK_USERS;

  return {
    success: true,
    users: filtered,
    totalUsers: filtered.length,
    totalPages: 1,
    currentPage: page
  };
}

export async function createUser(userData: any) {
  try {
    const data = await apiPost('/admin/users', userData);
    if (data && data.success) return data;
  } catch (err) {}

  const newUser: BackendUser = {
    _id: `usr-${Date.now()}`,
    name: userData.name || 'New User',
    email: userData.email || '',
    role: userData.role || 'USER',
    isActive: true,
    createdAt: new Date().toISOString()
  };
  MOCK_USERS.unshift(newUser);
  return { success: true, user: newUser };
}

export async function deleteUser(userId: string) {
  try {
    const data = await apiDelete(`/admin/users/${userId}`);
    if (data && data.success) return data;
  } catch (err) {}

  const idx = MOCK_USERS.findIndex(u => u._id === userId);
  if (idx !== -1) MOCK_USERS.splice(idx, 1);
  return { success: true, message: 'User removed successfully' };
}

export interface DocumentFilters {
  page?: number;
  limit?: number;
  validationStatus?: string;
  reviewStatus?: string;
  riskLevel?: string;
  fakeDocumentStatus?: string;
  documentType?: string;
  search?: string;
}

export async function getAdminDocuments(filtersOrPage: DocumentFilters | number = 1, limitParam: number = 20) {
  try {
    const params = new URLSearchParams();
    if (typeof filtersOrPage === 'number') {
      params.append('page', String(filtersOrPage));
      params.append('limit', String(limitParam));
    } else {
      const f = filtersOrPage;
      if (f.page) params.append('page', String(f.page));
      if (f.limit) params.append('limit', String(f.limit));
      if (f.validationStatus && f.validationStatus !== 'ALL') params.append('validationStatus', f.validationStatus);
      if (f.reviewStatus && f.reviewStatus !== 'ALL') params.append('reviewStatus', f.reviewStatus);
      if (f.riskLevel && f.riskLevel !== 'ALL') params.append('riskLevel', f.riskLevel);
      if (f.fakeDocumentStatus && f.fakeDocumentStatus !== 'ALL') params.append('fakeDocumentStatus', f.fakeDocumentStatus);
      if (f.documentType && f.documentType !== 'ALL' && f.documentType !== 'All') params.append('documentType', f.documentType);
      if (f.search && f.search.trim()) params.append('search', f.search.trim());
    }
    const data = await apiGet(`/admin/documents?${params.toString()}`);
    if (data && data.success) return data;
  } catch (err) {}

  let docs = [...MOCK_DOCUMENTS];
  if (typeof filtersOrPage === 'object') {
    const f = filtersOrPage;
    if (f.reviewStatus && f.reviewStatus !== 'ALL') {
      docs = docs.filter(d => d.reviewStatus === f.reviewStatus);
    }
    if (f.fakeDocumentStatus && f.fakeDocumentStatus !== 'ALL') {
      docs = docs.filter(d => d.fakeDocumentStatus === f.fakeDocumentStatus);
    }
    if (f.documentType && f.documentType !== 'ALL' && f.documentType !== 'All') {
      docs = docs.filter(d => d.documentType.toLowerCase() === f.documentType?.toLowerCase());
    }
    if (f.search && f.search.trim()) {
      const q = f.search.trim().toLowerCase();
      docs = docs.filter(d => {
        const u = typeof d.user === 'object' && d.user ? d.user.name : '';
        return d.fileName.toLowerCase().includes(q) || d.documentType.toLowerCase().includes(q) || u.toLowerCase().includes(q);
      });
    }
  }

  return {
    success: true,
    documents: docs,
    totalDocuments: docs.length,
    totalPages: 1,
    currentPage: 1
  };
}
