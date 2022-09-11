import Log from "./utils/Log";
import preloadTemplates from "./PreloadTemplates";
import { registerSettings } from "./utils/Settings";

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
     * Returns a slug for the specified title. Up to 32 characters will be returned for brevity.
     * 'Character Name' -> Character-Name
     * "Someone's Journal" -> Someones-Journal
     * @param title the title
     * @return the slug
     */
    function createSlug(title: string): string {
        return title.trim().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]+/gi, '').slice(0, 32).replace(/-$/g, '');
    }

    /**
     * Sets the UUID in the current history node.
     * @param uuid the UUID
     * @param title the title
     */
    function setUuid(uuid: string, title: string): void {
        const slug: string = createSlug(title);
        window.history.replaceState({}, '', `?@=${encodeURIComponent(uuid)}${slug ? '#' + encodeURIComponent(slug) : ''}`);
    }

    /**
     * Copies the UUID to the clipboard if possible.
     * @param uuid the UUID
     */
    function copyUuid(uuid: string): void {
        if (navigator?.clipboard?.writeText) {
            navigator.clipboard.writeText(window.location.href);
        }
    }

    const ret: any = originalDocumentIdLink.call(this, html);
    const idLink = html.find('.document-id-link');

    if (idLink) {
        const node: HTMLElement = idLink.get(0)!;
        const newNode: Node = node.cloneNode(true);
        newNode.addEventListener('click', (event: Event) => {
            event.preventDefault();
            setUuid(this.object.uuid, this.title);
            copyUuid(this.object.uuid);
        });
        newNode.addEventListener('contextmenu', (event: Event) => {
            event.preventDefault();
            setUuid(this.object.uuid, this.title);
            copyUuid(this.object.uuid);
        });
        node.parentNode!.replaceChild(newNode, node);

        setUuid(this.object.uuid, this.title);
    }

    return ret;
};
