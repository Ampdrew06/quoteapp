export const USER_ROLE_KEY = "quoteapp_user_role";

export function getUserRole() {
  try {
    return localStorage.getItem(USER_ROLE_KEY) || "public";
  } catch {
    return "public";
  }
}

export function setUserRole(role) {
  try {
    localStorage.setItem(USER_ROLE_KEY, role);
    window.dispatchEvent(new Event("quoteapp_user_role_updated"));
  } catch {}
}

export function isAdminUser() {
  return getUserRole() === "admin";
}

export function isTradeUser() {
  return getUserRole() === "trade";
}

export function isPublicUser() {
  return getUserRole() === "public";
}