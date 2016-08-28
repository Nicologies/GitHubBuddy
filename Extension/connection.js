chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {   
    chrome.runtime.sendNativeMessage(
        'com.nicologies.difftool',
        request,
        sendResponse);
});