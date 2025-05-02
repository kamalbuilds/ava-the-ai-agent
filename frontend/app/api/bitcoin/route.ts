import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const address = searchParams.get('address');
    
    switch (action) {
      case 'balance':
        return NextResponse.json({ 
          balance: '0.01',
          currency: 'BTC',
          address: address || 'bc1qexample...',
          confirmed: '0.01',
          unconfirmed: '0.00'
        });
      
      case 'utxos':
        return NextResponse.json({ 
          utxos: [
            {
              txid: 'abc123...',
              vout: 0,
              value: 1000000,
              confirmations: 6
            }
          ]
        });
        
      case 'fees':
        return NextResponse.json({ 
          fastestFee: 20,
          halfHourFee: 15,
          hourFee: 10,
          economyFee: 5
        });
        
      default:
        return NextResponse.json({ 
          message: 'Bitcoin API endpoint',
          availableActions: ['balance', 'utxos', 'fees']
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
          address: 'bc1qexample123...',
          derivationPath: params.path || 'bitcoin-1',
          addressType: 'bech32'
        });
        
      case 'buildTransaction':
        return NextResponse.json({
          success: true,
          transaction: {
            inputs: [
              {
                txid: 'abc123...',
                vout: 0,
                value: 1000000
              }
            ],
            outputs: [
              {
                address: params.to,
                value: parseInt(params.amount)
              }
            ],
            fee: 2000,
            size: 225
          }
        });
        
      case 'signTransaction':
        return NextResponse.json({
          success: true,
          transactionHash: 'def456...',
          rawTransaction: '0100000001...',
          status: 'signed'
        });
        
      case 'broadcastTransaction':
        return NextResponse.json({
          success: true,
          transactionHash: 'def456...',
          status: 'broadcasted'
        });
        
      default:
        return NextResponse.json({ 
          error: 'Invalid action',
          availableActions: ['generateAddress', 'buildTransaction', 'signTransaction', 'broadcastTransaction']
        }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 