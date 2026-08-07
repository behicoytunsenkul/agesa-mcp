export const AUTH_USER = "deneme-user@test.com";
export const AUTH_PASSWORD = "DenemeUser123";

export const AUTH_STORAGE_KEY = "agesa-mcp-auth";
export const AUTH_REMEMBER_KEY = "agesa-mcp-remember";

export type AuthPayload = {
  email: string;
  loggedInAt: string;
};

export function validateCredentials(email: string, password: string) {
  return (
    email.trim().toLowerCase() === AUTH_USER.toLowerCase() &&
    password === AUTH_PASSWORD
  );
}
