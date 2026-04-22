"use client";

import dynamic from "next/dynamic";
import type { WidgetKind, WidgetProps } from "./types";

// Each widget is loaded lazily so a task page only ships the code it needs.
const WebTerminal = dynamic(() => import("./WebTerminal"), { ssr: false });
const CipherTools = dynamic(() => import("./CipherTools"), { ssr: false });
const StegoViewer = dynamic(() => import("./StegoViewer"), { ssr: false });
const LogViewer = dynamic(() => import("./LogViewer"), { ssr: false });
const VulnAppSim = dynamic(() => import("./VulnAppSim"), { ssr: false });
const PortScanner = dynamic(() => import("./PortScanner"), { ssr: false });
const FileDownload = dynamic(() => import("./FileDownload"), { ssr: false });
const DiagramUpload = dynamic(() => import("./DiagramUpload"), { ssr: false });
const McqQuiz = dynamic(() => import("./McqQuiz"), { ssr: false });
const WriteupPad = dynamic(() => import("./WriteupPad"), { ssr: false });
const NoneWidget = dynamic(() => import("./NoneWidget"), { ssr: false });

export type TaskWidgetProps = WidgetProps & { kind: WidgetKind };

export default function TaskWidget(props: TaskWidgetProps) {
  const { kind, ...rest } = props;
  switch (kind) {
    case "WEB_TERMINAL":
      return <WebTerminal {...rest} />;
    case "CIPHER_TOOLS":
      return <CipherTools {...rest} />;
    case "STEGO_VIEWER":
      return <StegoViewer {...rest} />;
    case "LOG_VIEWER":
      return <LogViewer {...rest} />;
    case "VULN_APP_SIM":
      return <VulnAppSim {...rest} />;
    case "PORT_SCANNER":
      return <PortScanner {...rest} />;
    case "FILE_DOWNLOAD":
      return <FileDownload {...rest} />;
    case "DIAGRAM_UPLOAD":
      return <DiagramUpload {...rest} />;
    case "MCQ_QUIZ":
      return <McqQuiz {...rest} />;
    case "WRITEUP_PAD":
      return <WriteupPad {...rest} />;
    case "NONE":
    default:
      return <NoneWidget {...rest} />;
  }
}
