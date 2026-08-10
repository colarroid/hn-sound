import Link from "next/link";

import { Card } from "@/components/ui/card";
import type { TrainingMaterialRow } from "@/lib/database.types";
import { fileTypeLabel, formatBytes } from "@/lib/training/constants";
import { cn } from "@/lib/utils";

function KindBadge({ material }: { material: TrainingMaterialRow }) {
  const label =
    material.kind === "link" ? "Link" : fileTypeLabel(material.mime_type);
  const size = material.kind === "file" ? formatBytes(material.file_size) : "";

  return (
    <span className="inline-flex items-center gap-1.5 border border-line bg-surface-2 px-2 py-[3px] text-[10px] font-medium uppercase tracking-[0.11em] text-muted">
      {label}
      {size ? <span className="text-muted/70">{size}</span> : null}
    </span>
  );
}

export function MaterialCard({
  material,
  href,
  actionLabel,
  meta,
  className,
}: {
  material: TrainingMaterialRow;
  href: string;
  actionLabel: string;
  meta?: string;
  className?: string;
}) {
  const external = material.kind === "link";

  return (
    <Card className={cn("flex flex-col p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-medium leading-snug text-ink">{material.title}</h3>
        <KindBadge material={material} />
      </div>

      {material.summary ? (
        <p className="mt-2.5 text-[13px] leading-relaxed text-muted">
          {material.summary}
        </p>
      ) : null}

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-4">
        {meta ? <span className="text-[11px] text-muted">{meta}</span> : <span />}
        <Link
          href={href}
          {...(external
            ? { target: "_blank", rel: "noopener noreferrer" }
            : {})}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-accent-text transition-colors duration-200 hover:text-ink"
        >
          {actionLabel}
          <svg viewBox="0 0 24 24" fill="none" className="size-3.5" aria-hidden="true">
            <path
              d={
                external
                  ? "M14 5h5v5M19 5l-8 8M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4"
                  : "M12 4v11m0 0 4-4m-4 4-4-4M5 19h14"
              }
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
      </div>
    </Card>
  );
}
