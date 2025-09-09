import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { portfolio, verificationLevel, modelVersion } = body;

    // Validate input
    if (!portfolio || !portfolio.tokens || !portfolio.amounts) {
      return NextResponse.json(
        { error: 'Invalid portfolio data' },
        { status: 400 }
      );
    }

    // Call backend EigenCloud service
    const backendResponse = await fetch(
      `${process.env.BACKEND_URL}/eigencloud/analyze`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.BACKEND_API_KEY}`
        },
        body: JSON.stringify({
          portfolio,
          verificationLevel: verificationLevel || 'HIGH',
          modelVersion: modelVersion || 'portfolio_optimizer_v2',
          marketData: {
            timestamp: Date.now(),
            source: 'ava-platform'
          }
        })
      }
    );

    if (!backendResponse.ok) {
      throw new Error('Backend service error');
    }

    const result = await backendResponse.json();

    // Transform response for frontend
    return NextResponse.json({
      taskId: result.taskId,
      recommendation: {
        tokens: result.recommendation.tokens,
        allocations: result.recommendation.allocations,
        riskScore: result.recommendation.riskScore,
        strategy: result.recommendation.strategy,
        reasoning: result.recommendation.reasoning
      },
      proof: result.proof,
      validators: result.validators,
      confidence: result.confidence,
      computeTime: result.computeTime,
      modelHash: result.modelHash
    });

  } catch (error) {
    console.error('EigenCloud analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to process verifiable analysis' },
      { status: 500 }
    );
  }
}