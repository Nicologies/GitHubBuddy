## Introduction

GitHubBuddy is your friend to help 

- Review pull request using your preferred native difftool for example BeyondCompare
- Convert text in pull request or commit title to hyperlink, more specifically it can convert text like JIRA-178 in the pull request to a hyperlink with the target of https://JIRAServer/Browser/JIRA-178
- Make github full screen wide
- Disable the merge button if the pull request is labelled as `Do Not Merge` (customisable)

## How to Install and Configure

Currently, it only supports FireFox and Chrome on a Windows system. You can follow the below steps to install it:

### Install

- Install the [Chrome Extension](https://chrome.google.com/webstore/detail/githubbuddy/lbnnpglihcnokkjnmidginaihnojkfoo) or Firefox extension
- [Install a native app](https://github.com/Nicologies/GitHubBuddyHost/wiki/Installing-GitHubBuddyHost) to help launch the difftool

### Configure

#### GitHub Token

You will need to [create a personal access token](https://github.com/settings/tokens/new) with repo permission for this extension so it can retrieve the diff from github on your behalf.

#### Diff Tool Full Path

This is the full path to the difftool you want to use for example: `C:\Program Files (x86)\Beyond Compare 3\BCompare.exe`

Customisation of the argument will be supported shortly

#### Do Not Merge Label

This is a pull request label name, by default is `Do Not Merge`.

The extension will disable the Merge Button if the pull request is labelled as `Do Not Merge` (or the one you specified).


#### Text to Hyperlink

This is a feature to convert text to hyperlink. More specifically convert Issue to the link to an external system such as TFS, JIRA, Trac. Of course you could possibly use it to do something else as well.

See [here](https://github.com/Nicologies/GitHubBuddyHost/wiki/Text-to-Link-Configuration) for the instructions to configure it.
