import { apiGet, apiPost } from './apiClient';
import { BackendDocument } from '../types';
import { getStoredDocuments, saveStoredDocuments } from './adminApi';

export async function getPendingReviews(page: number = 1, limit: number = 20) {
  try {
    const data = await apiGet(`/documents/review/pending?page=${page}&limit=${limit}`);
    if (data && data.success) return data;
  } catch (err) {}

  const pending = getStoredDocuments().filter(d => d.reviewStatus === 'PENDING');
  return {
    success: true,
    documents: pending,
    totalPending: pending.length
  };
}

export async function getDocumentDetails(id: string) {
  try {
    const data = await apiGet(`/documents/${id}/details`);
    if (data && data.success) return data;
  } catch (err) {}

  const doc = getStoredDocuments().find(d => d._id === id) || null;
  return {
    success: true,
    document: doc
  };
}

export async function getDocumentForReview(id: string) {
  try {
    const data = await apiGet(`/documents/review/${id}`);
    if (data && data.success) return data;
  } catch (err) {}

  const doc = getStoredDocuments().find(d => d._id === id) || null;
  return {
    success: true,
    document: doc
  };
}

export async function submitReview(id: string, decision: string, comment?: string) {
  try {
    const data = await apiPost(`/documents/review/${id}/decision`, {
      reviewDecision: decision,
      reviewComment: comment || '',
      decision,
      comment: comment || ''
    });
    if (data && data.success) return data;
  } catch (err) {}

  const docs = getStoredDocuments();
  const target = docs.find(d => d._id === id);
  if (target) {
    target.reviewStatus = decision;
    target.reviewDecision = decision;
    target.reviewComment = comment || '';
    target.reviewedAt = new Date().toISOString();
    saveStoredDocuments(docs);
  }

  return {
    success: true,
    message: `Review submitted as ${decision}`,
    documentId: id
  };
}

export function getDocumentFileEndpoint(id: string): string {
  return `/documents/${id}/file`;
}

export function getDocumentSelfieEndpoint(id: string): string {
  return `/documents/${id}/selfie`;
}
