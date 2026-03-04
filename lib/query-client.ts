import { Platform } from "react-native";
import { QueryClient, QueryFunction } from "@tanstack/react-query";

const apiFetch: typeof globalThis.fetch = (() => {
  if (Platform.OS === "web") {
    return globalThis.fetch.bind(globalThis);
  }
  try {
    return require("expo/fetch").fetch;
  } catch {
    return globalThis.fetch.bind(globalThis);
  }
})();

const API_BASE_URL = 'https://mjliquidity.replit.app';

export function getApiUrl(): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) {
    return window.location.origin;
  }
  return API_BASE_URL;
}

export async function apiRequest(
  method: string,
  route: string,
  data?: unknown | undefined,
): Promise<Response> {
  const baseUrl = getApiUrl();
  const url = `${baseUrl}${route.startsWith('/') ? route : '/' + route}`;

  const res = await apiFetch(url, {
    method,
    headers: {
      "Accept": "application/json",
      ...(data ? { "Content-Type": "application/json" } : {}),
    },
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!res.ok) {
    let errorText = res.statusText;
    try { errorText = await res.text(); } catch {}
    throw new Error(`${res.status}: ${errorText}`);
  }
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const baseUrl = getApiUrl();
    const path = queryKey.join("/");
    const url = `${baseUrl}${path.startsWith('/') ? path : '/' + path}`;

    const res = await apiFetch(url, {
      headers: { "Accept": "application/json" },
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    if (!res.ok) {
      let errorText = res.statusText;
      try { errorText = await res.text(); } catch {}
      throw new Error(`${res.status}: ${errorText}`);
    }

    const text = await res.text();
    return JSON.parse(text);
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
