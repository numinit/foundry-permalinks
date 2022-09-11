import assert from "assert"
import Globals from "../Globals";
import Log from "./Log";

class Settings {
    readonly settingsMap: Map<Setting, ClientSettings.PartialSetting> = new Map([
        [
            Setting.OVERRIDE_COPY_ID,
            {
                name: 'Override Copy ID',
                scope: 'client',
                type: Boolean,
                hint: 'Override the Copy ID button to copy a permalink instead. Just applies to your user.',
                config: true,
                default: true
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

    private settingsRegistered = false;

    private constructor() {
        Log.i("Loading configuration settings.");
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

        assert(game instanceof Game);
        const g = game as Game;
        this.settingsMap.forEach((value, key) => {
            value.onChange = (settingValue: any) => {
                Log.i(`Setting ${key} changed to ${JSON.stringify(settingValue)}`);
                this.settingValues.set(key, settingValue);
            };
            g.settings.register(Globals.ModuleName, key, value);
        });

        this.settingsRegistered = true;
    }
}

export const registerSettings = (): void => Settings.getInstance().registerSettings();

export enum Setting {
    OVERRIDE_COPY_ID = 'overrideCopyId',
    USE_SLUG = 'useSlug'
}

export const getSetting = <T>(setting: Setting): T => {
    const settings = Settings.getInstance();
    if (settings.settingValues.has(setting)) {
        return settings.settingValues.get(setting)! as unknown as T;
    } else if (settings.settingsMap.has(setting)) {
        return settings.settingsMap.get(setting)!.default! as unknown as T;
    } else {
        throw new Error(`invalid setting: ${setting}`);
    }
}
