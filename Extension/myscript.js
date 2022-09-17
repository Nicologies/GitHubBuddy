function onDiffToolButtonClicked() {
    var filePath = $(this).closest('.file-header').attr('data-path');
    var prUrl = window.location.href;
    chrome.storage.local.get({
        githubtoken: '',
        difftoolpath: '',
        difftoolargs: ''
    }, function (items) {
        var gitHubToken = items.githubtoken;
        var toolPath = items.difftoolpath;
        var args = items.difftoolargs;

        chrome.runtime.sendMessage({
            min_required_nativeapp_ver: '1.0.0.2',
            msgType: 'open_difftool',
            token: gitHubToken,
            file_path: filePath,
            pull_request: prUrl,
            difftool: toolPath,
            arguments: args
        },
            function (response) {
                if (response["msgType"].toLowerCase() === "error") {
                    console.log(response);
                    const respData = response["data"];
                    if (respData && respData.includes && respData.includes("minimal version required")) {
                        var downloadUrl = "https://github.com/Nicologies/GitHubBuddyHost/releases/latest";
                        alert(response["data"] + "\n" + "Please install the latest version from " + downloadUrl);
                        window.open(downloadUrl, '_blank').focus();
                    }
                }
            });
    });
}

function isElementInViewport(el) {
    if (typeof jQuery === "function" && el instanceof jQuery) {
        el = el[0];
    }

    var rect = el.getBoundingClientRect();

    return rect.bottom > 0 &&
        rect.right > 0 &&
        rect.left < (window.innerWidth || document.documentElement.clientWidth) &&
        rect.top < (window.innerHeight || document.documentElement.clientHeight);
}

function appendDiffToolButton() {
    // location.pathname looks like /owner/repo/pull/id
    if (location.pathname.split('/')[3] !== 'pull') {
        return;
    }
    let toolbars = $(".file-actions>div.d-flex:not(:has(button.btn-difftool))");
    toolbars.each(function (index) {
        let toolbar = $(this);
        if (isElementInViewport(toolbar)) {
            toolbar.prepend('<button class="btn-octicon tooltipped btn-difftool" rel="nofollow" data-skip-pjax="" aria-label="View in difftool"><svg aria-hidden="true" class="octicon octicon-eye" height="16" version="1.1" viewBox="0 0 16 16" width="16"><path d="M8.06 2C3 2 0 8 0 8s3 6 8.06 6C13 14 16 8 16 8s-3-6-7.94-6zM8 12c-2.2 0-4-1.78-4-4 0-2.2 1.8-4 4-4 2.22 0 4 1.8 4 4 0 2.22-1.78 4-4 4zm2-4c0 1.11-.89 2-2 2-1.11 0-2-.89-2-2 0-1.11.89-2 2-2 1.11 0 2 .89 2 2z"></path></svg></button>');
            toolbar.find("button.btn-difftool").on('click', onDiffToolButtonClicked);
        }
    });
}

function disableMergeButtonIfMarkedAsDontMerge() {
    if (location.pathname.split('/')[3] !== 'pull') {
        return;
    }

    chrome.storage.local.get({ dontMergeLabel: 'Do Not Merge' }, function (items) {
        if (items.dontMergeLabel === '') {
            return;
        }
        var queryForDontMergeLabel = "#partial-discussion-sidebar .sidebar-labels a[title='" + items.dontMergeLabel + "']";
        if ($(queryForDontMergeLabel).length) {
            $('#partial-pull-merging .merge-message .js-select-menu button:not([disabled])')
                .disable(true)
                .closest(".merge-message")
                .append("<br/><p class='alt-merge-options text-small'>Merge is disabled as this pull request has a label of " + items.dontMergeLabel + "</p>");
        }
    });
}

function performActions() {
    appendDiffToolButton();
    disableMergeButtonIfMarkedAsDontMerge();
}

let scrollbarChangeHandler;
function onScrollBarChanged() {
    if (scrollbarChangeHandler) clearTimeout(scrollbarChangeHandler);

    scrollbarChangeHandler = setTimeout(performActions, 1000);
}

$(function () {
    chrome.storage.local.get({
        enableWideGitHub: true
    }, function (items) {
        var enableWideGitHub = items.enableWideGitHub;
        if (enableWideGitHub) {
            loadCSS("wide-github");
        }
    });
    jQuery.fn.extend({
        disable: function (state) {
            return this.each(function () {
                this.disabled = state;
            });
        }
    });
    $(document).on("pjax:end", function () {
        performActions();
    });

    $(window).on("scroll", onScrollBarChanged);
    performActions();
});

function loadCSS(file) {
    var link = document.createElement("link");
    link.href = chrome.extension.getURL(file + '.css');
    link.id = file;
    link.type = "text/css";
    link.rel = "stylesheet";
    document.getElementsByTagName("head")[0].appendChild(link);
}
