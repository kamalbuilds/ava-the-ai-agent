import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { message } = body;

        // Call Eliza's API endpoint
        const response = await fetch(`http://localhost:3003/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: message,
                userId: "user",
                userName: "User"
            }),
        });

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error('Error in chat API:', error);
        return NextResponse.json(
            { error: 'Failed to process chat request' },
            { status: 500 }
        );
    }
} 