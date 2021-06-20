dlSelected.onclick = function() {
  browser.tabs.query({active: true, currentWindow: true}, function(tabs) {
    browser.tabs.sendMessage(tabs[0].id, {command: "downloadMessageSelected"});
  });
};

dlAlbumPlaylist.onclick = function() {
  browser.tabs.query({active: true, currentWindow: true}, function(tabs) {
    browser.tabs.sendMessage(tabs[0].id, {command: "downloadMessageAlbumPlaylist"});
  });
};