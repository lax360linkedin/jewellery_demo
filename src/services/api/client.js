/**
 * Standalone Client for SJ Jewellers Frontend
 * Purely offline-first client with zero external network or backend dependencies.
 */

export const API_BASE_URL = '';

/**
 * Normalizes error responses into standard Error instances
 */
export function normalizeApiError(error, responseData, status) {
  const message = (responseData && (responseData.detail || responseData.message || responseData.error))
    || (error && error.message)
    || 'Operation completed with note.';
  const err = new Error(typeof message === 'string' ? message : JSON.stringify(message));
  err.status = status || 200;
  err.data = responseData || null;
  return err;
}

/**
 * Standalone mock request handler
 */
async function request(endpoint, options = {}) {
  // In standalone frontend mode, simulate immediate successful mock response
  return { success: true, endpoint, data: options.body || null };
}

export const apiClient = {
  get: (endpoint, options = {}) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'POST', body }),
  put: (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'PUT', body }),
  patch: (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'PATCH', body }),
  delete: (endpoint, options = {}) => request(endpoint, { ...options, method: 'DELETE' }),
};

export const api = apiClient;
export default apiClient;
