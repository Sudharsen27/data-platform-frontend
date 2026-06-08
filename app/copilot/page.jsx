import { redirect } from "next/navigation";

/** AI Copilot is now a global assistant — legacy route redirects to dashboard. */
export default function CopilotRedirectPage() {
  redirect("/dashboard");
}
