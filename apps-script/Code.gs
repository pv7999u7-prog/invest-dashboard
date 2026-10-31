// 投資總覽 App 的資料介面
// 安裝方式：試算表 → 擴充功能 → Apps Script → 把這整段貼上 → 改下面的 KEY → 部署為網頁應用程式
//   執行身分：我　／　誰可以存取：所有人
// App 每次打開都會帶著密碼來讀一次資料；密碼不對就什麼都拿不到。

// 只要改這一行：密碼放在兩個單引號中間，例如 const KEY = 'abc123';
const KEY = '請改成你自己的密碼';

// 要讀的工作表與範圍（試算表版面有大改時，才需要調整這裡）
const RANGES = {
  total:     ['Total Overall', 'A1:Z200'],
  tw:        ['台股', 'A1:P400'],
  us:        ['美股', 'A1:P600'],
  crypto:    ['幣 ', 'A1:N40'],
  myDca:     ['My 定期定額 (台幣帳戶)', 'A1:J40'],
  kidsUs:    ['橙&澈 美股', 'A1:J60'],
  kidsTw:    ['橙&澈 定期定額台股', 'A1:J80'],
  plan:      ['Plan', 'A1:I40'],
  milestone: ['Milestone', 'A1:B80'],
  expense:   ['固定支出', 'A1:L60'],
  house:     ['House', 'A1:L10']
};

// App 用 POST 把密碼放在內容裡送過來，不會出現在網址上
function doPost(e) {
  let key = '';
  try { key = JSON.parse(e.postData.contents).key || ''; } catch (err) {}
  // 用字串比對，KEY 就算忘了加引號寫成數字也能對上
  const expected = String(KEY).trim();
  if (!expected || expected.startsWith('請改成') || String(key).trim() !== expected) {
    return json({ ok: false, error: 'unauthorized' });
  }
  return json({ ok: true, updated: now(), data: readAll() });
}

// 直接用瀏覽器打開網址時，只確認服務有在運作，不給資料
function doGet() {
  return json({ ok: false, error: 'use the app' });
}

function readAll() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const tz = ss.getSpreadsheetTimeZone();
  const data = {};
  Object.keys(RANGES).forEach(name => {
    const [sheetName, a1] = RANGES[name];
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) { data[name] = []; return; }
    const isDateValue = v => Object.prototype.toString.call(v) === '[object Date]' && !isNaN(v.getTime());
    const rows = sheet.getRange(a1).getValues().map(row => row.map(v =>
      isDateValue(v) ? Utilities.formatDate(v, tz, 'yyyy/MM/dd') : v));
    // 去掉尾端的空白列，減少傳輸量
    let last = rows.length;
    while (last > 0 && rows[last - 1].every(v => v === '')) last--;
    data[name] = rows.slice(0, last);
  });
  data._sheetUrl = ss.getUrl();   // App「更多 → 原始資料」用來打開這份試算表
  return data;
}

function now() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return Utilities.formatDate(new Date(), ss.getSpreadsheetTimeZone(), 'yyyy/MM/dd HH:mm');
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
