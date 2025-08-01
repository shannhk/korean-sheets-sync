# Korean Sheets Sync Setup Guide

## Prerequisites
- Google Cloud account
- Google Sheet created and shared with service account
- MongoDB connection string
- Telegram bot token

## Step 1: Create Google Sheet
1. Create a new Google Sheet named "Yap Circle Korea"
2. Add these headers in row 1:
   - A1: `telegramId`
   - B1: `username`
   - C1: `xLink`
   - D1: `status`
   - E1: `submittedAt`
   - F1: `processed`

## Step 2: Google Cloud Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing
3. Enable Google Sheets API:
   - APIs & Services → Library
   - Search "Google Sheets API"
   - Enable it
4. Create Service Account:
   - APIs & Services → Credentials
   - Create Credentials → Service Account
   - Name: "korean-lunar-bot"
   - Create and Continue → Done
5. Get JSON Key:
   - Click on service account
   - Keys tab → Add Key → Create new key → JSON
   - Download the file

## Step 3: Share Sheet with Service Account
1. Open downloaded JSON key
2. Copy the `client_email` value
3. In Google Sheet: Share → Add service account email → Editor → Send

## Step 4: Configure Korean Sheets Sync
1. Replace `google-credentials.json` with your downloaded key file
2. Create `.env` file in korean-sheets-sync directory:
```
MONGO_URI=your_mongodb_connection_string
BOT_TOKEN=your_telegram_bot_token
GOOGLE_SHEET_ID=your_sheet_id
```

To find GOOGLE_SHEET_ID:
- Open your sheet
- URL format: https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit
- Copy the ID between /d/ and /edit

## Step 5: Deploy to Render
1. Create new Web Service on Render
2. Connect to your GitHub repo
3. Configure:
   - Build Command: `cd korean-lunar-tg-bot/korean-sheets-sync && npm install`
   - Start Command: `cd korean-lunar-tg-bot/korean-sheets-sync && npm start`
4. Add environment variables:
   - MONGO_URI
   - BOT_TOKEN
   - GOOGLE_SHEET_ID
5. Add google-credentials.json as secret file

## Step 6: Running Locally (for testing)
```bash
cd korean-lunar-tg-bot/korean-sheets-sync
npm install
npm start
```

## How It Works
The sync service:
1. Pushes new join requests from MongoDB to Google Sheets
2. Monitors sheet for admin status changes (approved/rejected)
3. Updates MongoDB and sends Telegram notifications
4. Marks processed rows to avoid duplicates

## Important Notes
- Sheet tab name must be "Yap Circle Korea" (configured in index.ts line 13)
- Your sheet ID is: `1owUdqoayBlhG7hds8ot1WxFy5kWLmSPQX3CAuy-2C7g`
- Service runs once then exits - use cron job or scheduler for periodic runs
- Admins update status column in sheet to "approved" or "rejected"
- Bot sends Korean messages to users when status changes