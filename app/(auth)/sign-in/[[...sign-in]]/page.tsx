import { redirect } from "next/navigation";

// Old Clerk sign-in page — redirect to Firebase login
export default function SignInPage() {
  redirect("/login");
}
