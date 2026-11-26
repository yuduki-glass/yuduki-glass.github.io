/**
 * Optional Apps Script web-app entry point for the public cat position feed.
 * Install only in a project with no other HTTP handlers.
 */
function doGet(e) {
  let snapshot = null;
  if (!e?.pathInfo) {
    try {
      snapshot = catWebReadCommittedPositionFeed_();
    } catch {
      // Public callers receive no checkpoint metadata or internal error details.
    }
  }
  return ContentService.createTextOutput(JSON.stringify(snapshot))
    .setMimeType(ContentService.MimeType.JSON);
}
