/**
 * API base URL configuration.
 *
 * Defaults to an empty string, meaning API calls use relative paths and hit
 * whatever origin served the page — this is exactly today's Render
 * deployment, where one server serves both the frontend and the API, so
 * behavior there is unchanged.
 *
 * When the frontend is instead served from GitHub Pages, the build sets
 * VITE_API_BASE_URL to the Render backend's URL so requests are routed
 * cross-origin to it.
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

/**
 * Whether the frontend is talking to a cross-origin backend. Used to decide
 * whether the app needs to wait for the backend to wake up before showing
 * the survey.
 */
export const IS_CROSS_ORIGIN_API = API_BASE_URL !== "";

export function apiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}
