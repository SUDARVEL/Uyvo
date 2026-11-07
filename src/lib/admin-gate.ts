export const ADMIN_ID = 'admin';
export const ADMIN_PASSWORD = 'Uyvo1847';

export function adminMatches(id: string, password: string): boolean {
  return id.trim().toLowerCase() === ADMIN_ID && password === ADMIN_PASSWORD;
}
