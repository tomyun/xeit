chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    chrome.pageAction.show(sender.tab.id);
    sendResponse({});
});

chrome.pageAction.onClicked.addListener(function (tab) {
    chrome.tabs.sendMessage(tab.id, 'fallback', function (response) {
        chrome.pageAction.hide(tab.id);
    });
});
