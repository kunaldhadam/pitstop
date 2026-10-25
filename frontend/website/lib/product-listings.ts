const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type ListingType = "car" | "bike" | "spare_part";

export type ProductListing = {
  id: number;
  listing_type: ListingType;
  title: string;
  description: string;
  price: string;
  currency: string;
  is_price_negotiable: boolean;
  location: string;
  condition: string;
  make: string;
  model_name: string;
  year: number | null;
  mileage_km: number | null;
  fuel_type: string;
  transmission: string;
  color: string;
  previous_owners: number | null;
  has_service_history: boolean;
  features: string[];
  part_category: string;
  part_subcategory: string;
  part_name: string;
  brand: string;
  oem_part_number: string;
  compatible_vehicles: {
    make: string;
    model: string;
    year_from: number;
    year_to: number;
  }[];
  quantity_available: number | null;
  warranty_details: string;
  return_policy: string;
  video: string | null;
  status: string;
  moderation_note: string;
  created_at: string;
  seller: {
    name: string;
    account_type: string | null;
    email: string;
    phone_number: string | null;
  };
  image_files: {
    id: number;
    image: string;
    alt_text: string;
  }[];
};

export const productApiBaseUrl = apiBaseUrl;

function readCookie(name: string) {
  return document.cookie
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${name}=`))
    ?.split("=")[1];
}

async function getCsrfToken() {
  let token = readCookie("csrftoken");
  if (!token) {
    const response = await fetch(
      `${apiBaseUrl}/_allauth/browser/v1/config`,
      { credentials: "include" },
    );
    if (!response.ok) {
      throw new Error(
        "Unable to initialize secure listing updates. Refresh and try again.",
      );
    }
    token = readCookie("csrftoken");
  }

  if (!token) {
    throw new Error(
      "Unable to initialize secure listing updates. Refresh and try again.",
    );
  }

  return decodeURIComponent(token);
}

function collectMessages(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(collectMessages);
  if (typeof value === "object" && value !== null) {
    return Object.values(value).flatMap(collectMessages);
  }
  return [];
}

export async function productApiError(response: Response) {
  const responseText = await response.text();
  let body: unknown;
  if (responseText) {
    try {
      body = JSON.parse(responseText);
    } catch {
      body = responseText;
    }
  }
  const message = collectMessages(body).join(" ");
  return (
    message ||
    `The listing request failed (${response.status} ${response.statusText}).`
  );
}

export async function requestProductApi(
  endpoint: string,
  init: RequestInit = {},
) {
  const headers = new Headers(init.headers);
  const method = (init.method ?? "GET").toUpperCase();
  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    headers.set("X-CSRFToken", await getCsrfToken());
  }

  const response = await fetch(`${apiBaseUrl}${endpoint}`, {
    ...init,
    headers,
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error(await productApiError(response));
  }
  return response;
}
