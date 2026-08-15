import { AlertCircle, RotateCw, X } from "lucide-react";

export type UploadTask = {
  id: string;
  file: File | Blob;
  name: string;
  previewUrl: string;
  percent: number;
  status: "uploading" | "error";
  error?: string;
};

type Props = {
  task: UploadTask;
  onRetry?: (id: string) => void;
  onDismiss?: (id: string) => void;
};

export function UploadProgressTile({ task, onRetry, onDismiss }: Props) {
  const failed = task.status === "error";
  return (
    <div className="relative aspect-square overflow-hidden rounded-lg border border-border bg-muted">
      <img src={task.previewUrl} alt="" className="h-full w-full object-cover opacity-60" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/70 p-2 text-center backdrop-blur-[2px]">
        {failed ? (
          <>
            <AlertCircle className="h-5 w-5 text-destructive" />
            <p className="line-clamp-2 text-[10px] text-muted-foreground">{task.error ?? "Upload failed"}</p>
            {onRetry && (
              <button
                type="button"
                onClick={() => onRetry(task.id)}
                className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-1 text-[11px] font-medium hover:bg-muted"
              >
                <RotateCw className="h-3 w-3" /> Retry
              </button>
            )}
          </>
        ) : (
          <>
            <span className="text-sm font-semibold tabular-nums">{task.percent}%</span>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-brand transition-[width] duration-200"
                style={{ width: `${task.percent}%` }}
              />
            </div>
            <p className="line-clamp-1 text-[10px] text-muted-foreground">{task.name}</p>
          </>
        )}
      </div>
      {onDismiss && (
        <button
          type="button"
          aria-label="Remove upload"
          onClick={() => onDismiss(task.id)}
          className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

/** Circular/inline progress overlay used for single profile photos. */
export function UploadProgressOverlay({ percent }: { percent: number }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 rounded-md bg-background/75 p-2 backdrop-blur-[2px]">
      <span className="text-xs font-semibold tabular-nums">{percent}%</span>
      <div className="h-1.5 w-4/5 overflow-hidden rounded-full bg-border">
        <div className="h-full rounded-full bg-brand transition-[width] duration-200" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
