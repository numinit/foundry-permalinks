# FoundryVTT Permalinks

[Manifest URL](https://raw.githubusercontent.com/numinit/foundry-permalinks/master/src/module.json)

**TL;DR:** When you open a window that can have a permalink generated, the window's URL
is replaced with the link. Clicking the "Copy document id" link (top left of windows)
or the button (depending on configuration) copies the permalink to the clipboard if possible,
rather than the ID.

**Supported versions**: Requires Foundry 10 to work.

**License**: Version 1.1.1 and above is released under the MIT License.

Developed for [Meadiocrity Mead](https://www.meadiocritymead.com/) and [Battlemage Brewery](https://www.battlemagebrewing.com/) in Vista, CA.

## Screenshots

### Button hint set to "Permalink"

![](https://raw.githubusercontent.com/numinit/foundry-permalinks/master/img/spell-button.png)

### No hint text

![](https://raw.githubusercontent.com/numinit/foundry-permalinks/master/img/creature-button-empty.png)

### Generated URLs

![](https://raw.githubusercontent.com/numinit/foundry-permalinks/master/img/actor.png)

![](https://raw.githubusercontent.com/numinit/foundry-permalinks/master/img/item.png)

![](https://raw.githubusercontent.com/numinit/foundry-permalinks/master/img/journal.png)

## Changelog

### v1.1

- v1.1.1
    - Relicense under MIT License to allow code and standards reuse with Foundry VTT.
    - Allow users to change the "Permalink" text shown in Button mode.
        - Add setting `buttonHintText` (scope world, default 'Permalink').
    - Remove leftover class that caused issues when used with the PDF Sheet Export module.
- v1.1.0:
    - [#1](https://github.com/numinit/foundry-permalinks/pull/1): Exception could be thrown if the document ID link wasn't found.
    - Change default mode of operation to a new "Permalink" button:
        - Deprecate `overrideCopyId` setting
        - Add setting `copyMode` (scope user, default `newButton`). Options are `none`, `overrideCopyId`, `shiftOverrideCopyId`, and `newButton`.

### v1.0

- v1.0.5: Fix issue where settings would not load on game launch.
- v1.0.4: Add settings: `useSlugs` (scope world, default true) and `overrideCopyId` (scope user, default true). These let you tune whether slugs should be enabled on a world basis, and whether individual users should default to the existing behavior of copying the ID instead of the permalink.
- v1.0.3: Increase max slug length to 48
- v1.0.2: Add slugs
- v1.0.1: Increase reliability of generating links
- v1.0.0: Initial release

## Known issues

- Login trashes the permalink. Unfortunately, I can't run code on the login page.
  I try to detect if the referring page had a permalink in it though -
  unfortunately all query parameters are thrown out on the redirect
  from /game to /join. This will require a Foundry VTT backend change to fix.
  An [issue](https://github.com/foundryvtt/foundryvtt/issues/8687) has been opened.
- Automatic copying with the clipboard may [only work over HTTPS connections](https://w3c.github.io/clipboard-apis/#dom-navigator-clipboard).

## Workaround if you're using nginx

If you're running a reverse proxy in front of Foundry, we can make it work.
The essence of the config is the following:

```nginx
location / {
        proxy_pass http://localhost:30000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
}
location /game {
        proxy_pass http://localhost:30000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;

        # If we're returning a 302 auth redirect from /game, pass the args
        proxy_intercept_errors on;
        error_page 302 = @join_redirect;
}
location @join_redirect {
        return 302 /join$is_args$args;
}

```

Or, a full [NixOS](https://nixos.org) config that requests a certificate via Let's Encrypt:

```nix
virtualHosts."foundry.example.com" = {
  http2 = true;
  enableACME = true;
  forceSSL = true;
  locations."/" = {
    proxyPass = "http://127.0.0.1:30000";
    proxyWebsockets = true;
  };
  locations."/game" = {
    proxyPass = "http://127.0.0.1:30000";
    proxyWebsockets = true;
    extraConfig = ''
      # If we're returning a 302 auth redirect from /game, pass the args
      proxy_intercept_errors on;
      error_page 302 = @join_redirect;
    '';
  };
  extraConfig = ''
    location @join_redirect {
      return 302 /join$is_args$args;
    }
  '';
};
```
