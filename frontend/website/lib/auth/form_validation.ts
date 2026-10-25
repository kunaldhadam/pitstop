const required = (message: string) => (value: string) =>
  value.trim() ? "" : message;

const minLength =
  (field: string, length: number, message?: string) => (value: string) =>
    value.length >= length
      ? ""
      : (message ?? `${field} must be at least ${length} characters.`);

const pattern = (regex: RegExp, message: string) => (value: string) =>
  regex.test(value.trim()) ? "" : message;

const fieldRules: Record<string, ((value: string) => string)[]> = {
  username: [
    required("Username is required."),
    minLength("Username", 3),
    pattern(
      /^[a-zA-Z0-9_]+$/,
      "Only letters, numbers, and underscores are allowed.",
    ),
  ],

  email: [
    required("Email is required."),
    pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Enter a valid email address."),
  ],

  password: [minLength("Password", 8)],

  phone: [pattern(/^[6-9]\d{9}$/, "Enter a valid 10-digit phone number.")],
};

export const validateField = (name: string, value: string) => {
  const rules = fieldRules[name] || [];

  for (const rule of rules) {
    const error = rule(value);

    if (error) return error;
  }

  return "";
};

export const validateForm = (fields: Record<string, string>) => {
  const errors: Record<string, string> = {};

  Object.entries(fields).forEach(([name, value]) => {
    const error = validateField(name, value);
    if (error) errors[name] = error;
  });

  return errors;
};
