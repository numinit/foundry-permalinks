import Globals from "../Globals";
import Color from "color";

class Log {
	// static class
	private constructor() {}

	private static getCurrentTime(): string {
		return `[${(new Date().toLocaleTimeString())}] `;
	}

	static write(str: string, colour: Color = Color("white"), bold = false): void {
		const time = toConsole(Log.getCurrentTime(), Color("gray"), false)
		const moduleName = toConsole(Globals.ModuleName + " ", Color("cyan"), true);
		const text = toConsole(str, colour, bold);
		console.log(time.str + moduleName.str + text.str, ...time.params.concat(moduleName.params, text.params));
	}

	static e(str: string): void {
		Log.write(str, Color("orange"));
	}

	static w(str: string): void {
		Log.write(str, Color("yellow"));
	}

	static i(str: string): void {
		Log.write(str, Color("green"));
	}
}

interface ConsoleColor {
	str: string,
	params: Array<string>;
}

const toConsole = (str: string, col: Color, bold: boolean): ConsoleColor => {
	return {
		str: `%c` + str + `%c`,
		params: [
			"color: " + col.hex() + ";" + (bold ? "font-weight: bold;" : ""),
			"color: unset; font-weight: unset;"
		]
	}
};

export default Log;
