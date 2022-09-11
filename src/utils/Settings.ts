import assert from "assert"
import Globals, {Pair} from "../Globals";
import Log from "./Log";

class Settings {
	private constructor() {
		Log.i("Loading configuration settings.");
		this.settingsList = [];
	}

	private static instance: Settings;

	public static getInstance(): Settings {
		if (Settings.instance) {
			return Settings.instance;
        }

		Settings.instance = new Settings();
		return Settings.instance;
	}

	private settingsInit = false;
	public registerSettings(): void {
		if (this.settingsInit) {
			return;
        }

		assert(game instanceof Game);
		const g = game as Game;
		this.settingsList.forEach((item) => {
			g.settings.register(Globals.ModuleName, item[0], item[1]);
		});

		this.settingsInit = true;
	}

	readonly settingsList: ReadonlyArray<Pair<ClientSettings.PartialSetting>>;
}

export const registerSettings = (): void => Settings.getInstance().registerSettings();

export enum ValidSetting {
    PLACEHOLDER = 'placeholder'
}

export const getSetting = <T>(setting: ValidSetting): T | null => {
	const found = Settings.getInstance().settingsList.find(x => x[0] === setting);
	return found ? found[1] as unknown as T : null;
}
