import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import path from 'path';

const credentials = require(path.join(__dirname, '../google-credentials.json'));

const SHEET_ID = process.env.GOOGLE_SPREADSHEET_ID || process.env.GOOGLE_SHEET_ID;

if (!SHEET_ID) {
  throw new Error('GOOGLE_SPREADSHEET_ID or GOOGLE_SHEET_ID environment variable is required');
}

let doc: GoogleSpreadsheet;

export async function initSheet() {
  const serviceAccountAuth = new JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  doc = new GoogleSpreadsheet(SHEET_ID, serviceAccountAuth);
  await doc.loadInfo();
  console.log(`Connected to Google Sheet: ${doc.title}`);
}

export async function getSheetByTitle(title: string) {
  if (!doc) {
    throw new Error('Sheet not initialized. Call initSheet() first.');
  }
  return doc.sheetsByTitle[title];
}