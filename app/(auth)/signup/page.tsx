import SignupForm from "@/components/auth/SignupForm";
import { HeroDitheringCard } from "@/components/ui/hero-dithering-card";

export default function SignupPage() {
  return (
    <main className="min-h-screen w-full flex">
      {/* Left Area - Branding / Visual */}
      <div className="hidden lg:flex flex-1 relative bg-black items-center justify-center p-8 border-r border-border shadow-[20px_0_40px_-15px_rgba(0,0,0,0.5)] z-10">
        <HeroDitheringCard
          title="Join Forge"
          description="Create an account to start building AI agents."
          colorFront="#3B82F6"
          minHeight="min-h-full"
          hideButton={true}
          className="w-full h-full max-w-none"
          titleClassName="font-comico text-7xl xl:text-8xl tracking-tight text-white mb-6 leading-[1.1]"
        />
      </div>

      {/* Right Area - Signup Form */}
      <div className="flex-1 flex flex-col items-center justify-center bg-white p-8 relative z-0">
        <SignupForm />
      </div>
    </main>
  );
}
