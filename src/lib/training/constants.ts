/** Mirrors the ceiling set on the training storage bucket in 0006. */
export const MAX_FILE_BYTES = 10 * 1024 * 1024;

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
] as const;

/** For the file input's accept attribute. */
export const ACCEPT_ATTRIBUTE =
  ".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt";

export function formatBytes(bytes: number | null) {
  if (!bytes || bytes < 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const KIND_LABELS: Record<string, string> = {
  pdf: "PDF",
  png: "Image",
  jpeg: "Image",
  jpg: "Image",
  webp: "Image",
  plain: "Text",
};

export function fileTypeLabel(mimeType: string | null) {
  if (!mimeType) return "File";
  const tail = mimeType.split("/").pop() ?? "";
  if (KIND_LABELS[tail]) return KIND_LABELS[tail];
  if (tail.includes("word")) return "Word";
  if (tail.includes("sheet") || tail.includes("excel")) return "Spreadsheet";
  if (tail.includes("presentation") || tail.includes("powerpoint")) return "Slides";
  return "File";
}
