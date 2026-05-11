import { supabase } from "./supabaseClient";

export async function getQuotes() {
  try {
    const { data, error } = await supabase
      .from("quotes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("GET QUOTES ERROR", error);
      return [];
    }

    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("GET QUOTES FAILED", err);
    return [];
  }
}

export async function saveQuote(quote) {
  try {
    const { data, error } = await supabase
      .from("quotes")
      .insert([quote])
      .select()
      .single();

    if (error) {
      console.error("SAVE QUOTE ERROR", error);
      return null;
    }

    window.dispatchEvent(new Event("quoteapp_quotes_updated"));

    return data;
  } catch (err) {
    console.error("SAVE QUOTE FAILED", err);
    return null;
  }
}

export async function updateQuote(id, patch) {
  try {
    const { data, error } = await supabase
      .from("quotes")
      .update({
        ...patch,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("UPDATE QUOTE ERROR", error);
      return null;
    }

    window.dispatchEvent(new Event("quoteapp_quotes_updated"));

    return data;
  } catch (err) {
    console.error("UPDATE QUOTE FAILED", err);
    return null;
  }
}

export async function deleteQuote(id) {
  try {
    const { error } = await supabase
      .from("quotes")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("DELETE QUOTE ERROR", error);
      return false;
    }

    window.dispatchEvent(new Event("quoteapp_quotes_updated"));

    return true;
  } catch (err) {
    console.error("DELETE QUOTE FAILED", err);
    return false;
  }
}

export function generateQuoteNumber() {
  const now = new Date();

  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  const sec = String(now.getSeconds()).padStart(2, "0");

  return `Q-${yyyy}${mm}${dd}-${hh}${min}${sec}`;
}