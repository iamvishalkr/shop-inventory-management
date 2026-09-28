const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

export async function apiFetch<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const url = endpoint.startsWith("http")
        ? endpoint
        : `${API_BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

    const activeShopId = typeof window !== "undefined" ? localStorage.getItem("active_shop_id") : null;

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(activeShopId ? { "x-shop-id": activeShopId } : {}),
        ...(options.headers as Record<string, string>),
    };

    const res = await fetch(url, {
        ...options,
        headers,
        credentials: "include", // Ensure session cookies are sent
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        throw new Error(data.message || data.error || `HTTP error! status: ${res.status}`);
    }

    return data as T;
}
