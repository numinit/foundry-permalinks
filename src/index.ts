import Log from "./utils/Log";
import preloadTemplates from "./PreloadTemplates";
import { registerSettings, getSetting, Setting, CopyMode } from "./utils/Settings";

/**
 * Returns a slug for the specified title. Up to 48 characters will be returned for brevity.
 * 'Character Name' -> Character-Name
 * "Someone's Journal" -> Someones-Journal
 * @param title the title
 * @return the slug
 */
function createSlug(title: string): string {
    return title.trim().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]+/gi, '').slice(0, 48).replace(/-$/g, '');
}

/**
 * Sets the UUID in the current history node.
 * @param uuid the UUID
 * @param title the title
 */
function setUuid(uuid: string, title: string): void {
    let query: string = `?@=${encodeURIComponent(uuid)}`;
    if (getSetting(Setting.USE_SLUG)) {
        const slug: string = createSlug(title);
        query += (slug ? '#' + encodeURIComponent(slug) : '');
    }
    window.history.replaceState({}, '', query);
}

/**
 * Copies the UUID to the clipboard if possible.
 * @param uuid the uuid to copy instead of window.location.href
 */
function copyUuid(uuid?: string): void {
    if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(uuid || window.location.href);
    }
}

Hooks.once("init", async () => {
    registerSettings();
    await preloadTemplates();
});

Hooks.once("setup", () => {
    // Fix a foundry bug involving query params and the classname of the body element.
    document.body.classList.replace(`game${window.location.search}`, 'game');
});

Hooks.once("ready", async () => {
    /**
     * Extracts the UUID from a URLSearchParams.
     * @param params the params
     * @return the UUID or null
     */
    function extractUuid(params: URLSearchParams): string|null {
        return params.get('@') || null;
    }

    let uuid: string|null = null;

    if (window.location.search) {
        uuid = extractUuid(new URLSearchParams(window.location.search));
    }

    if (!uuid && document.referrer) {
        const referrerUrl: URL = new URL(document.referrer);
        if (referrerUrl.search) {
            uuid = extractUuid(new URLSearchParams(referrerUrl.search));
        }
    }

    if (uuid) {
        Log.i(`Navigating to UUID: ${uuid}`);
        const doc: any = await fromUuid(uuid);
        doc?._onClickDocumentLink(new Event('ready'));
    }
});

/**
 * Callback for adding buttons to documents, items, and actors.
 * @param sheet the sheet
 * @param buttons the buttons
 */
const callback = (sheet: any, buttons: any) => {
    const copyMode: CopyMode = getSetting(Setting.COPY_MODE);
    if (copyMode !== CopyMode.NEW_BUTTON) {
        return;
    }

    buttons.unshift({
        label: getSetting(Setting.BUTTON_HINT_TEXT) || '',
        icon: "fas fa-link",
        onclick: () => {
            // Ensure that the URL is correct before copying.
            setUuid(sheet.object.uuid, sheet.title);
            copyUuid();
        }
    });
};

Hooks.on("getDocumentSheetHeaderButtons", callback);
Hooks.on("getItemSheetHeaderButtons", callback);
Hooks.on("getActorSheetHeaderButtons", callback);
Hooks.on("getCardStackSheetHeaderButtons", callback);
Hooks.on("getSceneSheetHeaderButtons", callback);
Hooks.on("getCompendiumCollectionSheetHeaderButtons", callback);

const originalDocumentIdLink = (DocumentSheet.prototype as any)._createDocumentIdLink;

/**
 * Creates the document ID link.
 * @param html the HTML
 */
(DocumentSheet.prototype as any)._createDocumentIdLink = function(html: JQuery) {
    const ret: any = originalDocumentIdLink.call(this, html);

    const copyMode: CopyMode = getSetting(Setting.COPY_MODE);
    let node: Node | undefined = html.find('.document-id-link')?.get(0);
    if (node) {
        if (copyMode === CopyMode.OVERRIDE_COPY_ID
            || copyMode === CopyMode.SHIFT_OVERRIDE_COPY_ID) {
            const newNode: Node = node.cloneNode(true);
            node.parentNode!.replaceChild(newNode, node);
            node = newNode;
        }

        node.addEventListener('click', (event: Event) => {
            setUuid(this.object.uuid, this.title);
            if (copyMode === CopyMode.OVERRIDE_COPY_ID
                || copyMode === CopyMode.SHIFT_OVERRIDE_COPY_ID && (event as KeyboardEvent).shiftKey) {
                event.preventDefault();
                copyUuid();
            } else {
                copyUuid(this.object.uuid);
            }
        });
        node.addEventListener('contextmenu', (event: Event) => {
            setUuid(this.object.uuid, this.title);
            if (copyMode === CopyMode.OVERRIDE_COPY_ID
                || copyMode === CopyMode.SHIFT_OVERRIDE_COPY_ID) {
                event.preventDefault();
                copyUuid();
            } else {
                copyUuid(this.object.uuid);
            }
        });

        setUuid(this.object.uuid, this.title);
    }

    return ret;
};
