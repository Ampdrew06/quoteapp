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

    return Array.isArray(data)
  ? data.map((customer) => ({
      id: customer.id,
      name: customer.name || "",
      username: customer.username || "",
      loginCode: customer.login_code || "",
      role: customer.role || "trade",
      discountPct: Number(customer.discount_pct || 0),
    }))
  : [];
  } catch (err) {
    console.error("GET CUSTOMERS FAILED", err);
    return defaultCustomers;
  }
}

/*
  SAVE ALL CUSTOMERS
  (simple replace strategy for now)
*/

export async function saveCustomers(customers) {
  try {
    // Delete existing
    const { error: deleteError } = await supabase
  .from("customers")
  .delete()
  .not("id", "is", null);

    if (deleteError) {
      console.error("DELETE CUSTOMERS ERROR", deleteError);
      return false;
    }

    // Insert new
    const rowsToInsert = (customers || []).map((customer) => {
  const row = {
  name: customer.name || "",
  username: customer.username || customer.name || "",
  login_code: customer.loginCode || "",
  role: customer.role || "trade",
  discount_pct: Number(customer.discountPct || 0),
};

  // Only send id if it is already a real Supabase UUID.
  // Do not send old localStorage ids like "test_trade" or "admin_andrew".
  if (
  customer.id &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    customer.id
  )
) {
  row.id = customer.id;
} else {
  row.id = crypto.randomUUID();
}

  return row;
});

const { error: insertError } = await supabase
  .from("customers")
  .insert(rowsToInsert);

    if (insertError) {
      console.error("INSERT CUSTOMERS ERROR", insertError);
      return false;
    }

    window.dispatchEvent(new Event("quoteapp_customers_updated"));

    return true;
  } catch (err) {
    console.error("SAVE CUSTOMERS FAILED", err);
    return false;
  }
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

    return data
  ? {
      id: data.id,
      name: data.name || "",
      username: data.username || "",
      loginCode: data.login_code || "",
      role: data.role || "trade",
      discountPct: Number(data.discount_pct || 0),
    }
  : null;
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