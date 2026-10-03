import { customerFromRecord, customerToRecord } from "./customerRecords";
import { supabase } from "./supabaseClient";

export const CURRENT_CUSTOMER_KEY = "quoteapp_current_customer_v1";

/*
  Default fallback customers.
  These are ONLY used if Supabase fails completely.
*/

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

/*
  LOAD CUSTOMERS
*/

export async function getCustomers() {
  try {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("SUPABASE GET CUSTOMERS ERROR", error);
      return defaultCustomers;
    }

    return Array.isArray(data) ? data.map(customerFromRecord) : [];
  } catch (err) {
    console.error("GET CUSTOMERS FAILED", err);
    return defaultCustomers;
  }
}

/*
  SAVE ALL CUSTOMERS
  (simple replace strategy for now)
*/

// Update existing UUIDs in place; never delete the customer list as part of saving.
export async function saveCustomerRecord(customer) {
  try {
    const row = customerToRecord(customer, () => crypto.randomUUID());
    const { data, error } = await supabase.from("customers").upsert(row, { onConflict: "id" }).select("*").single();
    if (error) return { customer: null, error: error.message || "Customer save failed." };
    const saved = customerFromRecord(data);
    const current = getCurrentCustomer();
    if (current?.id === saved.id) setCurrentCustomer({ ...current, ...saved });
    window.dispatchEvent(new Event("quoteapp_customers_updated"));
    return { customer: saved, error: null };
  } catch (error) {
    return { customer: null, error: error.message || "Customer save failed." };
  }
}
export async function deleteCustomerRecord(id) {
  try {
    const { error } = await supabase.from("customers").delete().eq("id", id);
    if (error) return false;
    window.dispatchEvent(new Event("quoteapp_customers_updated"));
    return true;
  } catch { return false; }
}
// Retained for callers outside the Customers page; saves without replacing the table.
export async function saveCustomers(customers) {
  for (const customer of customers || []) {
    const saved = await saveCustomerRecord(customer);
    if (saved.error) return false;
  }
  return true;
}

/*
  FIND CUSTOMER BY LOGIN CODE
*/

export async function findCustomerByLoginCode(code) {
  const cleanCode = String(code || "").trim();

  if (!cleanCode) return null;

  try {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("login_code", cleanCode)
      .maybeSingle();

    if (error) {
      console.error("LOGIN LOOKUP ERROR", error);
      return null;
    }

    return data ? customerFromRecord(data) : null;
  } catch (err) {
    console.error("LOGIN LOOKUP FAILED", err);
    return null;
  }
}

/*
  CURRENT CUSTOMER
  (still localStorage)
*/

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
        existingRole === "admin"
          ? "admin"
          : customer?.role || "public"
      );

      window.dispatchEvent(new Event("quoteapp_customer_updated"));
      window.dispatchEvent(new Event("quoteapp_user_role_updated"));

      return;
    }

    localStorage.setItem(CURRENT_CUSTOMER_KEY, JSON.stringify(customer));

    localStorage.setItem(
      "quoteapp_user_role",
      customer.role || "public"
    );

    window.dispatchEvent(new Event("quoteapp_customer_updated"));
    window.dispatchEvent(new Event("quoteapp_user_role_updated"));
  } catch {}
}

export function logoutCustomer() {
  try {
    localStorage.removeItem(CURRENT_CUSTOMER_KEY);

    const isAdminDevice =
      localStorage.getItem("quoteapp_admin_device") === "true";

    localStorage.setItem(
      "quoteapp_user_role",
      isAdminDevice ? "admin" : "public"
    );

    window.dispatchEvent(new Event("quoteapp_customer_updated"));
    window.dispatchEvent(new Event("quoteapp_user_role_updated"));
  } catch {}
}