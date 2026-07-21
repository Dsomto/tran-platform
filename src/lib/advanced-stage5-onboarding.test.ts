import assert from "node:assert/strict";
import test from "node:test";
import type { AdvancedTrack } from "./advanced-stage";
import { advancedStageFiveOnboarding } from "./advanced-stage5-onboarding";

const TRACKS: AdvancedTrack[] = ["SOC_ANALYSIS", "ETHICAL_HACKING", "GRC"];

test("every Stage 5 track has a complete guided start", () => {
  for (const track of TRACKS) {
    const guide = advancedStageFiveOnboarding(track);

    assert.ok(guide.oneSentence.length > 80, `${track} needs a plain-English explanation`);
    assert.equal(guide.jobParts.length, 4, `${track} needs four explicit job parts`);
    assert.ok(guide.notTheTask.length > 80, `${track} needs a clear non-goal`);
    assert.ok(guide.downloadItems.length >= 4, `${track} needs a complete download checklist`);
    assert.equal(guide.machinePaths.length, 3, `${track} needs macOS/Linux, Windows, and VM paths`);
    assert.equal(guide.startSteps.length, 4, `${track} needs four first-result steps`);
    assert.ok(guide.firstMilestone.length > 100, `${track} needs a concrete first milestone`);

    for (const machinePath of guide.machinePaths) {
      assert.ok(machinePath.summary.length > 50);
      assert.ok(machinePath.commandGroups.length >= 2);
      for (const commandGroup of machinePath.commandGroups) {
        assert.ok(commandGroup.commands.length >= 2, `${track} ${commandGroup.label} needs exact commands`);
        assert.ok(commandGroup.expected.length > 40, `${track} ${commandGroup.label} needs an expected result`);
      }
    }

    for (const startStep of guide.startSteps) {
      assert.ok(startStep.instruction.length > 80);
      assert.ok(startStep.commands.length >= 2);
      assert.ok(startStep.windowsCommands && startStep.windowsCommands.length >= 2);
      assert.ok(startStep.expected.length > 60);
    }
  }
});

test("the Ethical Hacking VM path keeps target and engine on one loopback host", () => {
  const guide = advancedStageFiveOnboarding("ETHICAL_HACKING");
  const vmPath = guide.machinePaths.find((path) => path.title.includes("VM"));

  assert.ok(vmPath?.important?.includes("same VM"));
  assert.ok(vmPath?.important?.includes("127.0.0.1"));
  assert.match(guide.notTheTask, /not permission to scan the internet/i);
});
