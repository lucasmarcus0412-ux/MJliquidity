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

export function getApiUrl(): string {
  const host = process.env.EXPO_PUBLIC_DOMAIN;

  if (Platform.OS !== 'web' && host) {
    const hostname = host.split(':')[0];
    const url = new URL(`https://${hostname}`);
    return url.href;
  }

  if (typeof window !== 'undefined' && window.location) {
    const origin = window.location.origin;
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return 'http://localhost:5000/';
    }
    if (host) {
      const hostname = host.split(':')[0];
      return `https://${hostname}/`;
    }
    return origin.endsWith('/') ? origin : origin + '/';
  }

  return 'http://localhost:5000/';
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

async function ensureJsonResponse(res: Response): Promise<void> {
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    const body = await res.text();
    if (body.trim().startsWith("<!DOCTYPE") || body.trim().startsWith("<html")) {
      throw new Error("Server returned HTML instead of JSON. The API may be unreachable.");
    }
  }
}

export async function apiRequest(
  method: string,
  route: string,
  data?: unknown | undefined,
): Promise<Response> {
  const baseUrl = getApiUrl();
  const url = new URL(route, baseUrl);

  const res = await apiFetch(url.toString(), {
    method,
    headers: {
      "Accept": "application/json",
      ...(data ? { "Content-Type": "application/json" } : {}),
    },
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await ensureJsonResponse(res);
  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const baseUrl = getApiUrl();
    const url = new URL(queryKey.join("/") as string, baseUrl);

    const res = await apiFetch(url.toString(), {
      credentials: "include",
      headers: { "Accept": "application/json" },
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await ensureJsonResponse(res);
    await throwIfResNotOk(res);
    return await res.json();
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
