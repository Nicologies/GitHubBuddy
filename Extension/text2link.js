class TextToLink {
    escapeHTML(str) { return str.replace(/[&"'<>]/g, (m) => ({ "&": "&amp;", '"': "&quot;", "'": "&#39;", "<": "&lt;", ">": "&gt;" })[m]); }

    convertForAzureDevOps(config) {

        let rightPanel = $("div.repos-pr-details-page-tabbar");
        if (!rightPanel) {
            return;
        }
        let titleQuery = $("div.repos-pr-title > input");
        if (titleQuery.length === 0) {
            return;
        }

        const linksPanelId = "githubbuddy_text2link";
        const linksListId = "githubbuddy_text2linklist";
        let linksPanel = rightPanel.find(`#${linksPanelId}`);

        let oldText = titleQuery[0].value;
        $.each(config, function (index) {
            var from = this.from;
            const regexp = new RegExp(`.*${from}.*`, 'igm');
            const match = oldText.match(regexp);
            if (!match) {
                return;
            }
            const to = escapeHTML(oldText.replace(regexp, this.to));
            const displayAs = escapeHTML(oldText.replace(regexp, this.displayAs));

            if (linksPanel.length === 0) {
                rightPanel.append('<div class="flex-column" id= "' + linksPanelId + '"><div id="' + linksListId + '"></div></div>');
                linksPanel = rightPanel.find(`#${linksPanelId}`);
            }
            let linksList = linksPanel.find(`#${linksListId}`);

            let linkId = `githubbuddy_link_of_${index}`;
            if (linksList.find(`#${linkId}`).length > 0) {
                return;
            }
            let item = '<a id="' + linkId + '" href="' + to + '" target="_blank" style="margin-right:4px">' + displayAs + '</a>';
            linksList.append(item);
        });
    }

    convertTextToLink() {
        chrome.storage.local.get({ text2link: '' }, function (items) {
            if (items.text2link === '') {
                return;
            }

            var inJson;
            try {
                inJson = $.parseJSON(items.text2link);
            } catch (e) {
                console.log(e);
                return;
            }

            if (window.location.host === 'dev.azure.com') {
                convertForAzureDevOps(inJson);
                return;
            }

            // single selector seems much faster than combining them into one.
            let titleQuery = $("h1 > span.js-issue-title:not(:has(>a[data-container-id='githubbuddy_text2link']))");
            let commentsQuery = $(".js-comment-body>p:not(:has(>a[data-container-id='githubbuddy_text2link']))");
            let commitTitleQuery = $("p.commit-title:not(:has(>a)):not([data-container-id='githubbuddy_text2link'])");
            let quereis = titleQuery.add(commentsQuery).add(commitTitleQuery);
            quereis.each(function () {
                var current = $(this);
                if (isElementInViewport(current)) {
                    var oldText = current.html();
                    var newText = oldText;
                    if (oldText.startsWith("<a ")) {
                        return;
                    }
                    if (newText !== undefined) {
                        $.each(inJson, function () {
                            var from = this.from;
                            var to = this.to;
                            var displayAs = this.displayAs;
                            newText = newText.replace(
                                new RegExp(from, 'igm'),
                                '<a data-container-id="githubbuddy_text2link" href="' + escapeHTML(to) + '" target="_blank">' + escapeHTML(displayAs) + '</a>'
                            );
                        });

                        if (newText !== oldText) {
                            current.html(newText);
                        }
                    }
                }
            });
        });
    }
}

$(function () {
    const textToLink = new TextToLink();
    textToLink.convertTextToLink();
    let lastUrl = location.href;
    new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
            lastUrl = url;
            textToLink.convertTextToLink();
        }
    }).observe(document, { subtree: true, childList: true });
});