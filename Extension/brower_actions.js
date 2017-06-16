function onPageLoaded(){
    document.getElementById("js-open-options").addEventListener('click', openOptionsPage);
}
function openOptionsPage() {
    chrome.runtime.openOptionsPage();
}
document.addEventListener('DOMContentLoaded', onPageLoaded);