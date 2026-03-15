import Link from "next/link";
import Hero from "@/components/landing/Hero";
import FeatureRow from "@/components/landing/FeatureRow";
import Footer from "@/components/landing/Footer";
import { Navbar } from "@/components/layout/Navbar";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />
      <Hero />
      <FeatureRow />
      <Footer />
    </main>
  );
}
