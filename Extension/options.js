// Saves options to chrome.storage
function save_options() {
  var token = document.getElementById('githubtoken').value;
  var path = document.getElementById('difftoolpath').value;
  chrome.storage.local.set({
    githubtoken: token,
    difftoolpath: path
  }, function() {
    // Update status to let user know options were saved.
    var status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(function() {
      status.textContent = '';
    }, 750);
  });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {  
  chrome.storage.local.get({
    githubtoken: '',
    difftoolpath: ''
  }, function(items) {
    document.getElementById('difftoolpath').value = items.difftoolpath;
    document.getElementById('githubtoken').value = items.githubtoken;
  });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click',
    save_options);