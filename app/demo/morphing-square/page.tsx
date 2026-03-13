'use client';

import { MorphingSquare } from "@/components/ui/morphing-square";

export default function MorphingSquareDemo() {
  return (
    <div className="container mx-auto p-12 space-y-24 bg-surface text-white min-h-screen">
      <h1 className="text-4xl font-bebas tracking-widest text-center mb-12">Morphing Square Demo</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <section className="space-y-4">
          <h2 className="text-muted text-sm uppercase tracking-widest">Default (Bottom)</h2>
          <div className="p-12 bg-elevated rounded-lg border border-border flex items-center justify-center h-48">
            <MorphingSquare message='Loading...' />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-muted text-sm uppercase tracking-widest">Placement: Top</h2>
          <div className="p-12 bg-elevated rounded-lg border border-border flex items-center justify-center h-48">
            <MorphingSquare message='Uploading...' messagePlacement="top" />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-muted text-sm uppercase tracking-widest">Placement: Left</h2>
          <div className="p-12 bg-elevated rounded-lg border border-border flex items-center justify-center h-48">
            <MorphingSquare message='Processing' messagePlacement="left" />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-muted text-sm uppercase tracking-widest">Placement: Right</h2>
          <div className="p-12 bg-elevated rounded-lg border border-border flex items-center justify-center h-48">
            <MorphingSquare message='Deploying' messagePlacement="right" />
          </div>
        </section>
      </div>
    </div>
  );
}
