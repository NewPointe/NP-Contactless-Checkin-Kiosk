import { Screen, NavigationData, ScreenRenderResult } from "../lib/SPA";
import { Tag } from "../lib/TagBuilder";
import { QrCameraService } from "../services/QrCameraService";
import { ContactlessCheckinApp } from "../ContactlessCheckinApp";
import { QRCode } from "jsqr";
import { SimpleEvent } from "../lib/SimpleEventEmitter";
import { sleep } from "../lib/Util";

export class SetupPage implements Screen {

    public static readonly typeId = "setup";

    private qrService = new QrCameraService();
    private qrVideo = this.qrService.getVideo();
    private qrOverlay = this.qrService.getOverlayCanvas();
    private app: ContactlessCheckinApp;

    constructor(app: ContactlessCheckinApp) {
        this.app = app;
        this.qrService.on("scan", this.OnQrScan.bind(this));
    }

    private async OnQrScan(event: SimpleEvent<"scan", QRCode>): Promise<void> {
        this.qrService.pause();
        const printingScreen = await this.app.addOverlay("printing");
        await sleep(4000);
        await this.app.removeOverlay(printingScreen);
        this.qrService.resume();
    }

    async onload(_?: NavigationData | null | undefined): Promise<void> {
        this.qrService.start();
    }

    onunload(): boolean | void | Promise<boolean | void> {
        this.qrService.stop();
    }

    render(): ScreenRenderResult {

        return new Tag("div")
            .classes("fill-parent grid grid-equal-columns bg-white")
            .content(
                new Tag("div")
                    .classes("flex flex-column padding-3 divider-right")
                    .content(
                        Tag.h2("Step 1: Check in on your phone.").classes("text-center"),
                        new Tag("div")
                            .classes("fill-parent flex flex-center")
                            .content(
                                Tag.img("assets/images/phone-checkin.svg")
                            )
                    ),
                new Tag("div")
                    .classes("flex flex-column padding-3")
                    .content(
                        Tag.h2("Step 2: Scan to print check-in tags.").classes("text-center"),
                        new Tag("div")
                            .classes("fill-parent overlay-container")
                            .content(
                                new Tag("div")
                                    .classes("fill-parent overlay flex flex-center")
                                    .content(
                                        new Tag(this.qrVideo).classes("scanner-border")
                                    ),
                                new Tag("div")
                                    .classes("fill-parent overlay flex flex-center")
                                    .content(
                                        new Tag(this.qrOverlay).classes("scanner-border")
                                    )
                            )
                    )
            )
            .get();
    }

}
