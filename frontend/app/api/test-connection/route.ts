import { NextResponse } from 'next/server';
import { AIService } from '@/services/ai';

export async function POST(req: Request) {
  try {
    const settings = await req.json();
    
    const aiService = new AIService({
      provider: settings.aiProvider.provider,
      apiKey: settings.aiProvider.apiKey,
      enablePrivateCompute: settings.enablePrivateCompute
    });

    // Test the connection with a simple prompt
    await aiService.generateCompletion("Hello, this is a test.");

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Connection test failed' },
      { status: 500 }
    );
  }
} 