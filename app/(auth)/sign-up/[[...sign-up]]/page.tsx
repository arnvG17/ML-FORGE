import { redirect } from "next/navigation";

// Old Clerk sign-up page — redirect to Firebase login
export default function SignUpPage() {
  redirect("/login");
}
