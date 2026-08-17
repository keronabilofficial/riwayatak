export function canAccessManagement(role: string | null | undefined) {
  return role === "editor" || role === "admin" || role === "super_admin";
}
