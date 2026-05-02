const SHEET_NAME = "Transactions";
const HEADERS = ["Id", "Date", "Description", "Category", "Amount", "Source", "Created At"];

function doPost(event) {
  const sheet = getLedgerSheet();
  const params = event.parameter || {};
  const id = params.id || Utilities.getUuid();
  const date = params.date || new Date().toISOString().slice(0, 10);
  const description = params.description || "Unknown transaction";
  const category = params.category || "";
  const amount = Number(params.amount || 0);
  const source = params.source || "sheet";

  sheet.appendRow([id, date, description, category, amount, source, new Date()]);

  return ContentService
    .createTextOutput("ok")
    .setMimeType(ContentService.MimeType.TEXT);
}

function doGet() {
  const sheet = getLedgerSheet();
  const values = sheet.getDataRange().getValues();
  const csv = values.map(rowToCsv).join("\n");

  return ContentService
    .createTextOutput(csv)
    .setMimeType(ContentService.MimeType.CSV);
}

function getLedgerSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(SHEET_NAME);

  const firstRow = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  const hasHeaders = HEADERS.every((header, index) => firstRow[index] === header);
  if (!hasHeaders) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  }

  return sheet;
}

function rowToCsv(row) {
  return row.map(cellToCsv).join(",");
}

function cellToCsv(value) {
  const text = value instanceof Date
    ? Utilities.formatDate(value, Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ss")
    : String(value || "");

  if (!/[",\n\r]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
}
