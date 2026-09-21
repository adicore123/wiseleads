import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import { parse } from 'csv-parse/sync';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  const csvFilePath = path.join(process.cwd(), '..', 'חנויות אופניים בישראל CSV (1).csv');
  const fileContent = fs.readFileSync(csvFilePath, 'utf8');

  // The CSV format is slightly inconsistent based on preview:
  // Row 1: שם החנות,טלפון,כתובת,אזור
  // Row 2-3: name, phone, address, area
  // Row 4: #, שםהחנות, טלפון, מרכז (header change)
  // Row 5+: number, name, phone, area
  // So we will parse all rows and handle the inconsistencies manually.
  
  const records = parse(fileContent, {
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true,
  });

  let addedCount = 0;

  for (let i = 1; i < records.length; i++) {
    const row = records[i];
    
    // Skip the secondary header
    if (row[0] === '#' || row[0].includes('שםהחנות')) continue;
    
    let name = '';
    let phone = '';
    let address = '';
    let area = '';

    // If row has 4 columns and first column is a number, it's the second format
    if (row.length >= 3 && !isNaN(parseInt(row[0]))) {
      name = row[1];
      phone = row[2];
      area = row[3] || '';
    } else {
      // First format
      name = row[0];
      phone = row[1];
      address = row[2] || '';
      area = row[3] || '';
    }

    // Clean up
    name = name ? name.trim() : '';
    phone = phone ? phone.trim() : '';
    address = address ? address.trim() : '';
    area = area ? area.trim() : '';

    if (!name && !phone) continue;

    try {
      await prisma.lead.create({
        data: {
          name,
          phone,
          address,
          area
        }
      });
      addedCount++;
    } catch (e) {
      console.error(`Failed to add record: ${name}`, e);
    }
  }

  console.log(`Successfully added ${addedCount} leads.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
