import { apiRequest } from "./apiClient.js";

export async function authLogin(body) {
  return apiRequest("/api/auth/login", { method: "POST", body });
}

export async function authRegister(body) {
  return apiRequest("/api/auth/register", { method: "POST", body });
}

export async function authMe() {
  return apiRequest("/api/auth/me");
}
