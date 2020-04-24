import { App } from "./lib/SPA";
import { SetupPage } from "./pages";
import { LoadingOverlay, PrintingOverlay } from "./screens";

/**
 * A contactless checkin application
 */
export class ContactlessCheckinApp extends App {

    /**
     * Creates a new ContactlessCheckinApp
     * @param appRoot The root HTML element for the app
     */
    constructor(appRoot: HTMLElement) {

        super(appRoot);

        this.registerPageTypes(SetupPage);
        this.registerOverlayTypes(LoadingOverlay, PrintingOverlay);

        this.setHomePageType(SetupPage);
        this.setLoadingOverlayType(LoadingOverlay);

    }

}
