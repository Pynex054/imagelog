require('dotenv').config();
const express = require('express');
const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
const logging = require('morgan');

const app = express();

// Setup logging
app.use(logging('dev'));

// Google Sheets setup
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const SPREADSHEET_ID = '1bcWaXcgxzNeh-D1OrmRkX7v5dssiHspWwZYwtbIeF24'; // Replace with your Google Sheet ID
const RANGE_NAME = 'Sheet1!A:L'; // Adjust the range as per your sheet structure

function getGoogleSheetsService() {
    const creds = JSON.parse(process.env.GOOGLE_CREDENTIALS);
    const auth = new google.auth.GoogleAuth({
        credentials: creds,
        scopes: SCOPES
    });
    const sheets = google.sheets({ version: 'v4', auth });
    return sheets;
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'spy.gif'));
});

app.get('/image/:recipient_email', async (req, res) => {
    const filename = 'pixel.png';
    const recipientEmail = req.params.recipient_email;
    const userAgent = req.headers['user-agent'];
    const currentTime = new Date();
    const timestamp = currentTime.toISOString().replace('T', ' ').split('.')[0];
    const getIp = req.ip;

    const data = '{"country_code":"Not found","country_name":"Not found","city":"Not found","postal":"Not found","latitude":"Not found","longitude":"Not found","IPv4":"IP Not found","state":"Not found"}';

    const logEntry = [recipientEmail, timestamp, userAgent, getIp, data];

    try {
        const service = getGoogleSheetsService();
        await service.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: RANGE_NAME,
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            resource: {
                values: [logEntry]
            }
        });
    } catch (error) {
        console.error(`Error writing to Google Sheets: ${error}`);
        res.status(500).send('Internal Server Error');
        return;
    }

    res.sendFile(path.join(__dirname, filename));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
