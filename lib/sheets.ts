import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import path from 'path';
import fs from 'fs';

// Debug: Log current working directory and __dirname
console.log('Current working directory:', process.cwd());
console.log('__dirname:', __dirname);

// Try multiple paths for the credentials file
const possiblePaths = [
  path.join(process.cwd(), 'google-credentials.json'), // Render secret file location
  path.join(__dirname, '../google-credentials.json'),   // Local development
  '/etc/secrets/google-credentials.json',               // Alternative Render location
  'google-credentials.json',                            // Direct relative path
];

let credentials;
let credentialsPath = '';

// Debug: List files in current directory
console.log('Files in current directory:');
try {
  const files = fs.readdirSync(process.cwd());
  files.forEach(file => console.log(' -', file));
} catch (err) {
  console.error('Error listing files:', err);
}

for (const testPath of possiblePaths) {
  console.log(`Checking path: ${testPath} - Exists: ${fs.existsSync(testPath)}`);
  if (fs.existsSync(testPath)) {
    credentialsPath = testPath;
    break;
  }
}

if (!credentialsPath) {
  console.error('Checked paths:', possiblePaths);
  throw new Error('google-credentials.json not found in any expected location');
}

console.log('Found credentials at:', credentialsPath);
credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));

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

  doc = new GoogleSpreadsheet(SHEET_ID!, serviceAccountAuth);
  await doc.loadInfo();
  console.log(`Connected to Google Sheet: ${doc.title}`);
}

export async function getSheetByTitle(title: string) {
  if (!doc) {
    throw new Error('Sheet not initialized. Call initSheet() first.');
  }
  return doc.sheetsByTitle[title];
}