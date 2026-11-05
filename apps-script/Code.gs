/**
 * Backend Google Sheets untuk Instagram Analytics Dashboard.
 * Tempel di Extensions > Apps Script pada spreadsheet, isi Script Property TOKEN, lalu Deploy > Web app
 * (Execute as: Me, Who has access: Anyone). Semua permintaan wajib membawa TOKEN yang sama.
 */
var NUMERIC = ['value', 'views', 'likes', 'interactions'];

function doPost(e) {
  var lock = LockService.getScriptLock();
  var locked = false;
  try {
    var req = JSON.parse(e.postData.contents);
    var token = PropertiesService.getScriptProperties().getProperty('TOKEN');
    if (!token || req.token !== token) return out({ error: 'Token salah.' });
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (req.action === 'read') {
      var sheets = {};
      ss.getSheets().forEach(function (s) {
        var v = s.getDataRange().getValues();
        if (v.length && v[0][0] !== '') sheets[s.getName()] = v.map(function (row) { return row.map(cell); });
      });
      return out({ sheets: sheets });
    }
    if (req.action === 'write') {
      lock.waitLock(30000); // hanya penulisan yang perlu antre; membaca tidak memakai kunci
      locked = true;
      var counts = {};
      Object.keys(req.sheets).forEach(function (name) {
        var rows = req.sheets[name];
        var s = ss.getSheetByName(name) || ss.insertSheet(name);
        s.clearContents();
        var cols = rows[0].length;
        // Kolom non-angka diformat teks agar tanggal tidak diubah dan isi "=..." tidak dianggap rumus.
        rows[0].forEach(function (h, c) {
          s.getRange(1, c + 1, Math.max(rows.length, 1), 1).setNumberFormat(NUMERIC.indexOf(h) >= 0 ? '0.########' : '@');
        });
        s.getRange(1, 1, rows.length, cols).setValues(rows.map(function (r) { return r.map(function (v) { return v === null ? '' : v; }); }));
        s.getRange(1, 1, 1, cols).setFontWeight('bold');
        s.setFrozenRows(1);
        counts[name] = rows.length;
      });
      return out({ ok: true, counts: counts });
    }
    return out({ error: 'Aksi tidak dikenal.' });
  } catch (err) {
    return out({ error: String(err) });
  } finally {
    if (locked) lock.releaseLock();
  }
}

function cell(v) {
  if (v instanceof Date) return Utilities.formatDate(v, 'UTC', 'yyyy-MM-dd');
  return v;
}
function out(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
