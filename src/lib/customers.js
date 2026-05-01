export const CUSTOMERS_KEY = "quoteapp_customers_v1";
export const CURRENT_CUSTOMER_KEY = "quoteapp_current_customer_v1";

export const defaultCustomers = [
  {
    id: "public",
    name: "Public Customer",
    loginCode: "",
    role: "public",
    discountPct: 0,
    defaultSpec: "top",
    defaultExclusions: {},
  },
  {
    id: "test_trade",
    name: "Test Trade Customer",
    loginCode: "1234",
    role: "trade",
    discountPct: 10,
    defaultSpec: "top",
    defaultExclusions: {},
  },
  {
    id: "admin_andrew",
    name: "Andrew / Timberlite Admin",
    loginCode: "9999",
    role: "admin",
    discountPct: 0,
    defaultSpec: "top",
    defaultExclusions: {},
  },
];

export function getCustomers() {
  try {
    const saved = JSON.parse(localStorage.getItem(CUSTOMERS_KEY) || "null");

    if (Array.isArray(saved)) {
      return saved;
    }

    return defaultCustomers;
  } catch {
    return defaultCustomers;
  }
}

export function saveCustomers(customers) {
  try {
    localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers || []));
    window.dispatchEvent(new Event("quoteapp_customers_updated"));
  } catch {}
}

export function findCustomerByLoginCode(code) {
  const cleanCode = String(code || "").trim();

  if (!cleanCode) return null;

  return getCustomers().find(
    (customer) => String(customer.loginCode || "").trim() === cleanCode
  );
}

export function getCurrentCustomer() {
  try {
    const saved = JSON.parse(
      localStorage.getItem(CURRENT_CUSTOMER_KEY) || "null"
    );

    if (saved && saved.id) {
      return saved;
    }

    return null;
  } catch {
    return null;
  }
}

export function setCurrentCustomer(customer) {
  try {
    if (!customer) {
      localStorage.removeItem(CURRENT_CUSTOMER_KEY);
      const existingRole = localStorage.getItem("quoteapp_user_role");

localStorage.setItem(
  "quoteapp_user_role",
  existingRole === "admin" ? "admin" : customer.role || "public"
);
      window.dispatchEvent(new Event("quoteapp_customer_updated"));
      window.dispatchEvent(new Event("quoteapp_user_role_updated"));
      return;
    }

    localStorage.setItem(CURRENT_CUSTOMER_KEY, JSON.stringify(customer));
    localStorage.setItem("quoteapp_user_role", customer.role || "public");

    window.dispatchEvent(new Event("quoteapp_customer_updated"));
    window.dispatchEvent(new Event("quoteapp_user_role_updated"));
  } catch {}
}

export function logoutCustomer() {
  try {
    // Remove current logged-in customer
    localStorage.removeItem(CURRENT_CUSTOMER_KEY);

    // Check if this device is marked as admin
    const isAdminDevice =
      localStorage.getItem("quoteapp_admin_device") === "true";

    // Restore correct role
    localStorage.setItem(
      "quoteapp_user_role",
      isAdminDevice ? "admin" : "public"
    );

    window.dispatchEvent(new Event("quoteapp_customer_updated"));
    window.dispatchEvent(new Event("quoteapp_user_role_updated"));
  } catch {}
}