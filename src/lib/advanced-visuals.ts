import type { AdvancedTrack } from "./advanced-stage";

export type AdvancedVisualKind =
  | "telemetry"
  | "sensor"
  | "topology"
  | "detection"
  | "forensics"
  | "recon"
  | "exploit"
  | "cloud"
  | "directory"
  | "vapt"
  | "policy"
  | "vendor"
  | "audit"
  | "hardening"
  | "breach";

export type AdvancedProjectVisual = {
  key: string;
  kind: AdvancedVisualKind;
  accent: string;
  accentStrong: string;
  accentSoft: string;
  image: string;
  imagePosition: string;
  deskLabel: string;
  metric: string;
  metricLabel: string;
  nodes: string[];
  feed: string[];
};

const visuals: Record<AdvancedTrack, AdvancedProjectVisual[]> = {
  SOC_ANALYSIS: [
    {
      key: "soc-hunt-engine",
      kind: "telemetry",
      accent: "#2dd4bf",
      accentStrong: "#0f766e",
      accentSoft: "#ccfbf1",
      image: "/images/track-soc.jpg",
      imagePosition: "center 42%",
      deskLabel: "Hunt execution console",
      metric: "5.8M",
      metricLabel: "hostile-quality events",
      nodes: ["AUTH", "DNS", "WEB", "EDR", "FW"],
      feed: ["schema.v3 accepted", "clock skew inferred", "campaign graph ready"],
    },
    {
      key: "soc-deception-sensor",
      kind: "sensor",
      accent: "#f59e0b",
      accentStrong: "#b45309",
      accentSoft: "#fef3c7",
      image: "/images/track-soc.jpg",
      imagePosition: "28% center",
      deskLabel: "Deception sensor telemetry",
      metric: "04",
      metricLabel: "protocol adapters online",
      nodes: ["EDGE", "T-POT", "HIVE", "STIX", "NDR"],
      feed: ["management path restricted", "payload hash quarantined", "sealed replay deterministic"],
    },
    {
      key: "soc-network-range",
      kind: "topology",
      accent: "#60a5fa",
      accentStrong: "#1d4ed8",
      accentSoft: "#dbeafe",
      image: "/images/track-soc.jpg",
      imagePosition: "74% center",
      deskLabel: "Routed range controller",
      metric: "07",
      metricLabel: "enterprise zones as code",
      nodes: ["USER", "FIN", "ENG", "DMZ", "MGMT", "GUEST", "SRV"],
      feed: ["nftables policy loaded", "negative paths denied", "sensor mirror receiving"],
    },
    {
      key: "soc-detection-lab",
      kind: "detection",
      accent: "#fb7185",
      accentStrong: "#be123c",
      accentSoft: "#ffe4e6",
      image: "/images/track-soc.jpg",
      imagePosition: "40% 38%",
      deskLabel: "Adversary regression bench",
      metric: "36",
      metricLabel: "attack and benign fixtures",
      nodes: ["RAW", "DECODE", "RULE", "ALERT", "TEST"],
      feed: ["semantic mutation replayed", "benign suite remains quiet", "clean deployment verified"],
    },
    {
      key: "soc-incident-response",
      kind: "forensics",
      accent: "#22d3ee",
      accentStrong: "#0e7490",
      accentSoft: "#cffafe",
      image: "/images/track-soc.jpg",
      imagePosition: "62% center",
      deskLabel: "DFIR evidence timeline",
      metric: "03+",
      metricLabel: "hosts in the incident chain",
      nodes: ["MAIL", "DISK", "MEM", "EVTX", "PCAP"],
      feed: ["acquisition hashes verified", "source clocks corrected", "archive fragments indexed"],
    },
  ],
  ETHICAL_HACKING: [
    {
      key: "eh-recon-engine",
      kind: "recon",
      accent: "#a3e635",
      accentStrong: "#4d7c0f",
      accentSoft: "#ecfccb",
      image: "/images/track-ethical-hacking.jpg",
      imagePosition: "62% center",
      deskLabel: "Authorized attack surface",
      metric: "01",
      metricLabel: "validated foothold required",
      nodes: ["DNS", "HTTP", "TLS", "API", "PROOF"],
      feed: ["scope guard active", "surface graph enriched", "foothold proof bounded"],
    },
    {
      key: "eh-exploit-chain",
      kind: "exploit",
      accent: "#fb923c",
      accentStrong: "#c2410c",
      accentSoft: "#ffedd5",
      image: "/images/track-ethical-hacking.jpg",
      imagePosition: "18% center",
      deskLabel: "Exploit reliability harness",
      metric: "03x",
      metricLabel: "clean-chain reliability run",
      nodes: ["ENTRY", "FOOTHOLD", "PRIV", "ROOT", "CLEAN"],
      feed: ["precondition asserted", "chain executed from clean state", "cleanup proof emitted"],
    },
    {
      key: "eh-cloud-range",
      kind: "cloud",
      accent: "#38bdf8",
      accentStrong: "#0369a1",
      accentSoft: "#e0f2fe",
      image: "/images/track-ethical-hacking.jpg",
      imagePosition: "75% center",
      deskLabel: "AWS IAM attack graph",
      metric: "IAM",
      metricLabel: "custom range compromise path",
      nodes: ["USER", "ROLE", "POLICY", "TOKEN", "DATA"],
      feed: ["effective permissions derived", "escalation edge reproduced", "remediation regression queued"],
    },
    {
      key: "eh-own-forest",
      kind: "directory",
      accent: "#f43f5e",
      accentStrong: "#be123c",
      accentSoft: "#ffe4e6",
      image: "/images/track-ethical-hacking.jpg",
      imagePosition: "46% center",
      deskLabel: "Directory operation map",
      metric: "AD",
      metricLabel: "forest path under live defense",
      nodes: ["USER", "HOST", "SERVICE", "ADMIN", "FOREST"],
      feed: ["attack path calculated", "privilege transition evidenced", "rollback state captured"],
    },
    {
      key: "eh-vapt-retest",
      kind: "vapt",
      accent: "#facc15",
      accentStrong: "#a16207",
      accentSoft: "#fef9c3",
      image: "/images/track-ethical-hacking.jpg",
      imagePosition: "70% 45%",
      deskLabel: "Engagement and retest desk",
      metric: "3/3",
      metricLabel: "repeatable exploit-chain runs",
      nodes: ["SCOPE", "TEST", "CHAIN", "PATCH", "RETEST"],
      feed: ["runtime identifiers discovered", "root cause independently verified", "patched regression executed"],
    },
  ],
  GRC: [
    {
      key: "grc-policy-code",
      kind: "policy",
      accent: "#34d399",
      accentStrong: "#047857",
      accentSoft: "#d1fae5",
      image: "/images/track-grc.png",
      imagePosition: "center 42%",
      deskLabel: "Policy decision compiler",
      metric: "30",
      metricLabel: "public and hidden state fixtures",
      nodes: ["INPUT", "SCHEMA", "REGO", "DECISION", "AUDIT"],
      feed: ["exception expiry enforced", "malformed state fails closed", "control report generated"],
    },
    {
      key: "grc-vendor-verifier",
      kind: "vendor",
      accent: "#3b82f6",
      accentStrong: "#1d4ed8",
      accentSoft: "#dbeafe",
      image: "/images/track-grc.png",
      imagePosition: "66% center",
      deskLabel: "Third-party evidence verifier",
      metric: "30",
      metricLabel: "machine-readable verdict cases",
      nodes: ["CLAIM", "EXPORT", "HASH", "GRAPH", "DECIDE"],
      feed: ["broken chain isolated", "data-flow edge reconciled", "commercial condition emitted"],
    },
    {
      key: "grc-audit-engine",
      kind: "audit",
      accent: "#a78bfa",
      accentStrong: "#6d28d9",
      accentSoft: "#ede9fe",
      image: "/images/track-grc.png",
      imagePosition: "35% center",
      deskLabel: "ISO evidence audit ledger",
      metric: "18",
      metricLabel: "deterministic audit tests",
      nodes: ["COLLECT", "HASH", "SAMPLE", "TEST", "VERDICT"],
      feed: ["sample IDs reproduced", "stale evidence rejected", "nonconformity register frozen"],
    },
    {
      key: "grc-hardening-risk",
      kind: "hardening",
      accent: "#f97316",
      accentStrong: "#c2410c",
      accentSoft: "#ffedd5",
      image: "/images/track-grc.png",
      imagePosition: "74% center",
      deskLabel: "Hardening and risk console",
      metric: "0Δ",
      metricLabel: "required on second Ansible run",
      nodes: ["BASE", "APPLY", "TEST", "ROLLBACK", "MODEL"],
      feed: ["service acceptance green", "scanner delta reconciled", "three treatments optimized"],
    },
    {
      key: "grc-breach-engine",
      kind: "breach",
      accent: "#fb7185",
      accentStrong: "#be123c",
      accentSoft: "#ffe4e6",
      image: "/images/track-grc.png",
      imagePosition: "54% center",
      deskLabel: "Breach deadline command",
      metric: "04",
      metricLabel: "separate statutory clocks",
      nodes: ["EVENT", "AWARE", "TRIGGER", "DEADLINE", "NOTICE"],
      feed: ["population overlap deduplicated", "WAT and UTC clocks computed", "work items generated"],
    },
  ],
};

// One controlled accent per specialist track. Project identity comes from the
// instrument, workflow, evidence model, and imagery rather than a new bright
// colour on every page.
const TRACK_PALETTES: Record<
  AdvancedTrack,
  Pick<AdvancedProjectVisual, "accent" | "accentStrong" | "accentSoft">
> = {
  SOC_ANALYSIS: {
    accent: "#0f766e",
    accentStrong: "#115e59",
    accentSoft: "#ccfbf1",
  },
  ETHICAL_HACKING: {
    accent: "#c2410c",
    accentStrong: "#9a3412",
    accentSoft: "#ffedd5",
  },
  GRC: {
    accent: "#1d4ed8",
    accentStrong: "#1e40af",
    accentSoft: "#dbeafe",
  },
};

export const ADVANCED_TRACK_VISUALS: Record<
  AdvancedTrack,
  { image: string; accent: string; eyebrow: string; summary: string }
> = {
  SOC_ANALYSIS: {
    image: "/images/track-soc.jpg",
    accent: "#14b8a6",
    eyebrow: "Detection and response engineering",
    summary: "Five systems. Increasing data volume, infrastructure responsibility, adversary pressure, and evidential burden.",
  },
  ETHICAL_HACKING: {
    image: "/images/track-ethical-hacking.jpg",
    accent: "#f97316",
    eyebrow: "Authorized offensive security",
    summary: "Five controlled engagements. Scope discipline, repeatable exploitation, clean-state proof, remediation, and live defense.",
  },
  GRC: {
    image: "/images/track-grc.png",
    accent: "#2563eb",
    eyebrow: "Technical governance, risk, and compliance",
    summary: "Five executable control systems. Every policy, audit verdict, risk decision, and legal clock must survive machine tests.",
  },
};

export function advancedProjectVisual(
  track: AdvancedTrack,
  projectNumber: number
): AdvancedProjectVisual {
  return {
    ...visuals[track][Math.max(0, Math.min(4, projectNumber - 1))],
    ...TRACK_PALETTES[track],
  };
}
