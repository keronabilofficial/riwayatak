export type PlatformRole = "user" | "editor" | "admin" | "super_admin";

export function getUserAccessUpdateError(input: { actorId: number; actorRole: PlatformRole; targetId: number; nextRole: PlatformRole; isDisabled: boolean }) {
  if (input.actorId === input.targetId && input.isDisabled) return { code: "BAD_REQUEST" as const, message: "لا يمكنك تعطيل حسابك الحالي." };
  if (input.actorRole !== "super_admin" && (input.nextRole === "admin" || input.nextRole === "super_admin")) return { code: "FORBIDDEN" as const, message: "ترقية المديرين تتطلب صلاحية مدير النظام." };
  return null;
}

export function getDisabledAccountError(isDisabled: boolean) {
  return isDisabled ? "This account has been disabled" : null;
}
