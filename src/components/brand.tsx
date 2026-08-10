import Image from "next/image";

import { cn } from "@/lib/utils";

export const CHURCH_NAME = "Hope Nation Church";
export const DEPARTMENT_NAME = "Sound & Technical";

/**
 * The church mark. logo-dark.svg is the supplied logo with the black lettering
 * recoloured for a dark background; the crimson artwork is untouched.
 */
export function BrandLogo({
  className,
  width = 88,
  priority = false,
}: {
  className?: string;
  width?: number;
  priority?: boolean;
}) {
  return (
    <Image
      src="/assets/logo-dark.svg"
      alt={CHURCH_NAME}
      width={width}
      height={Math.round((width / 110) * 50)}
      priority={priority}
      unoptimized
      className={cn("shrink-0", className)}
    />
  );
}

export function Wordmark({
  className,
  size = "md",
  showDepartment = true,
  priority = false,
}: {
  className?: string;
  size?: "sm" | "md";
  showDepartment?: boolean;
  priority?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <BrandLogo width={size === "sm" ? 74 : 88} priority={priority} />
      {showDepartment ? (
        <>
          <span aria-hidden="true" className="h-7 w-px bg-line-strong" />
          <span className="text-[9.5px] font-medium uppercase leading-[1.45] tracking-[0.16em] text-muted">
            Sound &amp;
            <br />
            Technical
          </span>
        </>
      ) : null}
    </div>
  );
}
