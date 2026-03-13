"use client";

import PlaygroundLayout from "@/components/playground/PlaygroundLayout";

interface PlaygroundPageProps {
  params: { sessionId: string };
}

export default function PlaygroundPage({ params }: PlaygroundPageProps) {
  return <PlaygroundLayout sessionId={params.sessionId} />;
}
