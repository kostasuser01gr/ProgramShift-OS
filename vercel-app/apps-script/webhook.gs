/*************************************************************************************************
 *  webhook.gs — add this to the bound Code.gs to push sheet edits to the Vercel app.
 *  (Already wired into the delivered Code.gs; this file is the standalone reference.)
 *
 *  SETUP (one time, as owner):
 *    Apps Script → Project Settings → Script Properties → add:
 *      APP_WEBHOOK_URL    = https://your-app.vercel.app/api/webhook/sheets
 *      APP_WEBHOOK_SECRET = <same long random string as WEBHOOK_SECRET in Vercel>
 *
 *  Then call notifyApp_(range, oldV, newV) from your installable onEdit handler,
 *  right after the CODED mirror. It is best-effort and never blocks the edit.
 *************************************************************************************************/
function notifyApp_(range, oldV, newV) {
  try {
    var props = PropertiesService.getScriptProperties();
    var url = props.getProperty('APP_WEBHOOK_URL');
    var secret = props.getProperty('APP_WEBHOOK_SECRET');
    if (!url || !secret) return;                 // not configured yet — skip silently

    var editor = '';
    try { editor = Session.getActiveUser().getEmail() || ''; } catch (e) {}

    UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      headers: { 'X-Secret': secret },
      payload: JSON.stringify({
        a1: range.getA1Notation(),
        sheet: range.getSheet().getName(),
        oldV: oldV === undefined ? '' : oldV,
        newV: newV === undefined ? '' : newV,
        editor: editor,
        at: new Date().toISOString()
      }),
      muteHttpExceptions: true                   // never throw from a trigger
    });
  } catch (err) {
    Logger.log('notifyApp_ error: ' + err);
  }
}
