import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Laptop,
  ListChecks,
  TerminalSquare,
} from "lucide-react";
import type { AdvancedTrack } from "@/lib/advanced-stage";
import { advancedStageFiveOnboarding } from "@/lib/advanced-stage5-onboarding";

type Props = {
  track: AdvancedTrack;
  trackLabel: string;
};

function Commands({ commands }: { commands: string[] }) {
  return (
    <div className="advanced-stage5-guide__commands">
      {commands.map((command, index) => (
        <div key={`${index}-${command}`}>
          <span aria-hidden="true">$</span>
          <code>{command}</code>
        </div>
      ))}
    </div>
  );
}

export function AdvancedStageFiveOnboarding({ track, trackLabel }: Props) {
  const guide = advancedStageFiveOnboarding(track);

  return (
    <section
      className="advanced-stage5-guide"
      id="stage-five-start"
      aria-labelledby="stage-five-start-title"
    >
      <header className="advanced-stage5-guide__header">
        <div className="advanced-stage5-guide__header-icon"><ListChecks aria-hidden="true" /></div>
        <div>
          <div className="advanced-eyebrow">Stage 5 guided start / {trackLabel}</div>
          <h2 id="stage-five-start-title">Start here: from download to first working result</h2>
          <p>This is the eased-in route through your first advanced project. Follow it in order, then continue into the full Monday-to-Friday build plan.</p>
        </div>
      </header>

      <div className="advanced-stage5-guide__plain">
        <span>In one sentence</span>
        <p>{guide.oneSentence}</p>
        <div className="advanced-stage5-guide__job-parts">
          {guide.jobParts.map((part, index) => (
            <div key={part}>
              <strong>{String(index + 1).padStart(2, "0")}</strong>
              <p>{part}</p>
            </div>
          ))}
        </div>
        <aside>
          <AlertTriangle aria-hidden="true" />
          <p><strong>What this is not:</strong> {guide.notTheTask}</p>
        </aside>
      </div>

      <div className="advanced-stage5-guide__downloads">
        <div>
          <Download aria-hidden="true" />
          <div>
            <div className="advanced-eyebrow">Before opening a terminal</div>
            <h3>Download every item in this checklist</h3>
          </div>
        </div>
        <ul>{guide.downloadItems.map((item) => <li key={item}>{item}</li>)}</ul>
        <a href="#downloads-title">Go to briefs and artifacts</a>
      </div>

      <div className="advanced-stage5-guide__machines">
        <header>
          <div className="advanced-eyebrow">Choose one setup path</div>
          <h3>Where are you doing the work?</h3>
          <p>Use one path only. Replace values inside <code>&lt;...&gt;</code> with the value shown in your private room or overlay.</p>
        </header>

        <div className="advanced-stage5-guide__machine-list">
          {guide.machinePaths.map((path, pathIndex) => (
            <details key={path.title} open={pathIndex === 0}>
              <summary>
                <span className="advanced-stage5-guide__machine-icon"><Laptop aria-hidden="true" /></span>
                <span><strong>{path.title}</strong><small>{path.summary}</small></span>
                <em>{path.badge}</em>
              </summary>
              <div className="advanced-stage5-guide__machine-body">
                {path.important && (
                  <div className="advanced-stage5-guide__important">
                    <AlertTriangle aria-hidden="true" />
                    <p>{path.important}</p>
                  </div>
                )}
                {path.commandGroups.map((group) => (
                  <section key={group.label} aria-label={group.label}>
                    <h4><TerminalSquare aria-hidden="true" /> {group.label}</h4>
                    <Commands commands={group.commands} />
                    <div className="advanced-stage5-guide__expected">
                      <CheckCircle2 aria-hidden="true" />
                      <p><strong>Expected:</strong> {group.expected}</p>
                    </div>
                  </section>
                ))}
              </div>
            </details>
          ))}
        </div>
      </div>

      <div className="advanced-stage5-guide__first-result">
        <header>
          <div className="advanced-eyebrow">After your machine is ready</div>
          <h3>Build the first working result</h3>
          <p>Complete these steps in order. The expected result tells you whether to continue or fix the current step first.</p>
        </header>
        <ol>
          {guide.startSteps.map((startStep, index) => (
            <li key={startStep.title}>
              <div className="advanced-stage5-guide__step-number">{String(index + 1).padStart(2, "0")}</div>
              <div className="advanced-stage5-guide__step-body">
                <h4>{startStep.title}</h4>
                <p>{startStep.instruction}</p>
                {startStep.windowsCommands && <h5>macOS, Linux, or Ubuntu VM</h5>}
                <Commands commands={startStep.commands} />
                {startStep.windowsCommands && (
                  <>
                    <h5>Windows PowerShell</h5>
                    <Commands commands={startStep.windowsCommands} />
                  </>
                )}
                <div className="advanced-stage5-guide__expected">
                  <CheckCircle2 aria-hidden="true" />
                  <p><strong>Expected:</strong> {startStep.expected}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="advanced-stage5-guide__milestone">
        <CheckCircle2 aria-hidden="true" />
        <div>
          <strong>Your first milestone</strong>
          <p>{guide.firstMilestone}</p>
        </div>
      </div>
    </section>
  );
}
