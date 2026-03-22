import PricingSection from "@/components/landing/PricingSection";
import { Navbar } from "@/components/layout/Navbar";
import Footer from "@/components/landing/Footer";
import { Suspense } from "react";

function PricingContent({ searchParams }: { searchParams: { redirect?: string } }) {
  const redirectUrl = searchParams.redirect || "/dashboard";

  return (
    <main className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center py-12">
        <PricingSection redirectUrl={redirectUrl} />
      </div>
      <Footer />
    </main>
  );
}

export default function PricingPage({ searchParams }: { searchParams: { redirect?: string } }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <PricingContent searchParams={searchParams} />
    </Suspense>
  );
}
