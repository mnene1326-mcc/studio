import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    status: 'Removed',
    message: 'PesaPal setup utility has been removed.'
  });
}
