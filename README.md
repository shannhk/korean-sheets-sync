# Korean Sheets Sync

A synchronization service that connects MongoDB join requests with Google Sheets for the Korean Lunar Telegram Bot.

## Features

- **Two-way sync**: MongoDB ↔️ Google Sheets
- **Auto-notification**: Sends Telegram messages when admins approve/reject requests
- **Korean localization**: Sends messages in Korean to users
- **Batch processing**: Efficiently handles multiple requests

## Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/shannhk/korean-sheets-sync.git
   cd korean-sheets-sync
   npm install
   ```

2. **Configure Google Sheets**
   - Create a Google Sheet with these headers:
     - `telegramId`, `username`, `xLink`, `status`, `submittedAt`, `processed`
   - Create a tab named "Yap Circle Korea"
   - Share the sheet with your service account email

3. **Set up Google Cloud**
   - Enable Google Sheets API
   - Create a service account
   - Download the JSON key as `google-credentials.json`

4. **Environment Variables**
   Create a `.env` file:
   ```
   MONGO_URI=your_mongodb_connection_string
   BOT_TOKEN=your_telegram_bot_token
   GOOGLE_SPREADSHEET_ID=your_sheet_id
   ```

5. **Run locally**
   ```bash
   npm start
   ```

## Deployment on Render

1. Create a new Background Worker
2. Set root directory: `.` (repository root)
3. Build command: `npm install`
4. Start command: `npm start`
5. Add environment variables
6. Add `google-credentials.json` as a secret file

## How it Works

1. Fetches pending join requests from MongoDB
2. Adds new requests to Google Sheets
3. Monitors sheet for admin status changes
4. Updates MongoDB and sends Telegram notifications
5. Marks processed rows to avoid duplicates

## Notes

- The service runs once then exits (designed for cron jobs)
- Sheet tab must be named "Yap Circle Korea"
- Admins update the status column to "approved" or "rejected"