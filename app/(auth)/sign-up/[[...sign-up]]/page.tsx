import { SignUp } from "@clerk/nextjs";
import { HeroDitheringCard } from "@/components/ui/hero-dithering-card";

export default function SignUpPage() {
  return (
    <main className="min-h-screen w-full flex bg-black">
      {/* Left Area - Branding / Visual */}
      <div className="hidden lg:flex flex-1 relative bg-black items-center justify-center p-4 py-6 border-r border-white/5 z-10">
        <HeroDitheringCard
          title="FORGE"
          description="Create your account and start crafting with code."
          colorFront="#10B981"
          minHeight="h-[96vh]"
          hideButton={true}
          className="w-full h-full max-w-none shadow-2xl"
          titleClassName="font-comico text-7xl xl:text-8xl tracking-tight text-white mb-6 leading-[1.1]"
        />
      </div>

      {/* Right Area - Sign Up Form */}
      <div className="flex-1 flex flex-col items-center justify-center bg-black p-8 relative z-0">
        <SignUp 
          routing="path" 
          path="/sign-up" 
          signInUrl="/sign-in"
          fallbackRedirectUrl="/dashboard"
        />
      </div>
    </main>
  );
}
