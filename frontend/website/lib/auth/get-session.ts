import { cookies } from "next/headers";

const apiUrl =
  process.env.API_INTERNAL_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000";

export async function getSession() {
  const cookieStore = await cookies();

  const cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");

  try {
    const response = await fetch(`${apiUrl}/_allauth/browser/v1/auth/session`, {
      headers: {
        Cookie: cookieHeader,
      },
      cache: "no-store",
    });

    return response.json();
  } catch (error) {
    console.error("Error fetching session:", error);
    throw error;
  }
}
