import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { proof } = body;

    if (!proof) {
      return NextResponse.json(
        { error: 'Proof is required' },
        { status: 400 }
      );
    }

    // Call backend verification service
    const backendResponse = await fetch(
      `${process.env.BACKEND_URL}/eigencloud/verify`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.BACKEND_API_KEY}`
        },
        body: JSON.stringify({ proof })
      }
    );

    if (!backendResponse.ok) {
      throw new Error('Verification service error');
    }

    const result = await backendResponse.json();

    return NextResponse.json({
      valid: result.valid,
      details: result.details
    });

  } catch (error) {
    console.error('Proof verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify proof' },
      { status: 500 }
    );
  }
}