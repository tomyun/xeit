chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    chrome.pageAction.show(sender.tab.id);
    sendResponse({});
});
