/**
 * TruckBuck — lead log for Google Sheets (Apps Script web app).
 *
 * The website POSTs every new lead here; this script appends one row with
 * Status / Owner / Notes columns the team fills in. Setup:
 *
 *   1. Create a Google Sheet (e.g. "TruckBuck leads"), then Extensions → Apps Script.
 *   2. Replace Code.gs with this file. Save.
 *   3. Project Settings → Script properties → add LEAD_WEBHOOK_SECRET = a long
 *      random string (same value as SHEET_WEBHOOK_SECRET in Vercel).
 *   4. Deploy → New deployment → type "Web app":
 *        Execute as: Me            Who has access: Anyone
 *      Copy the web-app URL (…/exec) into SHEET_WEBHOOK_URL in Vercel.
 *      ("Anyone" is required for a server-to-server call; the secret is what
 *      protects it. Requests without the right secret are rejected.)
 *   5. Share the Sheet with the ops team. Never share the script editor or
 *      the secret.
 *
 * Re-deploy (Deploy → Manage deployments → Edit → New version) after any
 * change to this file; the URL stays the same.
 */

var SHEET_NAME = "Leads";
var HEADERS = [
  "Received (IST)",
  "Reference",
  "Type",
  "Status",
  "Owner",
  "Notes",
  "Name",
  "Phone",
  "Details",
  "Served",
  "Source",
  "Medium",
  "Campaign",
  "Landing page",
  "Submitted on",
  "Language",
];
var STATUSES = ["New", "Contacted", "Quoted", "Booked", "Lost", "Spam"];

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var expected = PropertiesService.getScriptProperties().getProperty("LEAD_WEBHOOK_SECRET");
    if (!expected || body.secret !== expected) return json({ ok: false, error: "forbidden" });

    var row = body.row || {};
    var lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      var sheet = leadSheet();
      // Text-format phone and reference so Sheets doesn't turn them into numbers.
      sheet.appendRow([
        row.received_ist || "",
        "'" + (row.reference || ""),
        row.type || "",
        row.status || "New",
        row.owner || "",
        "",
        row.name || "",
        "'" + (row.phone || ""),
        row.details || "",
        row.served || "",
        row.source || "",
        row.medium || "",
        row.campaign || "",
        row.landing_page || "",
        row.page || "",
        row.language || "",
      ]);
    } finally {
      lock.releaseLock();
    }
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

/** Creates the "Leads" tab with headers, a Status dropdown and frozen header row. */
function leadSheet() {
  var book = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = book.getSheetByName(SHEET_NAME);
  if (sheet) return sheet;
  sheet = book.insertSheet(SHEET_NAME);
  sheet.appendRow(HEADERS);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
  var status = SpreadsheetApp.newDataValidation().requireValueInList(STATUSES, true).build();
  sheet.getRange(2, 4, sheet.getMaxRows() - 1, 1).setDataValidation(status);
  return sheet;
}

function json(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
