import { google } from "googleapis";

const getAuth = () =>
  new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.SHEETS_CLIENT_EMAIL,
      private_key: Buffer.from(process.env.SHEETS_PRIVATE_KEY!, "base64")
        .toString("utf-8")
        ?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

const getSheets = () => google.sheets({ version: "v4", auth: getAuth() });

export const EMAILS_SPREADSHEET = "[Emails] 2025!A:A" as const;
export const ERRORS_SPREADSHEET = "[Errors] 2025!A:A" as const;
export const SUGGESTIONS_SPREADSHEET = "[Suggestions] 2025!A:A" as const;

type SpreadSheet =
  | typeof EMAILS_SPREADSHEET
  | typeof ERRORS_SPREADSHEET
  | typeof SUGGESTIONS_SPREADSHEET;

export const addRowToSheets = (range: SpreadSheet, values: unknown[]) => {
  const sheets = getSheets();
  return sheets.spreadsheets.values.append({
    spreadsheetId: "1FL4Tl4VBnafBtHVRBTwfzhFrPRViVwF_6DE6OxIyCBs",
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [["100cims", new Date().toISOString(), ...values]],
    },
  });
};
