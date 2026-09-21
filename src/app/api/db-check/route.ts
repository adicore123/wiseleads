import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function GET() {
  const dbUrl = process.env.DATABASE_URL || '';
  const masked = dbUrl ? dbUrl.replace(/:[^@]+@/, ':****@') : 'NOT_SET';
  
  try {
    const count = await prisma.lead.count();
    const sample = await prisma.lead.findFirst({ select: { name: true } });
    return NextResponse.json({
      status: 'success',
      hasEnv: !!dbUrl,
      dbUrlMasked: masked,
      targetDb: dbUrl.includes('/bike_crm') ? 'bike_crm' : 'unknown/default',
      leadsCount: count,
      sampleStore: sample?.name || null
    });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({
      status: 'error',
      hasEnv: !!dbUrl,
      dbUrlMasked: masked,
      targetDb: dbUrl.includes('/bike_crm') ? 'bike_crm' : 'unknown/default',
      errorMessage: error.message,
      errorName: error.name
    }, { status: 500 });
  }
}
