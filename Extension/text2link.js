class TextToLink {
    escapeHTML(str) { return str.replace(/[&"'<>]/g, (m) => ({ "&": "&amp;", '"': "&quot;", "'": "&#39;", "<": "&lt;", ">": "&gt;" })[m]); }

    convertForAzureDevOps(config) {

        const rightPanel = $("div.repos-pr-details-page-tabbar");
        if (rightPanel.length === 0) {
            return;
        }
        const titleQuery = $("div.repos-pr-title > input");
        if (titleQuery.length === 0) {
            return;
        }

        const linksPanelId = "githubbuddy_text2link";
        const linksListId = "githubbuddy_text2linklist";
        let linksPanel = rightPanel.find(`#${linksPanelId}`);

        const prTitle = titleQuery[0].value;
        $.each(config, (index, rule) => {
            const from = rule.from;
            const regexp = new RegExp(`.*${from}.*`, 'igm');
            const match = prTitle.match(regexp);
            if (!match) {
                return;
            }
            const to = this.escapeHTML(prTitle.replace(regexp, rule.to));
            const displayAs = this.escapeHTML(prTitle.replace(regexp, rule.displayAs));

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
        chrome.storage.local.get({ text2link: '' }, (items) => {
            if (items.text2link === '') {
                return;
            }

            var inJson;
            try {
                inJson = JSON.parse(items.text2link);
            } catch (e) {
                console.log(e);
                return;
            }

            if (window.location.host === 'dev.azure.com') {
                this.convertForAzureDevOps(inJson);
                return;
            }

            // single selector seems much faster than combining them into one.
            let titleQuery = $("h1 > span.js-issue-title:not(:has(>a[data-container-id='githubbuddy_text2link']))");
            let commentsQuery = $(".js-comment-body>p:not(:has(>a[data-container-id='githubbuddy_text2link']))");
            let commitTitleQuery = $("p.commit-title:not(:has(>a)):not([data-container-id='githubbuddy_text2link'])");
            let quereis = titleQuery.add(commentsQuery).add(commitTitleQuery);
            quereis.each((_index, current) => {
                if (isElementInViewport(current)) {
                    const oldText = $(current).html();
                    let newText = oldText;
                    if (oldText.startsWith("<a ")) {
                        return;
                    }
                    if (newText !== undefined) {
                        $.each(inJson, (_, rule) => {
                            const from = rule.from;
                            const to = rule.to;
                            const displayAs = rule.displayAs;
                            newText = newText.replace(
                                new RegExp(from, 'igm'),
                                '<a data-container-id="githubbuddy_text2link" href="' + this.escapeHTML(to) + '" target="_blank">' + this.escapeHTML(displayAs) + '</a>'
                            );
                        });

                        if (newText !== oldText) {
                            $(current).html(newText);
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