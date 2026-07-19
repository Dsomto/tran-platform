import { createHash } from "node:crypto";

export type AdvancedVariant = {
  cohort: string;
  variant: string;
  marker: string;
};

export function advancedVariantFor(
  internId: string,
  internCode: string,
  stage: string
): AdvancedVariant {
  const digest = createHash("sha256")
    .update(`${stage}:${internId}:${internCode}`)
    .digest("hex");
  const pool = (Number.parseInt(digest.slice(0, 8), 16) % 6) + 1;

  return {
    cohort: "ADV-C1",
    variant: `V${pool}`,
    marker: `UBI-${stage.replace("STAGE_", "A")}-${digest.slice(8, 20).toUpperCase()}`,
  };
}
