import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function migrate() {
  console.log('Connecting to MongoDB Atlas...');
  const dumpPath = path.join(process.cwd(), 'sqlite_dump.json');
  
  if (!fs.existsSync(dumpPath)) {
    console.error('sqlite_dump.json not found!');
    process.exit(1);
  }

  const rawData = fs.readFileSync(dumpPath, 'utf8');
  const leads = JSON.parse(rawData);
  console.log(`Loaded ${leads.length} leads from backup.`);

  console.log('Clearing existing collections in MongoDB Atlas for clean sync...');
  await prisma.note.deleteMany();
  await prisma.lead.deleteMany();
  console.log('Collections cleared.');

  console.log('Migrating leads in fast concurrent batches...');
  const BATCH_SIZE = 20;
  let migratedCount = 0;
  let notesCount = 0;

  for (let i = 0; i < leads.length; i += BATCH_SIZE) {
    const chunk = leads.slice(i, i + BATCH_SIZE);
    
    await Promise.all(chunk.map(async (l) => {
      const notesToCreate = (l.notes || []).map(n => ({
        text: n.text,
        outcome: n.outcome || null,
        callAnswer: n.callAnswer || null,
        interest: n.interest || null,
        worthInvesting: n.worthInvesting || null,
        callAgain: n.callAgain || null,
        contactPerson: n.contactPerson || null,
        temperature: n.temperature || null,
        nextAction: n.nextAction || null,
        scheduledTime: n.scheduledTime || null,
        createdAt: n.createdAt ? new Date(n.createdAt) : new Date()
      }));

      await prisma.lead.create({
        data: {
          name: l.name || 'חנות ללא שם',
          phone: l.phone || '',
          address: l.address || null,
          area: l.area || null,
          contactPerson: l.contactPerson || null,
          status: l.status || 'חדש',
          lastCallOutcome: l.lastCallOutcome || null,
          callAnswer: l.callAnswer || null,
          interest: l.interest || null,
          worthInvesting: l.worthInvesting || null,
          callAgain: l.callAgain || null,
          temperature: l.temperature || null,
          followUpDate: l.followUpDate ? new Date(l.followUpDate) : null,
          scheduledTime: l.scheduledTime || null,
          createdAt: l.createdAt ? new Date(l.createdAt) : new Date(),
          updatedAt: l.updatedAt ? new Date(l.updatedAt) : new Date(),
          notes: {
            create: notesToCreate
          }
        }
      });
      notesCount += notesToCreate.length;
    }));

    migratedCount += chunk.length;
    console.log(`Progress: ${migratedCount} / ${leads.length} leads migrated...`);
  }

  console.log(`\n🎉 Fast Migration Complete!`);
  console.log(`Successfully migrated ${migratedCount} leads and ${notesCount} notes to MongoDB Atlas.`);
}

migrate()
  .catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
