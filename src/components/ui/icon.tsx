import type { IconName } from "@/lib/nav";
import { cn } from "@/lib/utils";

const PATHS: Record<IconName, string> = {
  dashboard: "M4 13h6V4H4v9Zm10 7h6v-9h-6v9ZM4 20h6v-4H4v4Zm10-11h6V4h-6v5Z",
  approvals: "M10 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm-6.5 7.5c0-3 3-4.8 6.5-4.8M14.5 18l2 2 4.5-4.5",
  members:
    "M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2 19c0-2.8 2.7-4.5 6-4.5s6 1.7 6 4.5M15 14.6c2.6.3 4.8 1.9 4.8 4.4",
  cake: "M12 5V3m0 2a2 2 0 0 0-2 2v1h4V7a2 2 0 0 0-2-2ZM5 12h14v7H5v-7Zm0 0a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2",
  inventory: "M4 8l8-4 8 4v8l-8 4-8-4V8Zm0 0 8 4 8-4M12 12v8",
  training: "M4 6h16v11H4V6Zm5 15h6M12 17v4",
  contributions: "M12 3v18M8 7h6a3 3 0 0 1 0 6H8m0 0h7a3 3 0 0 1 0 6H8",
  treasury: "M4 9h16v10H4V9Zm2-4h12l2 4H4l2-4Zm6 7v4",
  settings:
    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.4-3a7.4 7.4 0 0 0-.1-1.1l2-1.5-2-3.4-2.3.9a7.5 7.5 0 0 0-1.9-1.1L14.7 3H9.3l-.4 2.4a7.5 7.5 0 0 0-1.9 1.1l-2.3-.9-2 3.4 2 1.5a7.4 7.4 0 0 0 0 2.2l-2 1.5 2 3.4 2.3-.9a7.5 7.5 0 0 0 1.9 1.1l.4 2.4h5.4l.4-2.4a7.5 7.5 0 0 0 1.9-1.1l2.3.9 2-3.4-2-1.5c.06-.36.1-.73.1-1.1Z",
};

export function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn("size-[18px] shrink-0", className)}
    >
      <path
        d={PATHS[name]}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
