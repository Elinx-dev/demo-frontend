import { FileText } from "lucide-react";

interface DocumentPreviewProps {
  dataUrl: string;
  fileName: string;
  height?: number;
}

export default function DocumentPreview({ dataUrl, fileName, height = 220 }: DocumentPreviewProps) {
  if (dataUrl.startsWith("data:image")) {
    return (
      <img
        src={dataUrl}
        alt={fileName}
        style={{ width: "100%", height, objectFit: "contain", borderRadius: 8, border: "1px solid #eceef0", background: "#fafbfc" }}
      />
    );
  }

  if (dataUrl.startsWith("data:application/pdf")) {
    return (
      <iframe
        src={dataUrl}
        title={fileName}
        style={{ width: "100%", height, borderRadius: 8, border: "1px solid #eceef0" }}
      />
    );
  }

  return (
    <div
      className="flex flex-col items-center justify-center gap-2"
      style={{ width: "100%", height, borderRadius: 8, border: "1px solid #eceef0", background: "#fafbfc", color: "#9aa1a9" }}
    >
      <FileText size={32} />
      <div style={{ fontSize: 11.5 }}>Preview isn't available for this file type.</div>
    </div>
  );
}
