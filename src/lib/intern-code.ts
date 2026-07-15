export const UNKNOWN_INTERN_CODE = "UBI-UNKNOWN";

export function resolvedInternCode(value: string | null | undefined): string {
  const code = value?.trim();
  return code || UNKNOWN_INTERN_CODE;
}
