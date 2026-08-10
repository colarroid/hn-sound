import { redirect } from "next/navigation";

/** There is no public landing page. The middleware decides where people go. */
export default function RootPage() {
  redirect("/dashboard");
}
