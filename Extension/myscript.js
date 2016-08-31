function onDiffToolButtonClicked(){    
    var filePath = $(this).closest('.file-header').attr('data-path');
    var prUrl = window.location.href;
    chrome.storage.local.get({
        githubtoken: '',
        difftoolpath: ''
        }, function(items) {
            var gitHubToken = items.githubtoken;            
            var toolPath = items.difftoolpath;
        
            chrome.extension.sendMessage(
                {
                    token: gitHubToken,
                    file_path: filePath,
                    pull_request: prUrl,
                    difftool: toolPath
                });
    });
}

function appendDiffToolButton(){
    if(window.location.href.toLowerCase().indexOf("pull") === -1){
        return;
    }
    $(".file-actions:not(:has(.btn-difftool))").append('<button class="btn-octicon tooltipped tooltipped-nw btn-difftool" rel="nofollow" data-skip-pjax="" aria-label="View the changes in difftool"><svg aria-hidden="true" class="octicon octicon-eye" height="16" version="1.1" viewBox="0 0 16 16" width="16"><path d="M8.06 2C3 2 0 8 0 8s3 6 8.06 6C13 14 16 8 16 8s-3-6-7.94-6zM8 12c-2.2 0-4-1.78-4-4 0-2.2 1.8-4 4-4 2.22 0 4 1.8 4 4 0 2.22-1.78 4-4 4zm2-4c0 1.11-.89 2-2 2-1.11 0-2-.89-2-2 0-1.11.89-2 2-2 1.11 0 2 .89 2 2z"></path></svg></button>');
    $(".btn-difftool").off('click', onDiffToolButtonClicked).on('click', onDiffToolButtonClicked);
}
$(function(){
    $(document).on("pjax:end", function() {
        appendDiffToolButton();
    });
    appendDiffToolButton();
});
