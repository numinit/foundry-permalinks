# FoundryVTT Permalinks

![](https://raw.githubusercontent.com/numinit/foundry-permalinks/master/img/actor.png)

![](https://raw.githubusercontent.com/numinit/foundry-permalinks/master/img/item.png)

![](https://raw.githubusercontent.com/numinit/foundry-permalinks/master/img/journal.png)

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

Or, a full [NixOS](https://nixos.org) config:

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
