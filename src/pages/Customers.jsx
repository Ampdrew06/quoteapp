import React, { useState } from "react";
import { getCustomers, saveCustomers } from "../lib/customers";
import NavTabs from "../components/NavTabs";

export default function Customers() {
  const [customers, setCustomers] = useState(() => getCustomers());

  const [form, setForm] = useState({
  id: "",
  name: "",
  loginCode: "",
  role: "trade",
  discountPct: 0,
  defaultSpec: "top",

  email: "",
  phone: "",
  address1: "",
  address2: "",
  town: "",
  county: "",
  postcode: "",

  defaultDeliveryMilesOneWay: 0,
});

  const updateForm = (patch) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const saveCustomer = () => {
    const id =
      form.id.trim() ||
      form.name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");

    if (!id || !form.name.trim() || !form.loginCode.trim()) {
      alert("Please enter customer name and login code.");
      return;
    }

    const nextCustomer = {
  id,
  name: form.name.trim(),
  loginCode: form.loginCode.trim(),
  role: form.role,
  discountPct: Number(form.discountPct || 0),
  defaultSpec: form.defaultSpec,

  email: form.email,
  phone: form.phone,
  address1: form.address1,
  address2: form.address2,
  town: form.town,
  county: form.county,
  postcode: form.postcode,

  defaultDeliveryMilesOneWay: Number(form.defaultDeliveryMilesOneWay || 0),

  defaultExclusions: {},
};

    const next = customers.filter((c) => c.id !== id);
    next.push(nextCustomer);

    setCustomers(next);
    saveCustomers(next);

    setForm({
      id: "",
      name: "",
      loginCode: "",
      role: "trade",
      discountPct: 0,
      defaultSpec: "top",
    });
  };

  const editCustomer = (customer) => {
  setForm({
    id: customer.id || "",
    name: customer.name || "",
    loginCode: customer.loginCode || "",
    role: customer.role || "trade",
    discountPct: Number(customer.discountPct || 0),
    defaultSpec: customer.defaultSpec || "top",

    email: customer.email || "",
    phone: customer.phone || "",
    address1: customer.address1 || "",
    address2: customer.address2 || "",
    town: customer.town || "",
    county: customer.county || "",
    postcode: customer.postcode || "",

    defaultDeliveryMilesOneWay:
      Number(customer.defaultDeliveryMilesOneWay || 0),
  });
};

  const deleteCustomer = (id) => {
    if (!window.confirm("Delete this customer?")) return;

    const next = customers.filter((c) => c.id !== id);
    setCustomers(next);
    saveCustomers(next);
  };

  return (
    <div style={{ fontFamily: "Inter, system-ui, Arial" }}>
      <NavTabs />

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: 16 }}>
        <h1>Customers</h1>

        <div
          style={{
            padding: 14,
            border: "1px solid #d1d5db",
            borderRadius: 8,
            background: "#f9fafb",
            marginBottom: 20,
          }}
        >
          <h3 style={{ marginTop: 0 }}>Add / Edit Customer</h3>

          <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr" }}>
            <label>
              Customer Name
              <input
                value={form.name}
                onChange={(e) => updateForm({ name: e.target.value })}
                style={{ width: "100%", padding: 8 }}
              />
            </label>

            <label>
              Login Code
              <input
                value={form.loginCode}
                onChange={(e) => updateForm({ loginCode: e.target.value })}
                style={{ width: "100%", padding: 8 }}
              />
            </label>

            <label>
              Role
              <select
                value={form.role}
                onChange={(e) => updateForm({ role: e.target.value })}
                style={{ width: "100%", padding: 8 }}
              >
                <option value="public">Public</option>
                <option value="trade">Trade</option>
                <option value="admin">Admin</option>
              </select>
            </label>

            <label>
              Discount (%)
              <input
                type="number"
                value={form.discountPct}
                onChange={(e) => updateForm({ discountPct: e.target.value })}
                style={{ width: "100%", padding: 8 }}
              />
            </label>

            <label>
              Default Spec
              <select
                value={form.defaultSpec}
                onChange={(e) => updateForm({ defaultSpec: e.target.value })}
                style={{ width: "100%", padding: 8 }}
              >
                <option value="top">Top Spec</option>
                <option value="usual">Usual Spec</option>
              </select>
            </label>
            <label>
  Email
  <input
    value={form.email}
    onChange={(e) => updateForm({ email: e.target.value })}
  />
</label>

<label>
  Phone
  <input
    value={form.phone}
    onChange={(e) => updateForm({ phone: e.target.value })}
  />
</label>

<label>
  Address Line 1
  <input
    value={form.address1}
    onChange={(e) => updateForm({ address1: e.target.value })}
  />
</label>

<label>
  Address Line 2
  <input
    value={form.address2}
    onChange={(e) => updateForm({ address2: e.target.value })}
  />
</label>

<label>
  Town
  <input
    value={form.town}
    onChange={(e) => updateForm({ town: e.target.value })}
  />
</label>

<label>
  County
  <input
    value={form.county}
    onChange={(e) => updateForm({ county: e.target.value })}
  />
</label>

<label>
  Postcode
  <input
    value={form.postcode}
    onChange={(e) => updateForm({ postcode: e.target.value.toUpperCase() })}
  />
</label>

<label>
  Default Delivery Miles (one-way)
  <input
    type="number"
    value={form.defaultDeliveryMilesOneWay}
    onChange={(e) =>
      updateForm({ defaultDeliveryMilesOneWay: Number(e.target.value) })
    }
  />
</label>
          </div>

          <button
            onClick={saveCustomer}
            style={{
              marginTop: 12,
              padding: "8px 14px",
              borderRadius: 6,
              border: "1px solid #2563eb",
              background: "#2563eb",
              color: "white",
              cursor: "pointer",
            }}
          >
            Save Customer
          </button>
        </div>

        <h3>Saved Customers</h3>

        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr>
              <th style={th}>Name</th>
              <th style={th}>Login Code</th>
              <th style={th}>Role</th>
              <th style={th}>Discount</th>
              <th style={th}>Spec</th>
              <th style={th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id}>
                <td style={td}>{c.name}</td>
                <td style={td}>{c.loginCode || "—"}</td>
                <td style={td}>{c.role}</td>
                <td style={td}>{Number(c.discountPct || 0)}%</td>
                <td style={td}>{c.defaultSpec || "top"}</td>
                <td style={td}>
                  <button onClick={() => editCustomer(c)}>Edit</button>{" "}
                  {c.id !== "public" && (
                    <button onClick={() => deleteCustomer(c.id)}>Delete</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const th = {
  textAlign: "left",
  padding: 8,
  borderBottom: "1px solid #d1d5db",
  background: "#f3f4f6",
};

const td = {
  padding: 8,
  borderBottom: "1px solid #e5e7eb",
};