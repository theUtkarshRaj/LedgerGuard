import { apiRequest, toSearchParams } from "./apiClient.js";

/**
 * @param {Record<string, string|number|undefined>} params — page, limit, from, to, category, type, q
 */
export async function getRecords(params = {}, options = {}) {
  const q = toSearchParams(params);
  const suffix = q.toString() ? `?${q}` : "";
  const data = await apiRequest(`/api/records${suffix}`, options);
  if (!data) throw new Error("Failed to fetch records");
  return data;
}

export async function createRecord(body) {
  const data = await apiRequest("/api/records", { method: "POST", body });
  if (!data) throw new Error("Failed to create record");
  return data;
}

export async function updateRecord(id, body) {
  const data = await apiRequest(`/api/records/${id}`, {
    method: "PATCH",
    body,
  });
  if (!data) throw new Error("Failed to update record");
  return data;
}

export async function deleteRecord(id) {
  return apiRequest(`/api/records/${id}`, { method: "DELETE" });
}
