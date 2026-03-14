import { SignIn } from "@clerk/nextjs";
import { HeroDitheringCard } from "@/components/ui/hero-dithering-card";

export default function SignInPage() {
  return (
    <main className="min-h-screen w-full flex bg-black">
      {/* Left Area - Branding / Visual */}
      <div className="hidden lg:flex flex-1 relative bg-black items-center justify-center p-4 py-6 border-r border-white/5 z-10">
        <HeroDitheringCard
          title="FORGE"
          description="Sign in to your workbench and continue building."
          colorFront="#8B5CF6"
          minHeight="h-[96vh]"
          hideButton={true}
          className="w-full h-full max-w-none shadow-2xl"
          titleClassName="font-comico text-7xl xl:text-8xl tracking-tight text-white mb-6 leading-[1.1]"
        />
      </div>

      {/* Right Area - Sign In Form */}
      <div className="flex-1 flex flex-col items-center justify-center bg-black p-8 relative z-0">
        <SignIn 
          routing="path" 
          path="/sign-in" 
          signUpUrl="/sign-up"
          fallbackRedirectUrl="/dashboard"
        />
      </div>
    </main>
  );
}
