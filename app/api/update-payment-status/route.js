import { NextResponse } from 'next/server';
import { dataManager } from '../../../src/lib/data-manager';

export async function PUT(request) {
  try {
    console.log('💰 API: Update payment status request received');
    const body = await request.json();
    console.log('📝 API: Request body:', body);
    const { guessId, paymentStatus } = body;

    if (!guessId || !paymentStatus) {
      console.log('❌ API: Missing required fields');
      return NextResponse.json({ error: 'Guess ID and payment status are required' }, { status: 400 });
    }

    await dataManager.initialize();
    console.log(`💰 API: Updating payment status for guess ${guessId} to ${paymentStatus}...`);
    const updatedGuess = await dataManager.updateGuessPaymentStatus(guessId, paymentStatus);
    console.log('✅ API: Payment status updated successfully:', updatedGuess);

    return NextResponse.json({
      success: true,
      updatedGuess: updatedGuess
    });

  } catch (error) {
    console.error('❌ API: Error updating payment status:', error);
    return NextResponse.json({
      error: 'Failed to update payment status',
      details: error.message
    }, { status: 500 });
  }
}
