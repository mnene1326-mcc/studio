
import { NextResponse } from 'next/server';

/**
 * @fileOverview Webhook listener removed.
 */

export async function POST() {
  return NextResponse.json({ status: 'disabled' }, { status: 404 });
}

export async function GET() {
  return NextResponse.json({ status: 'disabled' }, { status: 404 });
}
