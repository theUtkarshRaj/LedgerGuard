import { apiRequest, toSearchParams } from "./apiClient.js";

/** One round-trip: summary + categories + recent (avoids 3× auth DB hits on remote DBs). */
export async function getDashboardOverview(limit = 5) {
  const q = toSearchParams({ limit });
  const data = await apiRequest(`/api/dashboard/overview?${q}`);
  if (!data?.data) throw new Error("Failed to fetch dashboard");
  return data;
}

export async function fetchDashboardData(options = {}) {
  const data = await apiRequest("/api/dashboard", options);
  if (!data?.data) throw new Error("Failed to fetch dashboard data");
  return data;
}

export async function getSummary() {
  const data = await apiRequest("/api/dashboard/summary");
  if (!data) throw new Error("Failed to fetch dashboard summary");
  return data;
}

export async function getDashboardCategories() {
  const data = await apiRequest("/api/dashboard/categories");
  if (!data) throw new Error("Failed to fetch categories");
  return data;
}

export async function getDashboardRecent(limit = 5) {
  const q = toSearchParams({ limit });
  const data = await apiRequest(`/api/dashboard/recent?${q}`);
  if (!data) throw new Error("Failed to fetch recent activity");
  return data;
}
