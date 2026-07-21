import assert from "node:assert/strict";
import test from "node:test";
import { ADVANCED_PROJECTS } from "./advanced-stage";
import { advancedProjectWorkflow } from "./advanced-workflow";

test("every advanced project has a concrete first-hour and six-phase workflow", () => {
  let workflowCount = 0;

  for (const [track, projects] of Object.entries(ADVANCED_PROJECTS)) {
    for (const project of projects) {
      const workflow = advancedProjectWorkflow(track as keyof typeof ADVANCED_PROJECTS, project);
      workflowCount += 1;

      assert.ok(workflow.intro.length > 40, `${track} project ${project.number} needs a useful introduction`);
      assert.ok(workflow.firstHour.actions.length >= 4, `${track} project ${project.number} needs four startup actions`);
      assert.ok(workflow.firstHour.commands.length >= 3, `${track} project ${project.number} needs starter commands`);
      assert.ok(workflow.firstHour.readyWhen.length > 30, `${track} project ${project.number} needs a readiness gate`);
      assert.equal(workflow.steps.length, 6, `${track} project ${project.number} needs six work phases`);

      for (const workflowStep of workflow.steps) {
        assert.ok(workflowStep.when.length > 0);
        assert.ok(workflowStep.title.length > 0);
        assert.ok(workflowStep.actions.length >= 2, `${track} ${workflowStep.title} needs at least two actions`);
        assert.ok(workflowStep.checkpoint.length > 30, `${track} ${workflowStep.title} needs a concrete checkpoint`);
      }
    }
  }

  assert.equal(workflowCount, 15);
});

test("each track receives different project guidance", () => {
  for (let projectIndex = 0; projectIndex < 5; projectIndex += 1) {
    const soc = advancedProjectWorkflow("SOC_ANALYSIS", ADVANCED_PROJECTS.SOC_ANALYSIS[projectIndex]);
    const ethicalHacking = advancedProjectWorkflow("ETHICAL_HACKING", ADVANCED_PROJECTS.ETHICAL_HACKING[projectIndex]);
    const grc = advancedProjectWorkflow("GRC", ADVANCED_PROJECTS.GRC[projectIndex]);

    assert.notEqual(soc.firstHour.actions[0], ethicalHacking.firstHour.actions[0]);
    assert.notEqual(soc.firstHour.actions[0], grc.firstHour.actions[0]);
    assert.notEqual(ethicalHacking.firstHour.actions[0], grc.firstHour.actions[0]);
  }
});
