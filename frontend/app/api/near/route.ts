import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    switch (action) {
      case 'balance':
        return NextResponse.json({ 
          balance: '100.0',
          currency: 'NEAR',
          address: 'example.near'
        });
      
      case 'status':
        return NextResponse.json({ 
          connected: true,
          network: 'testnet',
          blockHeight: 123456789
        });
        
      default:
        return NextResponse.json({ 
          message: 'NEAR Protocol API endpoint',
          availableActions: ['balance', 'status']
        });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;
    
    switch (action) {
      case 'generateAddress':
        return NextResponse.json({
          success: true,
          address: 'example.near',
          derivationPath: params.path || 'near-1'
        });
        
      case 'buildTransaction':
        return NextResponse.json({
          success: true,
          transaction: {
            receiverId: params.to,
            actions: [{
              type: 'Transfer',
              params: {
                deposit: params.amount
              }
            }]
          }
        });
        
      case 'signTransaction':
        return NextResponse.json({
          success: true,
          transactionHash: '0xnear123...',
          status: 'pending'
        });
        
      default:
        return NextResponse.json({ 
          error: 'Invalid action',
          availableActions: ['generateAddress', 'buildTransaction', 'signTransaction']
        }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 