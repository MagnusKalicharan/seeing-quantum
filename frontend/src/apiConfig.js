/** Backend API base URL (override with VITE_API_URL in .env). */
export const API_BASE =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
  'http://127.0.0.1:8000';
