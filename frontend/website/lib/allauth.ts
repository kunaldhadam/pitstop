const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function readCookie(name: string) {
  return document.cookie
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${name}=`))
    ?.split("=")[1];
}

export async function postAuth(
  mode: "login" | "signup",
  body: Record<string, unknown>,
) {
  await fetch(`${apiUrl}/_allauth/browser/v1/config`, {
    credentials: "include",
  });
  const csrfToken = readCookie("csrftoken");
  if (!csrfToken)
    throw new Error(
      "Unable to initialize secure authentication. Please refresh and try again.",
    );
  return fetch(`${apiUrl}/_allauth/browser/v1/auth/${mode}`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": decodeURIComponent(csrfToken),
    },
    body: JSON.stringify(body),
  });
}

export async function logoutAuth() {
  const csrfToken = readCookie("csrftoken");

  if (!csrfToken) {
    throw new Error("No CSRF token found.");
  }

  const response = await fetch(`${apiUrl}/_allauth/browser/v1/auth/session`, {
    method: "DELETE",
    credentials: "include",
    headers: {
      "X-CSRFToken": decodeURIComponent(csrfToken),
    },
  });

  if (response.status === 401) {
    return response;
  }

  if (!response.ok) {
    const text = await response.text();
    console.log("logout error response:", text);

    throw new Error(
      `Logout failed (${response.status}): ${text || response.statusText}`,
    );
  }

  return response;
}

export async function getAuthError(response: Response) {
  const data = await response.json().catch(() => null);
  return (
    data?.errors?.[0]?.message ??
    data?.detail ??
    "We could not complete that request."
  );
}

export async function postToApi(endpoint: string, values: object | FormData) {
  await fetch(`${apiUrl}/_allauth/browser/v1/config`, {
    credentials: "include",
  });
  const csrfToken = readCookie("csrftoken");

  if (!csrfToken)
    throw new Error(
      "Unable to initialize secure authentication. Please refresh and try again.",
    );

  const isFormData = values instanceof FormData;

  const response = await fetch(`${apiUrl}${endpoint}`, {
    method: "POST",
    credentials: "include",
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      "X-CSRFToken": decodeURIComponent(csrfToken),
    },
    body: isFormData ? values : JSON.stringify(values),
  });

  const data = await response.json();

  if (!response.ok) {
    throw data;
  }

  return data;
}
