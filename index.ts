import dotenv from 'dotenv';
import path from 'path';
import { Telegraf } from 'telegraf';

dotenv.config({ path: path.resolve(__dirname, '.env') });

import { connectDB, disconnectDB } from './lib/db';
import { initSheet, getSheetByTitle } from './lib/sheets';
import JoinRequest from './models/joinRequest';
import { GoogleSpreadsheetRow } from 'google-spreadsheet';

// --- CONFIGURATION ---
const SHEET_TITLE = 'Yap Circle Korea';
const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
    throw new Error('BOT_TOKEN is not defined in your environment variables.');
}

// --- TELEGRAF BOT SETUP ---
const bot = new Telegraf(BOT_TOKEN);

// --- HELPER FUNCTIONS ---
const getApprovalMessage = (username: string) => `🎉 Welcome, @${username}! Your request to join has been approved.`;
const getRejectionMessage = (username: string) => `😔 Hi, @${username}. Unfortunately, your request to join has been rejected at this time.`;

/**
 * Transforms MongoDB user document to a plain object for the sheet.
 */
function transformUserForSheet(user: any) {
    return {
        telegramId: user.telegramId,
        username: user.username || '',
        xLink: user.xLink,
        status: user.status,
        submittedAt: user.submittedAt.toISOString(),
        processed: '', // Default to empty
    };
}

// --- MAIN SYNC LOGIC ---
async function main() {
    console.log('Starting two-way sync process...');
    await connectDB();
    await initSheet();

    const sheet = await getSheetByTitle(SHEET_TITLE);
    if (!sheet) throw new Error(`Sheet "${SHEET_TITLE}" not found.`);

    const rows = await sheet.getRows();
    const sheetTelegramIds = new Set(rows.map(row => row.get('telegramId')));

    // 1. Push new users from DB to Sheet
    const allDbUsers = await JoinRequest.find({}).lean();
    const newDbUsers = allDbUsers.filter((user: any) => !sheetTelegramIds.has(user.telegramId));

    if (newDbUsers.length > 0) {
        console.log(`Found ${newDbUsers.length} new users in DB to add to the sheet.`);
        const newRows = newDbUsers.map(transformUserForSheet);
        await sheet.addRows(newRows);
        console.log('Successfully added new users to the sheet.');
    } else {
        console.log('No new users found in DB to push to the sheet.');
    }

    // 2. Pull updates from Sheet to DB and notify
    const unprocessedRows = rows.filter(row =>
        (row.get('status') === 'approved' || row.get('status') === 'rejected') && !row.get('processed')
    );

    if (unprocessedRows.length > 0) {
        console.log(`Found ${unprocessedRows.length} unprocessed status changes in the sheet.`);
        for (const row of unprocessedRows) {
            await processSheetUpdate(row);
        }
    } else {
        console.log('No unprocessed status changes found in the sheet.');
    }
}

/**
 * Processes a single row update from the sheet.
 * Updates DB, sends notification, and marks the row as processed.
 */
async function processSheetUpdate(row: GoogleSpreadsheetRow<any>) {
    const telegramId = row.get('telegramId');
    const newStatus = row.get('status');
    const username = row.get('username') || telegramId;

    try {
        console.log(`Processing update for ${username}: status -> ${newStatus}`);

        // Update DB
        const updatedUser = await JoinRequest.findOneAndUpdate(
            { telegramId, status: 'pending' }, // Ensure we only update pending requests
            { $set: { status: newStatus } },
            { new: true }
        );

        if (!updatedUser) {
            console.log(`User ${username} was not pending or not found. Skipping.`);
            row.set('processed', 'Skipped (not pending)');
            await row.save();
            return;
        }

        // Send Telegram Notification
        const message = newStatus === 'approved' ? getApprovalMessage(username) : getRejectionMessage(username);
        await bot.telegram.sendMessage(telegramId, message);
        console.log(`Sent ${newStatus} notification to ${username}.`);

        // Mark as processed in Sheet
        row.set('processed', new Date().toISOString());
        await row.save();
        console.log(`Successfully processed and marked ${username}.`);

    } catch (error: any) {
        console.error(`Failed to process update for ${username}:`, error);
        row.set('processed', `Error: ${error.message}`);
        await row.save();
    }
}


// --- RUN SCRIPT ---
main()
    .catch(error => {
        console.error('An error occurred during the sync process:', error);
        process.exit(1);
    })
    .finally(async () => {
        await disconnectDB();
        console.log('Sync process finished.');
    }); 