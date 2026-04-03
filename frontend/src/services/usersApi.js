import { apiRequest, toSearchParams } from "./apiClient.js";

/**
 * @param {Record<string, string|number|undefined>} params — page, limit, role, isActive ('true'|'false'), q
 */
export async function getUsers(params = {}, options = {}) {
  const q = toSearchParams(params);
  const suffix = q.toString() ? `?${q}` : "";
  const data = await apiRequest(`/api/users${suffix}`, options);
  if (!data) throw new Error("Failed to fetch users");
  return data;
}

export async function getUsersForSelect(limit = 20, options = {}) {
  const data = await apiRequest(`/api/users?limit=${limit}`, options);
  if (!data) throw new Error("Failed to fetch users");
  return data;
}

export async function createUser(body) {
  const data = await apiRequest("/api/users", { method: "POST", body });
  if (!data) throw new Error("Failed to create user");
  return data;
}

export async function updateUser(id, body) {
  const data = await apiRequest(`/api/users/${id}`, {
    method: "PATCH",
    body,
  });
  if (!data) throw new Error("Failed to update user");
  return data;
}
