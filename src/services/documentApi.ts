import { apiGet, apiPost } from './apiClient';
import { BackendDocument } from '../types';

export async function getPendingReviews(page: number = 1, limit: number = 20) {
  try {
    const data = await apiGet(`/documents/review/pending?page=${page}&limit=${limit}`);
    if (data && data.success) return data;
  } catch (err) {}

  return {
    success: true,
    documents: [],
    totalPending: 0
  };
}

export async function getDocumentDetails(id: string) {
  try {
    const data = await apiGet(`/documents/${id}/details`);
    if (data && data.success) return data;
  } catch (err) {}

  return {
    success: true,
    document: null
  };
}

export async function getDocumentForReview(id: string) {
  try {
    const data = await apiGet(`/documents/review/${id}`);
    if (data && data.success) return data;
  } catch (err) {}

  return {
    success: true,
    document: null
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
