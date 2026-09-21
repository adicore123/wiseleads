import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('Connecting to MongoDB Atlas in the cloud...');
  
  const leads = await prisma.lead.findMany({
    include: { notes: true }
  });
  
  const notesCount = await prisma.note.count();
  
  console.log(`Connected successfully!`);
  console.log(`Retrieved ${leads.length} leads and ${notesCount} notes from MongoDB Atlas.`);
  
  const exportData = {
    exportedAt: new Date().toISOString(),
    cloudDatabase: 'bike_crm (MongoDB Atlas)',
    totalLeads: leads.length,
    totalNotes: notesCount,
    leads: leads
  };
  
  const outPath = path.resolve('mongo_atlas_backup.json');
  fs.writeFileSync(outPath, JSON.stringify(exportData, null, 2), 'utf-8');
  console.log(`Exported complete cloud JSON to ${outPath} (${(fs.statSync(outPath).size / 1024).toFixed(1)} KB)`);
  
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('Error exporting from MongoDB Atlas:', e);
  process.exit(1);
});
