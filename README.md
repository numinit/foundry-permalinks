# FoundryVTT Permalinks

![](https://raw.githubusercontent.com/numinit/foundry-permalinks/master/img/permalinks.png)

[Manifest URL](https://raw.githubusercontent.com/numinit/foundry-permalinks/master/src/module.json)

**TL;DR:** When you open a window that can have a permalink generated, the window's URL
is replaced with the link. Clicking the "Copy document id" link copies the permalink
to the clipboard if possible, rather than the ID.

**Supported versions**: Requires Foundry 10 to work.

Developed for [Meadiocrity Mead](https://www.meadiocritymead.com/) and [Battlemage Brewery](https://www.battlemagebrewing.com/) in Vista, CA.

## Known issues

Login trashes the permalink. :-(

Unfortunately, I can't run code on the login page.
I try to detect if the referring page had a permalink in it though -
unfortunately all query parameters are thrown out on the redirect
from /game to /join. This will require a Foundry VTT backend change to fix.
