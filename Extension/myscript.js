function onDiffToolButtonClicked(){
    var filePath = $(this).closest('.file-header').attr('data-path');
    var prUrl = window.location.href;
    chrome.storage.local.get({
        githubtoken: '',
        difftoolpath: ''
        }, function(items) {
            var gitHubToken = items.githubtoken;
            var toolPath = items.difftoolpath;
            
            chrome.runtime.sendMessage({
                    min_required_nativeapp_ver: '1.0.0.0',
                    msgType: 'open_difftool',
                    token: gitHubToken,
                    file_path: filePath,
                    pull_request: prUrl,
                    difftool: toolPath
                }, 
                function(response){
                    if(response["msgType"] === "Error"){                        
                        console.log(response);
                        if(response["data"].includes("minimal version required")){
                            var downloadUrl = "https://github.com/Nicologies/GitHubBuddyHost/releases/latest";
                            alert(response["data"]+ "\n" + "Please download the latest version from " + downloadUrl);
                            window.open(downloadUrl, '_blank').focus();
                        }
                    }
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

function disableMergeButtonIfMarkedAsDontMerge(){
    if(window.location.href.toLowerCase().indexOf("pull") === -1){
        return;
    }
    
    chrome.storage.local.get({dontMergeLabel: 'Do Not Merge'}, function(items){
        if(items.dontMergeLabel === ''){
            return;
        }
        var queryForDontMergeLabel = "#partial-discussion-sidebar .sidebar-labels a.label[title='" + items.dontMergeLabel + "']";
        if($("#partial-discussion-sidebar .sidebar-labels a.label[title='Do Not Merge']").length){
            var buttons = $('#partial-pull-merging .merge-message .js-select-menu button');
            $('#partial-pull-merging .merge-message .js-select-menu button').disable(true)
                .closest(".merge-message").append("<p class='alt-merge-options text-small'>Merge is disabled as this pull request has a label of "+items.dontMergeLabel+"</p>");
        }
    });
}

function convertTextToLink(){
    chrome.storage.local.get({text2link: ''}, function(items){
        if(items.text2link === ''){
            return;
        }
        
        var inJson;
        try{
            inJson = $.parseJSON(items.text2link);
        }catch(e){
            console.log(e);
            return;
        }
        var titleQuery = $("h1 > span.js-issue-title:not(:has(>a[data-container-id='githubbuddy_text2link'])), .js-comment-body>p:not(:has(>a[data-container-id='githubbuddy_text2link'])), p.commit-title:not(:has(>a)):not([data-container-id='githubbuddy_text2link'])");
        titleQuery.each(function(){
            var current = $(this);            
            var title = current.html();
            if (title !== undefined) {
                $.each(inJson, function() {
                    var from = this.from;
                    var to = this.to;
                    var displayAs = this.displayAs;
                    title = title.replace(
                            new RegExp(from),
                            '<a data-container-id="githubbuddy_text2link" href="'+ to +'" target="_blank">'+ displayAs +'</a>'
                        );
                });
                current.html(title);
            }
        });
    });
}

function performActions(){
    appendDiffToolButton();
    disableMergeButtonIfMarkedAsDontMerge();
    convertTextToLink();
}

$(function(){
    jQuery.fn.extend({
        disable: function(state) {
            return this.each(function() {
                this.disabled = state;
            });
        }
    });
    $(document).on("pjax:end", function() {
        performActions();
    });
    performActions();
});
