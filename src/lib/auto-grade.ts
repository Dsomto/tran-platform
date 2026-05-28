import { computeFlag, flagsEqual } from "./flag";

export type AutoGradeResult = {
  score: number;
  status: "GRADED" | "SUBMITTED" | "LATE";
  feedback: string | null;
  autoGraded: boolean;
};

type AssignmentLike = {
  maxPoints: number;
  kind?: string | null;
  widget?: string | null;
  flagSalt?: string | null;
  choices?: unknown;
  correctIndex?: number | null;
  minWords?: number | null;
  dueDate?: Date | null;
};

/**
 * Given an assignment + the intern's answer payload, compute the score and
 * grading status *where possible*. For FLAG and MULTIPLE_CHOICE tasks we grade
 * instantly; for WRITEUP/UPLOAD we fall back to SUBMITTED (or LATE) for admin
 * grading downstream.
 *
 * The `answer` shape depends on the kind:
 *   - FLAG             → { flag: string }           (intern-typed flag)
 *   - MULTIPLE_CHOICE  → { choiceIndex: number }
 *   - WRITEUP          → { text: string }
 *   - UPLOAD           → { url: string, text?: string }
 */
export function autoGradeSubmission(
  assignment: AssignmentLike,
  answer: Record<string, unknown>,
  internId: string
): AutoGradeResult {
  const lateStatus: "SUBMITTED" | "LATE" =
    assignment.dueDate && new Date() > assignment.dueDate ? "LATE" : "SUBMITTED";

  switch (assignment.kind) {
    case "FLAG": {
      const submitted = typeof answer.flag === "string" ? answer.flag : "";
      if (!assignment.flagSalt) {
        return { score: 0, status: lateStatus, feedback: null, autoGraded: false };
      }
      const expected = computeFlag(assignment.flagSalt, internId);
      const correct = flagsEqual(submitted, expected);
      return {
        score: correct ? assignment.maxPoints : 0,
        status: "GRADED",
        feedback: correct ? "Correct flag. Nicely done." : "Flag does not match. Review the widget and try again.",
        autoGraded: true,
      };
    }
    case "MULTIPLE_CHOICE": {
      if (assignment.correctIndex == null) {
        return { score: 0, status: lateStatus, feedback: null, autoGraded: false };
      }
      // Shuffle-safe grading: prefer the submitted label and compare it to the
      // canonical choice at the assignment's correctIndex. The client may have
      // shuffled the displayed order, so the index alone is unreliable; the
      // label is the durable identity. Fall back to index for legacy clients
      // that don't send a label.
      const submittedLabel =
        typeof answer.choiceLabel === "string" ? answer.choiceLabel : null;
      const choicesArray = Array.isArray(assignment.choices)
        ? (assignment.choices as unknown[])
        : null;
      let correct = false;
      if (
        submittedLabel !== null &&
        choicesArray !== null &&
        assignment.correctIndex >= 0 &&
        assignment.correctIndex < choicesArray.length &&
        typeof choicesArray[assignment.correctIndex] === "string"
      ) {
        correct = submittedLabel === choicesArray[assignment.correctIndex];
      } else {
        const idx = typeof answer.choiceIndex === "number" ? answer.choiceIndex : -1;
        correct = idx === assignment.correctIndex;
      }
      return {
        score: correct ? assignment.maxPoints : 0,
        status: "GRADED",
        feedback: correct ? "Correct answer." : "Not quite. Revisit the briefing and try again.",
        autoGraded: true,
      };
    }
    case "WRITEUP": {
      const text = typeof answer.text === "string" ? answer.text : "";
      const words = text.trim().split(/\s+/).filter(Boolean).length;
      if (assignment.minWords && words < assignment.minWords) {
        return {
          score: 0,
          status: lateStatus,
          feedback: `Writeup is below the ${assignment.minWords}-word minimum (submitted ${words}).`,
          autoGraded: false,
        };
      }
      return { score: 0, status: lateStatus, feedback: null, autoGraded: false };
    }
    case "UPLOAD":
    default: {
      return { score: 0, status: lateStatus, feedback: null, autoGraded: false };
    }
  }
}

/**
 * Extract the text content that should be stored on Submission.content for a
 * given answer payload. Keeps the submission row human-readable regardless of
 * the task kind (flag string, choice label, writeup body, etc.).
 */
export function contentFromAnswer(kind: string | null | undefined, answer: Record<string, unknown>): string {
  switch (kind) {
    case "FLAG":
      return typeof answer.flag === "string" ? answer.flag : "";
    case "MULTIPLE_CHOICE":
      return typeof answer.choiceIndex === "number" ? String(answer.choiceIndex) : "";
    case "WRITEUP":
      return typeof answer.text === "string" ? answer.text : "";
    case "UPLOAD":
      return typeof answer.text === "string"
        ? answer.text
        : typeof answer.url === "string"
          ? answer.url
          : "";
    default:
      return typeof answer.text === "string" ? answer.text : "";
  }
}
