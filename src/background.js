browser.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (changeInfo.status === 'complete' && tab.url.match('www.deezer.com')) {
    browser.pageAction.show(tabId);
  }
});

browser.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.command == "dlThis") {
    var urlToDl = URL.createObjectURL(request.blob);
    browser.downloads.download({ url: urlToDl, filename: request.name, conflictAction: 'overwrite'});
  }
  sendResponse();
});