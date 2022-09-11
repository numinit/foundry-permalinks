# FoundryVTT Permalinks

![](https://raw.githubusercontent.com/numinit/foundry-permalinks/master/img/permalinks.png)

When you open a window that can have a permalink generated, the window's URL
is replaced with the link.

Requires Foundry 10.

Clicking the "Copy document id" link copies the permalink to the clipboard
if possible, rather than the ID.

[Manifest URL](https://raw.githubusercontent.com/numinit/foundry-permalinks/master/src/module.json)

## Known issues

Login trashes the permalink. Unfortunately, I can't run code on the
login page. I try to detect if the referring page had a permalink in it
though - unfortunately all GET parameters are thrown out on the redirect
from /game to /join. This will require a Foundry VTT backend change to fix.
