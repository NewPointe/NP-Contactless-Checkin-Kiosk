import { Screen } from "./Screen";
import { applyAutofocus, clearChildNodes, toCssClass } from "./Util";

/**
 * Manages the display of a stack of screens within the DOM.
 */
export interface ScreenStackManager<TScreen extends Screen> {

    /**
     * Adds a screen to the top of the stack. If the screen is already in the stack, it is moved to the top.
     * @param screen The screen to add.
     */
    add(screen: TScreen): Promise<void>;

    /**
     * Removes a screen from the stack.
     * @param screen The screen to remove.
     */
    remove(screen: TScreen): void;

    /**
     * Checks if the stack contains the given screen.
     * @param screen The screen to check.
     */
    has(screen: TScreen): boolean;

    /**
     * Clears all screens from the stack.
     */
    clear(): void;

    /**
     * Gets an array of all screens on the stack.
     */
    getAll(): TScreen[];

}

/**
 * Manages the display of a stack of screens within the DOM.
 */
export class DefaultScreenStackManager<TScreen extends Screen> implements ScreenStackManager<TScreen> {

    /**
     * The parent element of the Screen Stack Manager.
     */
    private parent: HTMLElement;

    /**
     *  The root element of the Screen Stack Manager.
     */
    private root: HTMLElement;

    /**
     * A map of active screens to their DOM node.
     */
    private activeScreenMap = new Map<TScreen, HTMLElement>();

    /**
     * The type of screen.
     */
    private screenType: string;

    constructor(parent: HTMLElement, screenType: string) {

        // Save the parent
        this.parent = parent;

        // Save the screenType
        this.screenType = screenType;

        // Setup the screen root
        this.root = document.createElement("div");
        this.root.hidden = true;
        this.root.classList.add(`${toCssClass(this.screenType)}s-root`);
        this.parent.appendChild(this.root);

    }

    public async add(screen: TScreen): Promise<void> {

        // See if the screen is already added
        let screenRoot = this.activeScreenMap.get(screen);

        // If it is, remove it so we can re-add it on the top
        if (screenRoot) {

            // Remove the screen's root from the DOM
            this.root.removeChild(screenRoot);

            // Remove the screen from the screen map
            this.activeScreenMap.delete(screen);

        }
        else {

            // Render the screen's content
            let content = await screen.render();

            // If the content is a document fragment, wrap it in a div.
            if (content instanceof DocumentFragment) {

                // Create a root for the overlay's content
                const wrappedContent = document.createElement("div");

                // Append the content
                wrappedContent.appendChild(content);

                content = wrappedContent;

            }

            // Add the default classes
            content.classList.add(`${toCssClass(this.screenType)}-instance`);

            // Append the content
            screenRoot = content;

        }

        this.root.hidden = false;

        // Add the screen's root to the DOM
        this.root.appendChild(screenRoot);

        // Apply autofocus since some browsers don't do it for us.
        applyAutofocus(screenRoot);

        // Add the screen to the screen map
        this.activeScreenMap.set(screen, screenRoot);

    }

    public remove(screen: TScreen): void {

        // Get the screen's root element
        const screenRoot = this.activeScreenMap.get(screen);
        if (screenRoot) {

            // Remove the screen's root from the DOM
            this.root.removeChild(screenRoot);

            // Remove the screen from the screen map
            this.activeScreenMap.delete(screen);

            if(this.activeScreenMap.size === 0) {
                this.root.hidden = true;
            }

        }

    }

    public has(screen: TScreen): boolean {
        return this.activeScreenMap.has(screen);
    }

    public async clear(): Promise<void> {

        // Clear all screen nodes from the DOM
        clearChildNodes(this.root);

        // Reset the screen map
        this.activeScreenMap.clear();

    }

    public getAll(): TScreen[] {
        return Array.from(this.activeScreenMap.keys());
    }

}
