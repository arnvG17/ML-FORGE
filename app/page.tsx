import Link from "next/link";
import Hero from "@/components/landing/Hero";
import FeatureRow from "@/components/landing/FeatureRow";
import Footer from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-black">
      <Hero />
      <FeatureRow />
      <Footer />
    </main>
  );
}
