import { LoadingScreen, Screen, ScreenType } from "./Screen";

import { BrowserNavigationService } from "./BrowserNavigationService";
import { NavigationData, NavigationService, NavigationState } from "./NavigationService";
import { ScreenManager, DefaultScreenManager } from "./ScreenManager";
import { ScreenStackManager, DefaultScreenStackManager } from "./ScreenStackManager";
import { JobManager } from "./JobManager";

/**
 * The Router manages the state of Pages and Overlays inside an App.
 */
export class App {

    /** The navigation service that tracks the app's navigation state. */
    private navigationService: NavigationService;

    /** A map of registered page types. */
    private pageTypes: Map<string, ScreenType<this>> = new Map();

    /** A map of registered overlay types. */
    private overlayTypes: Map<string, ScreenType<this>> = new Map();

    /** The homepage type. */
    private homepageType?: ScreenType<this>;

    /** The loading overlay type. */
    private loadingOverlayType?: new (app: this) => LoadingScreen;

    /** The screen manager that manages overlays. */
    private overlaysManager: ScreenStackManager<Screen>;

    /** The screen manager that manages the current page. */
    private currentPageManager: ScreenManager<Screen>;

    /** The screen manager that manages the loading overlay. */
    private loadingOverlayManager: ScreenManager<LoadingScreen>;

    /** The element that holds the app. */
    private appRoot: HTMLElement;

    /** Helps manage potentially recursive async navigation requests. */
    private navigationJobManager = new JobManager();

    /**
     * Creates a new App.
     * @param appRoot The HTML element to attach this app to.
     */
    public constructor(appRoot: HTMLElement) {

        // Save the app root
        this.appRoot = appRoot;
        this.appRoot.classList.add("spa-app-root");

        // Create the default navigation service
        this.navigationService = new BrowserNavigationService(this);

        // Setup the screen managers
        this.currentPageManager = new DefaultScreenManager(this.appRoot, "spa-page");
        this.overlaysManager = new DefaultScreenStackManager(this.appRoot, "spa-overlay");
        this.loadingOverlayManager = new DefaultScreenManager(this.appRoot, "spa-loading");

    }
    public registerPageTypes(...pageTypes: Array<ScreenType<this>>): void {
        for (const pageType of pageTypes) {
            this.pageTypes.set(pageType.typeId, pageType);
        }
    }

    public registerOverlayTypes(...overlayTypes: Array<ScreenType<this>>): void {
        for (const overlayType of overlayTypes) {
            this.overlayTypes.set(overlayType.typeId, overlayType);
        }
    }

    public setLoadingOverlayType(overlayType: (new (app: this) => LoadingScreen)): void {
        this.loadingOverlayType = overlayType;
    }

    public setHomePageType(pageType: ScreenType<this>): void {
        this.homepageType = pageType;
    }

    public async showLoadingOverlay(loadingStatus?: string): Promise<void> {

        let loadingOverlay = this.loadingOverlayManager.get();

        // Start the loading overlay if it exists and isn't already active
        if (this.loadingOverlayType && !loadingOverlay) {

            // Create the loading overlay
            loadingOverlay = new this.loadingOverlayType(this);

            // Load it
            await loadingOverlay.onload();

            // Render it to the DOM
            this.loadingOverlayManager.set(loadingOverlay);

        }

        if (loadingOverlay && loadingStatus) loadingOverlay.setStatusText(loadingStatus);

    }

    public async hideLoadingOverlay(): Promise<void> {

        // Check if a loading overlay is active
        const loadingOverlay2 = this.loadingOverlayManager.get();
        if (loadingOverlay2) {

            // Unload it
            await loadingOverlay2.onunload();

            // Remove it from the DOM
            await this.loadingOverlayManager.clear();

        }

    }

    public setLoadingStatus(loadingStatus: string): void {
        const overlay = this.loadingOverlayManager.get();
        if (overlay) overlay.setStatusText(loadingStatus);
    }

    public async addOverlay(overlayTypeId: string, overlayData?: NavigationData): Promise<Screen> {

        // Get the Overlay Type
        const OverlayType = this.overlayTypes.get(overlayTypeId);
        if (OverlayType) {

            // Create a new instance of the overlay
            const overlay = new OverlayType(this);

            // Load the overlay
            await overlay.onload(overlayData);

            // Add it to the app
            this.overlaysManager.add(overlay);

            // Return the new overlay
            return overlay;

        }
        else {

            // Oops
            throw new Error(`Failed to add overlay: Could not find a registered overlay type with id '${overlayTypeId}'`);

        }

    }

    public async removeOverlay(overlay: Screen): Promise<void> {

        // If the overlay is active
        if (this.overlaysManager.has(overlay)) {

            // Unload the overlay
            await overlay.onunload();

            // Remove the overlay
            this.overlaysManager.remove(overlay);

        }

    }

    public async clearOverlays(): Promise<void> {

        // Get all the overlays from top to bottom
        const overlays = this.overlaysManager.getAll().reverse();

        // Unload them all
        for (const overlay of overlays) await overlay.onunload();

        // Clear them
        this.overlaysManager.clear();

    }

    public navigateBackward(): void {
        this.navigationService.navigateBackward();
    }

    public navigateForward(): void {
        this.navigationService.navigateForward();
    }

    public navigateTo(pageTypeId: string, navigationData?: NavigationData): Promise<void> {
        return this.doPageNavigation(pageTypeId, navigationData, false);
    }

    public navigateInPlace(pageTypeId: string, navigationData?: NavigationData): Promise<void> {
        return this.doPageNavigation(pageTypeId, navigationData, true);
    }

    public async loadPageFromSavedState(state: NavigationState | null): Promise<void> {
        if (state) this.doPageNavigation(state.pageTypeId, state.navigationData, true);
        else if (this.homepageType) this.doPageNavigation(this.homepageType, null, true);
    }

    private async doPageNavigation(
        pageTypeOrId: string | (ScreenType<this>),
        navigationData: NavigationData | null | undefined,
        replaceCurrent: boolean,
    ): Promise<void> {

        // Start the navigation
        const jobToken = this.navigationJobManager.startJob();
        try {

            // Get the new page type
            const PageType = typeof pageTypeOrId === "string" ? this.pageTypes.get(pageTypeOrId) : pageTypeOrId;

            // Make sure we got something
            if (!PageType) throw new Error(`Failed to load page: Could not find a registered page type with id '${pageTypeOrId}'`);

            // See if we have a current page
            const currentPage = this.currentPageManager.get();
            if (currentPage) {

                // Try to unload the page
                jobToken.isCanceled = await currentPage.onunload() === false;

                // If it wasn't canceled, remove the page from the DOM
                if (!jobToken.isCanceled) await this.currentPageManager.clear();
            }

            // Check canceled
            if (jobToken.isCanceled) return;

            // Remove all overlays
            await this.clearOverlays();

            // Check canceled
            if (jobToken.isCanceled) return;

            // Start the loading overlay if it exists and isn't already active
            await this.showLoadingOverlay();

            // Create the new page
            const page = new PageType(this);

            // Check canceled
            if (jobToken.isCanceled) return;

            // Load it
            await page.onload(navigationData);

            // Check canceled
            if (jobToken.isCanceled) return;

            // Tell the navigation service that we've changed pages
            this.navigationService[replaceCurrent ? "replaceState" : "pushState"]({
                navigationData,
                pageTypeId: PageType.typeId,
            });

            // Render the page to the DOM
            await this.currentPageManager.set(page);

            // Check canceled
            if (jobToken.isCanceled) return;

            // Hide the loading overlay
            await this.hideLoadingOverlay();

        }
        finally {

            // End the navigation
            this.navigationJobManager.endJob();

        }

    }

}
