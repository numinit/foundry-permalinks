import assert from "assert"
import Globals from "../Globals";
import Log from "./Log";

export enum CopyMode {
    NONE = 'none',
    OVERRIDE_COPY_ID = 'overrideCopyId',
    SHIFT_OVERRIDE_COPY_ID = 'shiftOverrideCopyId',
    NEW_BUTTON = 'newButton'
}

class Settings {
    readonly settingsMap: Map<Setting, ClientSettings.PartialSetting> = new Map([
        [
            Setting.COPY_MODE,
            {
                name: 'Copy Mode',
                scope: 'client',
                type: String,
                hint: 'Configure the mode for copying permalinks. Only applies to your user.',
                config: true,
                choices: {
                    [CopyMode.NONE]: 'None',
                    [CopyMode.OVERRIDE_COPY_ID]: 'Override Copy ID',
                    [CopyMode.SHIFT_OVERRIDE_COPY_ID]: 'Shift + Copy ID',
                    [CopyMode.NEW_BUTTON]: 'New Button'
                },
                default: CopyMode.OVERRIDE_COPY_ID
            }
        ],
        [
            Setting.OVERRIDE_COPY_ID,
            {
                name: 'Override Copy ID',
                scope: 'client',
                type: Boolean,
                hint: 'Override the Copy ID button to copy a permalink instead. Just applies to your user. Deprecated.',
                config: false,
                default: false
            }
        ],
        [
            Setting.USE_SLUG,
            {
                name: 'Use slugs',
                scope: 'world',
                type: Boolean,
                hint: 'Add a slug (e.g. #Short-Page-Title) to permalinks. Applies to the entire world.',
                config: true,
                default: true
            }
        ]
    ]);

    readonly settingValues: Map<Setting, any> = new Map();

    readonly game: Game;

    private settingsRegistered = false;

    private constructor() {
        Log.i("Loading configuration settings.");
        assert(game instanceof Game);
        this.game = game as Game;
    }

    private static instance: Settings;

    public static getInstance(): Settings {
        if (Settings.instance) {
            return Settings.instance;
        }

        Settings.instance = new Settings();
        return Settings.instance;
    }

    public registerSettings(): void {
        if (this.settingsRegistered) {
            return;
        }

        this.settingsMap.forEach((value, key) => {
            // Register the on-change listener.
            value.onChange = (settingValue: any) => {
                Log.i(`Setting ${key} changed to ${JSON.stringify(settingValue)}`);
                this.settingValues.set(key, settingValue);
            };
            this.game.settings.register(Globals.ModuleName, key, value);

            // Populate the initial value based on the default.
            let initialValue = this.game.settings.get(Globals.ModuleName, key);
            if (initialValue === undefined || initialValue === null) {
                initialValue = value.default;
            }
            this.settingValues.set(key, initialValue);

            Log.i(`Setting ${key} registered with initial value ${JSON.stringify(initialValue)}`);
        });

        this.migrateSettings();
        this.settingsRegistered = true;
    }

    /**
     * Migrates settings.
     */
    private migrateSettings(): void {
        const overrideCopyId: boolean = getSetting(Setting.OVERRIDE_COPY_ID);
        if (overrideCopyId) {
            // Migrate OVERRIDE_COPY_ID to COPY_MODE.
            putSetting(Setting.COPY_MODE, CopyMode.OVERRIDE_COPY_ID);
            putSetting(Setting.OVERRIDE_COPY_ID, false);
        }
    }
}

/**
 * Registers settings.
 */
export const registerSettings = (): void => Settings.getInstance().registerSettings();

/**
 * Valid settings.
 */
export enum Setting {
    COPY_MODE = 'copyMode',
    /** @deprecated use COPY_MODE instead */
    OVERRIDE_COPY_ID = 'overrideCopyId',
    USE_SLUG = 'useSlug'
}

/**
 * Gets a setting.
 * @param setting the setting
 */
export const getSetting = <T>(setting: Setting): T => {
    const settings = Settings.getInstance();
    if (settings.settingValues.has(setting)) {
        return settings.settingValues.get(setting)! as unknown as T;
    } else if (settings.settingsMap.has(setting)) {
        return settings.settingsMap.get(setting)!.default as unknown as T;
    } else {
        throw new Error(`invalid setting: ${setting}`);
    }
}

/**
 * Puts a setting.
 * @param setting the setting
 * @param value the value
 */
export const putSetting = <T>(setting: Setting, value: T): void => {
    const settings = Settings.getInstance();
    settings.game.settings.set(Globals.ModuleName, setting, value);
}
