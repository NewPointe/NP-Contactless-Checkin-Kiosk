import { App } from "./App";
import { NavigationService, NavigationState } from "./NavigationService";

/**
 * A Navigation Service that uses the browser's built-in navigation system.
 */
export class BrowserNavigationService<TApp extends App> implements NavigationService {

    private hadInitialPop = false;

    private app: TApp;

    constructor(app: TApp) {

        this.app = app;

        // Add relevant event listeners
        window.addEventListener("popstate", this.OnWindowPopState.bind(this));
        window.addEventListener("load", this.OnWindowLoad.bind(this));

        // If the window already loaded, fire the load event now
        if (performance.timing.loadEventEnd || document.readyState === "complete") this.OnWindowLoad();

    }

    public navigateBackward(): void {
        window.history.back();
    }

    public navigateForward(): void {
        window.history.forward();
    }

    public pushState(state: NavigationState): void {
        window.history.pushState(state, "", `#/${state.pageTypeId}`);
    }

    public replaceState(state: NavigationState): void {
        window.history.replaceState(state, "", `#/${state.pageTypeId}`);
    }

    protected OnWindowPopState(e: PopStateEvent): void {
        this.hadInitialPop = true;
        this.app.loadPageFromSavedState(e.state as NavigationState | null);
    }

    protected OnWindowLoad(): void {
        if (!this.hadInitialPop) {

            this.hadInitialPop = true;
            this.app.loadPageFromSavedState(window.history.state as NavigationState | null);

        }
    }

}
