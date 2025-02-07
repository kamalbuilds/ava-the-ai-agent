import { NextResponse } from 'next/server';
import { AIService } from '../../../../server/src/services/ai';

export async function POST(req: Request) {
    console.log("   [+] Testing connection with AI provider");
  try {
    const settings = await req.json();
    
    const aiService = new AIService({
      provider: settings.aiProvider.provider,
      apiKey: settings.aiProvider.apiKey,
      enablePrivateCompute: settings.enablePrivateCompute
    });

    console.log('Testing connection with AI provider:', settings.aiProvider.provider);

    // Test the connection with a simple prompt
    const check = await aiService.generateCompletion("Hello, this is a test.");
    console.log('Connection test result:', check);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Connection test failed' },
      { status: 500 }
    );
  }
} 