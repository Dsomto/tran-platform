import {
  CheckCircle2,
  Clock3,
  ListStart,
  TerminalSquare,
} from "lucide-react";
import type { AdvancedProject, AdvancedTrack } from "@/lib/advanced-stage";
import { advancedProjectWorkflow } from "@/lib/advanced-workflow";

type Props = {
  project: AdvancedProject;
  track: AdvancedTrack;
  trackLabel: string;
  showFirstHour?: boolean;
};

export function AdvancedProjectWorkflow({
  project,
  track,
  trackLabel,
  showFirstHour = true,
}: Props) {
  const workflow = advancedProjectWorkflow(track, project);

  return (
    <section
      className="advanced-workflow"
      id="project-approach"
      aria-labelledby="project-approach-title"
    >
      <header className="advanced-workflow__header">
        <div className="advanced-workflow__icon"><ListStart aria-hidden="true" /></div>
        <div>
          <div className="advanced-eyebrow">{trackLabel} / Stage {project.number + 4}</div>
          <h2 id="project-approach-title">How to approach this project</h2>
          <p>{workflow.intro}</p>
        </div>
      </header>

      {showFirstHour && (
        <div className="advanced-workflow__first-hour">
          <div className="advanced-workflow__first-hour-copy">
            <span><Clock3 aria-hidden="true" /> First 60 minutes</span>
            <h3>Do this first, in this order</h3>
            <ol>
              {workflow.firstHour.actions.map((action) => <li key={action}>{action}</li>)}
            </ol>
          </div>

          <div className="advanced-workflow__terminal" aria-label="Starter commands">
            <div className="advanced-workflow__terminal-title">
              <TerminalSquare aria-hidden="true" />
              <span>Starter commands</span>
            </div>
            <p>Run these from your project workspace. Replace values inside <code>&lt;...&gt;</code> with the issued filename, marker, or command.</p>
            <div className="advanced-workflow__commands">
              {workflow.firstHour.commands.map((command, index) => (
                <div key={`${index}-${command}`}>
                  <span aria-hidden="true">$</span>
                  <code>{command}</code>
                </div>
              ))}
            </div>
          </div>

          <div className="advanced-workflow__gate">
            <CheckCircle2 aria-hidden="true" />
            <div>
              <strong>Do not continue until</strong>
              <p>{workflow.firstHour.readyWhen}</p>
            </div>
          </div>
        </div>
      )}

      <div className="advanced-workflow__phase-heading">
        <div>
          <div className="advanced-eyebrow">Build sequence</div>
          <h3>Follow these six phases</h3>
        </div>
        <span>Monday 09:00 to Friday 18:10 WAT</span>
      </div>

      <ol className="advanced-workflow__steps">
        {workflow.steps.map((workflowStep, index) => (
          <li key={`${workflowStep.when}-${workflowStep.title}`}>
            <div className="advanced-workflow__step-number">{String(index + 1).padStart(2, "0")}</div>
            <div className="advanced-workflow__step-body">
              <span className="advanced-workflow__when">{workflowStep.when}</span>
              <h4>{workflowStep.title}</h4>
              <ul>{workflowStep.actions.map((action) => <li key={action}>{action}</li>)}</ul>
              <div className="advanced-workflow__checkpoint">
                <CheckCircle2 aria-hidden="true" />
                <p><strong>Checkpoint:</strong> {workflowStep.checkpoint}</p>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
