import { LoadingScreen, NavigationData, ScreenRenderResult } from "../lib/SPA";
import { Tag } from "../lib/TagBuilder";

export class PrintingOverlay implements LoadingScreen {
    public static readonly typeId = "printing";
    setStatusText(_: string): void {
        //
    }
    onload(_?: NavigationData | null | undefined): void | Promise<void> {
        //
    }
    onunload(): boolean | void | Promise<boolean | void> {
        //
    }
    render(): ScreenRenderResult {
        return new Tag("div")
            .classes("fill-parent flex flex-center spinner-backdrop")
            .content(
                new Tag("div")
                    .classes("bg-white flex flex-column flex-center")
                    .attribute("style", "width: 75vh; height: 75vh;")
                    .content(
                        Tag.img("assets/images/printing.svg"),
                        Tag.h1("Printing...")
                    )
            ).get();
    }

}
