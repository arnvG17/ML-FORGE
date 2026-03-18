import { NextResponse } from 'next/server';
import { keyManager } from '../../../lib/llmKeyManager';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get('mode');

  if (mode === 'keys') {
    return NextResponse.json({
      totalKeys: keyManager.getTotalKeys(),
      availableKeys: keyManager.availableCount(),
      keyStatus: keyManager.status()
    });
  }

  // existing test mode if needed
  return NextResponse.json({ success: true, message: 'LLM test endpoint works' });
}
