import assert from 'assert'
import Log from './utils/Log';
import preloadTemplates from './PreloadTemplates';
import { registerSettings, getSetting, Setting, CopyMode } from './utils/Settings';

/**
 * Returns a slug for the specified title. Up to 48 characters will be returned for brevity.
 * 'Character Name' -> Character-Name
 * "Someone's Journal" -> Someones-Journal
 * @param title the title
 * @return the slug
 */
function createSlug(title: string): string {
    return title.trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-zA-Z0-9-]+/gi, '')
        .slice(0, 48)
        .replace(/-$/g, '');
}

/**
 * Sets the UUID in the current history node.
 * @param uuid the UUID
 * @param title the title
 */
function setUuid(uuid: string, title: string): void {
    if (uuid) {
        let query: string = `?@=${encodeURIComponent(uuid)}`;
        if (getSetting(Setting.USE_SLUG)) {
            const slug: string = createSlug(title || '');
            query += (slug ? '#' + encodeURIComponent(slug) : '');
        }
        window.history.replaceState({}, '', query);
    }
}

/**
 * Options for copying a UUID.
 */
interface CopyUuidOptions {
    /** The type of ID. */
    type: 'id'|'uuid'|'url';

    /** The ID being copied. If type is 'url' and this is undefined, will use window.location.href. */
    id?:  string;
}

/**
 * Copies the UUID to the clipboard if possible.
 * @param doc the document
 * @param options the options
 */
function copyUuid(object: Document, options: CopyUuidOptions): void {
    assert(game instanceof Game);

    if (options.type === 'url' && !options.id) {
        options.id = window.location.href;
    }

    const theGame: Game = game as Game;
    let mayBeSuccess: boolean = false;
    if ((theGame as any).clipboard?.copyPlainText && options.id) {
        // Added in Foundry 10.286.
        (theGame as any).clipboard.copyPlainText(options.id!);
        mayBeSuccess = true;
    } else if (navigator?.clipboard?.writeText && options.id) {
        // Requires TLS or localhost.
        try {
            navigator.clipboard.writeText(options.id!);
            mayBeSuccess = true;
        } catch {}
    }

    if (object && mayBeSuccess) {
        // Pop a notification if possible.
        const label: string = theGame.i18n.localize((object.constructor as any).metadata?.label || '');
        if (label) {
            ui?.notifications?.info(theGame.i18n.format('DOCUMENT.IdCopiedClipboard', {label, ...options}));
        }
    }
}

Hooks.once('init', async () => {
    registerSettings();
    await preloadTemplates();
});

Hooks.once('setup', () => {
    // Fix a foundry bug involving query params and the classname of the body element.
    document.body.classList.replace(`game${window.location.search}`, 'game');
});

Hooks.once('ready', async () => {
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
        class: 'permalink-button',
        icon: 'fas fa-link',
        onclick: () => {
            // Ensure that the current URL is correct before copying it.
            setUuid(sheet.object.uuid, sheet.title);
            copyUuid(sheet.object, {type: 'url'});
        }
    });
};

/* XXX: is this all of them? */
Hooks.on('getDocumentSheetHeaderButtons', callback);
Hooks.on('getItemSheetHeaderButtons', callback);
Hooks.on('getActorSheetHeaderButtons', callback);
Hooks.on('getCardStackSheetHeaderButtons', callback);
Hooks.on('getSceneSheetHeaderButtons', callback);
Hooks.on('getCompendiumCollectionSheetHeaderButtons', callback);

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
        // Replace this node so we can modify its event listeners.
        const newNode: Node = node.cloneNode(true);
        node.parentNode!.replaceChild(newNode, node);
        node = newNode;

        node.addEventListener('click', (event: Event) => {
            event.preventDefault();
            setUuid(this.object.uuid, this.title);
            if (copyMode === CopyMode.OVERRIDE_COPY_ID
                || copyMode === CopyMode.SHIFT_OVERRIDE_COPY_ID && (event as KeyboardEvent).shiftKey) {
                copyUuid(this.object, {type: 'url'});
            } else {
                copyUuid(this.object, {type: 'id', id: this.object.id});
            }
        });
        node.addEventListener('contextmenu', (event: Event) => {
            event.preventDefault();
            setUuid(this.object.uuid, this.title);
            if (copyMode === CopyMode.OVERRIDE_COPY_ID
                || copyMode === CopyMode.SHIFT_OVERRIDE_COPY_ID && (event as KeyboardEvent).shiftKey) {
                copyUuid(this.object, {type: 'url'});
            } else {
                copyUuid(this.object, {type: 'uuid', id: this.object.uuid});
            }
        });
    }

    setUuid(this.object.uuid, this.title);

    return ret;
};
