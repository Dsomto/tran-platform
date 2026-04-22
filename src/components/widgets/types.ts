export type WidgetKind =
  | "NONE"
  | "WEB_TERMINAL"
  | "CIPHER_TOOLS"
  | "STEGO_VIEWER"
  | "LOG_VIEWER"
  | "VULN_APP_SIM"
  | "PORT_SCANNER"
  | "FILE_DOWNLOAD"
  | "DIAGRAM_UPLOAD"
  | "MCQ_QUIZ"
  | "WRITEUP_PAD";

export type TaskContext = {
  internId: string;           // database Intern.id — used for per-intern HMAC
  internCode: string;         // UBI-YYYY-NNNN — used for display
  flagSalt?: string | null;   // per-task salt
  stage: "stage-0" | "stage-1" | "stage-2" | "stage-3" | "stage-4";
  accentColor?: string;       // hex — overrides the room theme
};

export type WidgetProps = {
  config: Record<string, unknown> | null;
  context: TaskContext;
  onAnswerChange?: (answer: Record<string, unknown>) => void;
};
