import { createHmac } from "node:crypto";

export type AdvancedVariant = {
  cohort: string;
  variant: string;
  marker: string;
};

function advancedVariantSecret(): string {
  if (process.env.ADVANCED_VARIANT_SECRET) return process.env.ADVANCED_VARIANT_SECRET;
  if (process.env.NODE_ENV === "production") {
    throw new Error("ADVANCED_VARIANT_SECRET is required in production");
  }
  return process.env.NEXTAUTH_SECRET ?? "local-development-only";
}

export function advancedVariantFor(
  internId: string,
  internCode: string,
  stage: string
): AdvancedVariant {
  const secret = advancedVariantSecret();
  const digest = createHmac("sha256", secret)
    .update(`${stage}:${internId}:${internCode}`)
    .digest("hex");
  const pool = (Number.parseInt(digest.slice(0, 8), 16) % 6) + 1;

  return {
    cohort: "ADV-C1",
    variant: `V${pool}`,
    marker: `UBI-${stage.replace("STAGE_", "A")}-${digest.slice(8, 20).toUpperCase()}`,
  };
}
