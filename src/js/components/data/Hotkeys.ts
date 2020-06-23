import { Danbooru } from "../api/Danbooru";
import { Page, PageDefintion } from "./Page";

const validKeys = [
    "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "+", "=", ".", ",", "/", "*",
    "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z",
    "escape", "ctrl", "alt", "shift", "return",
    "up", "down", "left", "right",
];

/**
 * Manages the keyboard shortcuts for the entire project.  
 * Any module that uses hotkeys needs to call this instead.
 */
export class Hotkeys {

    private static instance: Hotkeys;
    private listeners: string[] = [];

    private static enabled = true;

    private constructor() {
        Danbooru.Utility.disableShortcuts(true);

        if (Page.matches(PageDefintion.post)
            && $("section#image-container").attr("data-file-ext") === "swf")
            Hotkeys.enabled = false;
    }

    private static getInstance(): Hotkeys {
        if (this.instance === undefined) this.instance = new Hotkeys();
        return this.instance;
    }

    public static recordSingleKeypress(callback: Function): void {
        $("body").attr("data-recording-hotkey", "true");
        let keys = [];

        $(document).on("keydown.re621.record", (event) => {
            const key = event.key
                .toLowerCase()
                .replace(/enter/g, "return")
                .replace(/control/g, "ctrl")
                .replace(/arrow/g, "");
            if (validKeys.indexOf(key) == -1) return;
            keys.push(key);
        });

        $(document).on("keyup.re621.record", () => {
            if (keys.length !== 0) {
                $(document).off(".re621.record");
                callback(keys.join("+"));
                $("body").attr("data-recording-hotkey", "false");
                return;
            }
            keys = [];
        });
    }

    /** Returns a list of currently bound keys  */
    private static getListeners(): string[] {
        return this.getInstance().listeners;
    }

    /** Returns true of the specified key is bound, false otherwise */
    public static isRegistered(key: string): boolean {
        return this.getInstance().listeners.indexOf(key) != -1;
    }

    /**
     * Registers the specified key to trigger the provided function
     * @param key Key to bind
     * @param fn Function to execute on keypress
     */
    public static register(key: string, fn: Function, element?: JQuery<HTMLElement> | JQuery<Document>, selector?: string): boolean {
        if (element === undefined) element = $(document);
        if (selector === undefined) selector = null;

        this.unregister(key, element);
        element.on("keydown.re621.hotkey-" + key, selector, key, function (event) {
            if (!Hotkeys.enabled || $("body").attr("data-recording-hotkey") === "true") return false;
            fn(event, key);
        });
        this.getListeners().push(key);
        return true;
    }

    /**
     * Unbinds the specified key from its current function
     * @param key Key to inbind
     */
    public static unregister(key: string, element: JQuery<HTMLElement> | JQuery<Document> = $(document)): boolean {
        if (!this.isRegistered(key)) { return false; }
        $(element).off("keydown.re621.hotkey-" + key);
        this.getInstance().listeners = this.getListeners().filter(e => e !== key);
        return true;
    }
}
