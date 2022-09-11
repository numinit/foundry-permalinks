import Log from "./utils/Log";
import preloadTemplates from "./PreloadTemplates";
import { registerSettings, getSetting, Setting } from "./utils/Settings";

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

// Hook _createDocumentIdLink.
const originalDocumentIdLink = (DocumentSheet.prototype as any)._createDocumentIdLink;
(DocumentSheet.prototype as any)._createDocumentIdLink = function(html: JQuery) {
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
     */
    function copyUuid(): void {
        if (navigator?.clipboard?.writeText) {
            navigator.clipboard.writeText(window.location.href);
        }
    }

    const ret: any = originalDocumentIdLink.call(this, html);
    const idLink = html.find('.document-id-link');

    if (idLink) {
        let node: Node = idLink.get(0)!;
        const overrideCopyId: boolean = getSetting(Setting.OVERRIDE_COPY_ID);
        if (overrideCopyId) {
            const newNode: Node = node.cloneNode(true);
            node.parentNode!.replaceChild(newNode, node);
            node = newNode;
        }

        node.addEventListener('click', (event: Event) => {
            setUuid(this.object.uuid, this.title);
            if (overrideCopyId) {
                event.preventDefault();
                copyUuid();
            }
        });
        node.addEventListener('contextmenu', (event: Event) => {
            setUuid(this.object.uuid, this.title);
            if (overrideCopyId) {
                event.preventDefault();
                copyUuid();
            }
        });

        setUuid(this.object.uuid, this.title);
    }

    return ret;
};
