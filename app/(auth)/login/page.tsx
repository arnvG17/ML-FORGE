import LoginForm from "@/components/auth/LoginForm";
import { HeroDitheringCard } from "@/components/ui/hero-dithering-card";

export default function LoginPage() {
  return (
    <main className="min-h-screen w-full flex">
      {/* Left Area - Branding / Visual */}
      <div className="hidden lg:flex flex-1 relative bg-black items-center justify-center p-4 py-6 border-r border-white/5 z-10">
        <HeroDitheringCard
          title="Welcome"

          colorFront="#3B82F6"
          minHeight="h-[96vh]"
          hideButton={true}
          className="w-full h-full max-w-none"
          titleClassName="font-comico text-7xl xl:text-8xl tracking-tight text-white mb-6 leading-[1.1]"
        />
      </div>

      {/* Right Area - Login Form */}
      <div className="flex-1 flex flex-col items-center justify-center bg-black p-8 relative z-0">
        <LoginForm />
      </div>
    </main>
  );
}
