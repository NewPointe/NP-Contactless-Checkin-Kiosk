import { App } from "./App";
import { NavigationData } from "./NavigationService";

export type ScreenRenderResult = HTMLElement | DocumentFragment | Promise<HTMLElement | DocumentFragment>;

/**
 * A screen type.
 */
export interface ScreenType<T extends App> {

    /**
     * The type id of the screen.
     */
    typeId: string;

    /**
     * Creates a new screen.
     */
    new (app: T): Screen;

}

/**
 * A screen that can be rendered to the DOM.
 */
export interface Screen {

    /**
     * Runs when the screen is loaded.
     * @param navigationData The navigation data that was passed to the screen.
     */
    onload(navigationData?: NavigationData | null): void | Promise<void>;

    /**
     * Runs when the screen is unloaded. In some cases, you can return `false` to abort the navigation.
     */
    onunload(): boolean | void | Promise<boolean | void>;

    /**
     * Renders the content of the screen and returns a `DocumentFragment` with the content to display.
     */
    render(): ScreenRenderResult;

}

/**
 * A loading screen that can be rendered to the DOM.
 */
export interface LoadingScreen extends Screen {

    /**
     * Sets the status text to show on the screen.
     * @param text The ststus text.
     */
    setStatusText(text: string): void;

}
