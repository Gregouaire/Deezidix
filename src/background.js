chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
  chrome.declarativeContent.onPageChanged.addRules([{
    conditions: [new chrome.declarativeContent.PageStateMatcher({
      pageUrl: {hostEquals: 'www.deezer.com'},
    })
    ],
        actions: [new chrome.declarativeContent.ShowPageAction()]
  }]);
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.command == "dlThis") {
    chrome.downloads.download({ url: request.url, filename: request.name, conflictAction: 'overwrite', saveAs: true});
  }
  sendResponse();
});