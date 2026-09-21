import { NextResponse } from 'next/server';

// Route deactivated: Google Places API is no longer used.
// Direct Google search links are used instead.
export async function GET() {
  return NextResponse.json({ 
    message: 'Google Places API fetching is disabled. Direct Google Search is used instead.' 
  });
}
