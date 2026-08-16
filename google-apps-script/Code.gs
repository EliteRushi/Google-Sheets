/**
 * Google Apps Script Web App
 * Reads the "Website Data" sheet (columns A:J) and returns JSON.
 *
 * Deploy: Deploy > New deployment > Web app
 *   Execute as:  Me (your account)
 *   Who has access: Anyone
 */

var SPREADSHEET_ID = '1yagXN_W4QJ9nnwZs1CLi8FRYPZkt5Pt_UCIAaZh8WBc';
var SHEET_NAME = 'Website Data';
var FIRST_COLUMN = 1;   // A
var LAST_COLUMN = 10;   // J

function doGet() {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      return jsonOut({
        success: false,
        error: 'Sheet "' + SHEET_NAME + '" was not found in the spreadsheet.'
      });
    }

    var lastRow = sheet.getLastRow();
    if (lastRow < 1) {
      return jsonOut({
        success: true,
        lastUpdated: new Date().toISOString(),
        headers: [],
        rows: []
      });
    }

    // Always read the full A:J block so a blank column never shifts the data.
    var values = sheet
      .getRange(1, FIRST_COLUMN, lastRow, LAST_COLUMN - FIRST_COLUMN + 1)
      .getDisplayValues();

    var rawHeaders = values[0] || [];

    // Keep only the columns whose header cell is filled in (Row 1 defines the table).
    var activeIndexes = [];
    for (var c = 0; c < rawHeaders.length; c++) {
      if (String(rawHeaders[c]).trim() !== '') activeIndexes.push(c);
    }

    // Fallback: no headers filled in - use any column that has data somewhere.
    if (activeIndexes.length === 0) {
      for (var c2 = 0; c2 < LAST_COLUMN; c2++) {
        for (var r2 = 0; r2 < values.length; r2++) {
          if (String(values[r2][c2]).trim() !== '') { activeIndexes.push(c2); break; }
        }
      }
    }

    var headers = activeIndexes.map(function (i) { return String(rawHeaders[i]).trim(); });

    var rows = [];
    for (var r = 1; r < values.length; r++) {
      var source = values[r];
      var row = activeIndexes.map(function (i) {
        var v = source[i];
        return v === null || v === undefined ? '' : String(v).trim();
      });
      // Skip fully empty rows; keep rows with empty cells inside them.
      var hasContent = row.some(function (v) { return v !== ''; });
      if (hasContent) rows.push(row);
    }

    return jsonOut({
      success: true,
      lastUpdated: new Date().toISOString(),
      sheet: SHEET_NAME,
      headers: headers,
      rows: rows
    });
  } catch (err) {
    return jsonOut({
      success: false,
      error: 'Unable to read the spreadsheet: ' + (err && err.message ? err.message : err)
    });
  }
}

function jsonOut(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}