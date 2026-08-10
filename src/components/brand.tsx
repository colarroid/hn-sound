import Image from "next/image";

import { CHURCH_NAME, DEPARTMENT_NAME } from "@/lib/brand";
import { cn } from "@/lib/utils";

export { CHURCH_NAME, DEPARTMENT_NAME };

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
      // The file's intrinsic box is 110x55. Deriving height from the clip path's
      // 50 instead made next/image warn that the ratio had been altered.
      height={Math.round((width / 110) * 55)}
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
