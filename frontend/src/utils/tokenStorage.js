/**
 * Modular Token Storage Abstraction
 * Isolates local token persistence strategy so it can later be migrated
 * to HTTP-only cookies without modifying React components or context code.
 */

const TOKEN_KEY = 'farmdex_access_token';

export const tokenStorage = {
  /**
   * Retrieve stored access token
   * @returns {string|null}
   */
  getToken() {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },

  /**
   * Persist access token
   * @param {string} token
   */
  setToken(token) {
    try {
      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
      }
    } catch (error) {
      console.error('Failed to save authentication token:', error);
    }
  },

  /**
   * Clear access token
   */
  removeToken() {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch (error) {
      console.error('Failed to remove authentication token:', error);
    }
  },
};
