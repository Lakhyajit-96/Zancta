export type WorkerStatus = "idle" | "validating" | "loading" | "processing" | "completed" | "failed" | "aborted";

export type WorkerErrorCode =
  | "VALIDATION_FAILED"
  | "TIMEOUT"
  | "ABORTED"
  | "WORKER_CRASH"
  | "UNSUPPORTED"
  | "OOM"
  | "CORRUPT";

export interface WorkerRequest {
  id: string;
  op: string;
  files: File[];
  options?: Record<string, unknown>;
}

export interface WorkerProgress {
  id: string;
  status: WorkerStatus;
  progress: number;
  fileIndex?: number;
  fileNameRedacted?: string;
}

export interface WorkerSuccess {
  id: string;
  status: "completed";
  progress: 100;
  blobs: { name: string; blob: Blob; size: number }[];
}

export interface WorkerFailure {
  id: string;
  status: "failed" | "aborted";
  errorCode: WorkerErrorCode;
  message: string;
}

export function redactFilename(name: string, index: number): string {
  const ext = name.split(".").pop() || "bin";
  return `file_${index + 1}.${ext}`;
}
