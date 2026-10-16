import { useState, useEffect, useCallback } from "react";

const BASE =
  import.meta.env.VITE_API_URL ||
  "https://cuyotech-university-system.onrender.com/api";
export const TOKEN_KEY = "ssis-token";
export const getToken = () => localStorage.getItem(TOKEN_KEY);

export async function api(path, { method = "GET", body } = {}) {
  let res;
  try {
    res = await fetch(BASE + path, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(getToken() && { Authorization: `Bearer ${getToken()}` }),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error(
      "Cannot reach the server. Is the backend running on port 4000?",
    );
  }
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && path !== "/auth/login") {
    localStorage.removeItem(TOKEN_KEY);
    location.assign("/login");
  }
  if (!res.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// Loads data and exposes loading/error state. The first load shows the skeleton for at least 450ms
// (remove the wait() call if you don't want that). reload() refreshes quietly without the skeleton.
export function useFetch(path) {
  const [st, set] = useState({ data: null, loading: true, error: "" });
  const run = useCallback(
    (silent) => {
      if (!silent) set((s) => ({ ...s, loading: true, error: "" }));
      return Promise.all([api(path), silent ? 0 : wait(450)])
        .then(([d]) => set({ data: d, loading: false, error: "" }))
        .catch((e) => set((s) => ({ ...s, loading: false, error: e.message })));
    },
    [path],
  );
  useEffect(() => {
    run(false);
  }, [run]);
  return { ...st, reload: () => run(true), retry: () => run(false) };
}
