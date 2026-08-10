import type { AppRole } from "@/lib/database.types";

export type NavItem = {
  href: string;
  label: string;
  icon: IconName;
  /** Omit to show the item to every signed-in member. */
  roles?: AppRole[];
};

export type IconName =
  | "dashboard"
  | "approvals"
  | "members"
  | "cake"
  | "inventory"
  | "training"
  | "contributions"
  | "treasury"
  | "settings";

/**
 * Sections land here as each phase ships, so the sidebar never advertises a
 * page that does not exist yet.
 */
export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/members", label: "Members", icon: "members" },
  { href: "/birthdays", label: "Birthdays", icon: "cake" },
  { href: "/training", label: "Training", icon: "training" },
  {
    href: "/approvals",
    label: "Approvals",
    icon: "approvals",
    // The senior pastor sees the queue and cannot act on it.
    roles: ["admin", "senior_pastor"],
  },
];

export function navFor(role: AppRole) {
  return NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(role));
}
