chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if(request['msgType'] == 'open_difftool'){
        chrome.runtime.sendNativeMessage(
            'com.nicologies.difftool',
            request,
            function(response){            
                if(chrome.runtime.lastError){
                    console.log(chrome.runtime.lastError);
                    sendResponse({msgType:'error', data: chrome.runtime.lastError});
                }else{
                    console.log("response from native app, msgType: " + response["msgType"] + " data: " + response["data"]);
                    sendResponse(response);
                }
            });
    }
    return true;
});