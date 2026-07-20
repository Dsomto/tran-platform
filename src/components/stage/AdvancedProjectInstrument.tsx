import {
  BadgeCheck,
  Binary,
  Braces,
  Bug,
  ClipboardCheck,
  CloudCog,
  Crosshair,
  FileSearch,
  Network,
  Radar,
  RadioTower,
  Scale,
  ScanSearch,
  ServerCog,
  Workflow,
} from "lucide-react";
import type { ComponentType } from "react";
import type { AdvancedProjectVisual, AdvancedVisualKind } from "@/lib/advanced-visuals";

const ICONS: Record<AdvancedVisualKind, ComponentType<{ "aria-hidden"?: boolean }>> = {
  telemetry: Radar,
  sensor: RadioTower,
  topology: Network,
  detection: ScanSearch,
  forensics: FileSearch,
  recon: Crosshair,
  exploit: Binary,
  cloud: CloudCog,
  directory: Workflow,
  vapt: Bug,
  policy: Braces,
  vendor: BadgeCheck,
  audit: ClipboardCheck,
  hardening: ServerCog,
  breach: Scale,
};

export function AdvancedProjectInstrument({ visual }: { visual: AdvancedProjectVisual }) {
  const Icon = ICONS[visual.kind];

  return (
    <section
      className={`advanced-instrument advanced-instrument--${visual.kind}`}
      aria-label={visual.deskLabel}
    >
      <div className="advanced-instrument__head">
        <div>
          <span className="advanced-instrument__status" aria-hidden="true" />
          <span>{visual.deskLabel}</span>
          <em className="advanced-instrument__tag">Preview only &middot; not interactive</em>
        </div>
        <Icon aria-hidden={true} />
      </div>

      <div className="advanced-instrument__body">
        <div className="advanced-instrument__metric">
          <strong>{visual.metric}</strong>
          <span>{visual.metricLabel}</span>
        </div>

        <div className="advanced-instrument__path" aria-label="Project workflow">
          {visual.nodes.map((node, index) => (
            <div key={node} className={index === visual.nodes.length - 1 ? "is-terminal" : ""}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{node}</strong>
            </div>
          ))}
        </div>

        <div className="advanced-instrument__feed" aria-label="Readiness checks">
          {visual.feed.map((item, index) => (
            <p key={item}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              {item}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
