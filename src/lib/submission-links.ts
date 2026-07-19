const ADVANCED_STAGES = new Set([
  "STAGE_5",
  "STAGE_6",
  "STAGE_7",
  "STAGE_8",
  "STAGE_9",
]);

export function isAdvancedSubmissionStage(stage: string): boolean {
  return ADVANCED_STAGES.has(stage);
}

export function submissionFolderUrlError(
  value: string,
  options: { googleDriveOnly?: boolean } = {}
): string | null {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    return "Paste a complete https:// folder link.";
  }

  if (url.protocol !== "https:") {
    return "The folder link must use https://.";
  }

  if (!options.googleDriveOnly) return null;

  if (url.hostname.toLowerCase() !== "drive.google.com") {
    return "Advanced projects require a Google Drive folder link.";
  }

  const isFolderPath = /^\/drive\/(?:u\/\d+\/)?folders\/[a-zA-Z0-9_-]+\/?$/.test(
    url.pathname
  );
  if (!isFolderPath) {
    return "Paste the Google Drive folder URL, not a Google Doc or an individual file URL.";
  }

  return null;
}
