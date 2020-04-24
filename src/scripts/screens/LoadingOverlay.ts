import { LoadingScreen, NavigationData, ScreenRenderResult } from "../lib/SPA";
import { Tag } from "../lib/TagBuilder";

export class LoadingOverlay implements LoadingScreen {

    public static readonly typeId = "loading";

    setStatusText(_: string): void {
        throw new Error("Method not implemented.");
    }

    onload(_?: NavigationData | null | undefined): void | Promise<void> {
        //
    }

    onunload(): boolean | void | Promise<boolean | void> {
        //
    }

    render(): ScreenRenderResult {
        return new Tag("div")
            .classes("flex flex-center fill-parent spinner-backdrop")
            .content(
                new Tag("div")
                    .classes("spinner")
                    .content(
                        Tag.div("rect1"),
                        Tag.div("rect2"),
                        Tag.div("rect3"),
                        Tag.div("rect4"),
                        Tag.div("rect5")
                    )
            ).get();
    }

}
