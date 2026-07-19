import { createHmac } from "node:crypto";

const SOC_ACTIVITY_POOL_SIZE = 384;
const SOC_ASSIGNED_REVIEW_COUNT = 96;
const SOC_FALSE_POSITIVE_COUNT = 80;

export type SocActivityFacts = {
  activityId: string;
  timestamp: string;
  assetId: string;
  actor: string;
  activityType: string;
};

export type SocStage5Discrepancy = {
  schemaVersion: "1.0";
  assignmentId: string;
  internCode: string;
  instructions: string[];
  reviewCandidates: Array<{ activityId: string }>;
  changeRecords: Array<{
    changeId: string;
    activityId: string;
    assetId: string;
    actor: string;
    owner: string;
    approvedBy: string;
    status: "APPROVED" | "PENDING";
    startsAt: string;
    endsAt: string;
    purpose: string;
  }>;
};

function discrepancySecret(): string {
  if (process.env.ADVANCED_VARIANT_SECRET) return process.env.ADVANCED_VARIANT_SECRET;
  if (process.env.NODE_ENV === "production") {
    throw new Error("ADVANCED_VARIANT_SECRET is required in production");
  }
  return process.env.NEXTAUTH_SECRET ?? "local-development-only";
}

function rank(binding: string, label: string, value: number): string {
  return createHmac("sha256", discrepancySecret())
    .update(`${binding}:${label}:${value}`)
    .digest("hex");
}

export function socStage5ActivityFacts(index: number): SocActivityFacts {
  if (!Number.isInteger(index) || index < 1 || index > SOC_ACTIVITY_POOL_SIZE) {
    throw new Error(`SOC activity index must be 1-${SOC_ACTIVITY_POOL_SIZE}`);
  }
  const base = Date.UTC(2026, 5, 1);
  const second = (index % 28) * 86_400 + 32_400 + (index % 113) * 41;
  const timestamp = new Date(base + second * 1000).toISOString();
  return {
    activityId: `REVIEW-${String(index).padStart(4, "0")}`,
    timestamp,
    assetId: `asset-${String((index % 48) + 1).padStart(3, "0")}`,
    actor: `svc-${String((index % 36) + 1).padStart(3, "0")}`,
    activityType: [
      "remote-admin",
      "bulk-export",
      "credential-validation",
      "software-deployment",
      "network-discovery",
      "scheduled-transfer",
    ][index % 6],
  };
}

export function socStage5DiscrepancyFor(
  internId: string,
  internCode: string,
  marker: string
): SocStage5Discrepancy {
  const binding = `STAGE_5:${internId}:${internCode}:${marker}`;
  const selected = Array.from({ length: SOC_ACTIVITY_POOL_SIZE }, (_, offset) => offset + 1)
    .sort((left, right) => rank(binding, "select", left).localeCompare(rank(binding, "select", right)))
    .slice(0, SOC_ASSIGNED_REVIEW_COUNT);
  const approved = new Set(
    [...selected]
      .sort((left, right) => rank(binding, "approve", left).localeCompare(rank(binding, "approve", right)))
      .slice(0, SOC_FALSE_POSITIVE_COUNT)
  );

  const changeRecords = selected.map((index) => {
    const activity = socStage5ActivityFacts(index);
    const activityTime = new Date(activity.timestamp).getTime();
    const valid = approved.has(index);
    const failureMode = index % 4;
    return {
      changeId: `CHG-${rank(binding, "change", index).slice(0, 10).toUpperCase()}`,
      activityId: activity.activityId,
      assetId: valid || failureMode !== 0 ? activity.assetId : "asset-999",
      actor: valid || failureMode !== 1 ? activity.actor : "svc-unapproved",
      owner: ["Platform", "IT Operations", "Security Engineering", "Data Services"][index % 4],
      approvedBy: valid || failureMode !== 2 ? "change-board" : "requestor-only",
      status: valid || failureMode !== 3 ? "APPROVED" as const : "PENDING" as const,
      startsAt: new Date(activityTime - (valid ? 15 : 180) * 60_000).toISOString(),
      endsAt: new Date(activityTime + (valid ? 45 : -60) * 60_000).toISOString(),
      purpose: [
        "Approved maintenance and validation window",
        "Controlled migration rehearsal",
        "Authorized inventory and deployment activity",
        "Scheduled resilience exercise",
      ][index % 4],
    };
  }).sort((left, right) =>
    rank(binding, "display", Number(left.activityId.slice(-4))).localeCompare(
      rank(binding, "display", Number(right.activityId.slice(-4)))
    )
  );

  return {
    schemaVersion: "1.0",
    assignmentId: `SOC-A1-${rank(binding, "assignment", 0).slice(0, 12).toUpperCase()}`,
    internCode,
    instructions: [
      "Investigate only the 96 review_candidates against the shared evidence pack.",
      "Exactly 80 candidates have a valid benign explanation, but a record is valid only when activity, asset, actor, approval, status, and time window all reconcile.",
      "The remaining 16 contain a wrong asset, wrong actor, invalid approver, pending status, or non-covering time window and must be escalated.",
      "Do not classify from names or appearance; cite raw event locators and the controlling change record.",
    ],
    reviewCandidates: selected.map((index) => ({ activityId: socStage5ActivityFacts(index).activityId })),
    changeRecords,
  };
}
