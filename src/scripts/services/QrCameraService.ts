import jsQR, { QRCode } from "jsqr";
import { SimpleEventEmitter } from "../lib/SimpleEventEmitter";

interface QrEventDataMap {
    "scan": QRCode;
}

export class QrCameraService extends SimpleEventEmitter<QrEventDataMap> {
    private videoPlayer: HTMLVideoElement;
    private videoCanvas: HTMLCanvasElement;
    private overlayCanvas: HTMLCanvasElement;
    private videoCanvasContext: CanvasRenderingContext2D;
    private overlayCanvasContext: CanvasRenderingContext2D;
    private isRunningUpdates = false;
    constructor() {
        super();
        this.videoPlayer = document.createElement("video");
        this.videoPlayer.toggleAttribute("playsinline", true);
        this.videoPlayer.addEventListener("playing", this.OnPlaying.bind(this));
        this.videoCanvas = document.createElement("canvas");
        const videoCanvasContext = this.videoCanvas.getContext("2d");
        if (videoCanvasContext) {
            this.videoCanvasContext = videoCanvasContext;
        }
        else {
            throw new Error("Could not create QrCamera Service: Failed to open a 2d rendering context.");
        }
        this.overlayCanvas = document.createElement("canvas");
        const overlayCanvasContext = this.overlayCanvas.getContext("2d");
        if (overlayCanvasContext) {
            this.overlayCanvasContext = overlayCanvasContext;
        }
        else {
            throw new Error("Could not create QrCamera Service: Failed to open a 2d rendering context.");
        }
    }

    public async start(): Promise<void> {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "" } });
        this.videoPlayer.srcObject = mediaStream;
        this.videoPlayer.play();
    }

    private OnPlaying(_: Event): void {
        if(!this.isRunningUpdates) {
            this.isRunningUpdates = true;
            requestAnimationFrame().then(() => this.runUpdate());
        }
    }

    public stop(): void {
        this.videoPlayer.pause();
        this.videoPlayer.srcObject = null;
        this.isRunningUpdates = false;
    }

    public pause(): void {
        this.isRunningUpdates = false;
    }

    public resume(): void {
        if(!this.isRunningUpdates) {
            this.isRunningUpdates = true;
            requestAnimationFrame().then(() => this.runUpdate());
        }
    }

    public getVideo(): HTMLVideoElement {
        return this.videoPlayer;
    }

    public getVideoCanvas(): HTMLCanvasElement {
        return this.videoCanvas;
    }

    public getOverlayCanvas(): HTMLCanvasElement {
        return this.overlayCanvas;
    }

    private canRunUpdates(): boolean {
        return !this.videoPlayer.paused && this.isRunningUpdates;
    }

    private runUpdate(): void {
        if(this.canRunUpdates()) {

            // If the video player has enough data
            if(this.videoPlayer.readyState === this.videoPlayer.HAVE_ENOUGH_DATA) {

                // Update the canvas size
                if(this.videoCanvas.height != this.videoPlayer.videoHeight || this.videoCanvas.width != this.videoPlayer.videoWidth) {
                    this.videoCanvas.height = this.videoPlayer.videoHeight;
                    this.videoCanvas.width = this.videoPlayer.videoWidth;
                }
                if(this.overlayCanvas.height != this.videoPlayer.videoHeight || this.overlayCanvas.width != this.videoPlayer.videoWidth) {
                    this.overlayCanvas.height = this.videoPlayer.videoHeight;
                    this.overlayCanvas.width = this.videoPlayer.videoWidth;
                }

                // Draw the video frame
                this.videoCanvasContext.drawImage(this.videoPlayer, 0, 0, this.videoCanvas.width, this.videoCanvas.height);

                // Check for a QR code
                const imageData = this.videoCanvasContext.getImageData(0, 0, this.videoCanvas.width, this.videoCanvas.height);
                const code = jsQR(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: "dontInvert",
                });

                // Update the overlay
                this.overlayCanvasContext.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
                drawTargetBox(this.overlayCanvas, this.overlayCanvasContext);

                // If we found a code
                if (code) {
                    // Draw a line around it
                    this.overlayCanvasContext.beginPath();
                    this.overlayCanvasContext.moveTo(code.location.topLeftCorner.x, code.location.topLeftCorner.y);
                    this.overlayCanvasContext.lineTo(code.location.topRightCorner.x, code.location.topRightCorner.y);
                    this.overlayCanvasContext.lineTo(code.location.bottomRightCorner.x, code.location.bottomRightCorner.y);
                    this.overlayCanvasContext.lineTo(code.location.bottomLeftCorner.x, code.location.bottomLeftCorner.y);
                    this.overlayCanvasContext.lineTo(code.location.topLeftCorner.x, code.location.topLeftCorner.y);
                    this.overlayCanvasContext.lineTo(code.location.topRightCorner.x, code.location.topRightCorner.y);
                    this.overlayCanvasContext.lineWidth = 4;
                    this.overlayCanvasContext.strokeStyle = "#3BFF58";
                    this.overlayCanvasContext.stroke();
                    // Emit an event for the scan
                    this.emit("scan", code);
                }
            }

            // Request the next update
            requestAnimationFrames(4).then(() => this.runUpdate());
        }
    }
}

async function requestAnimationFrames(frames: number): Promise<number> {
    let timestamp = 0;
    while(frames-- > 0) {
        timestamp = await requestAnimationFrame();
    }
    return timestamp;
}

async function requestAnimationFrame(): Promise<number> {
    return new Promise(resolve => window.requestAnimationFrame(resolve));
}

function drawTargetBox(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D): void {
    const height = canvas.height;
    const width = canvas.width;
    const marginH = Math.round(height / 6);
    const marginW = Math.round(width / 6);

    context.lineWidth = 4;
    context.strokeStyle = "#ffffff";
    context.beginPath();
    context.moveTo(marginW, marginH);
    context.lineTo(width - marginW, marginH);
    context.lineTo(width - marginW, height - marginH);
    context.lineTo(marginW, height - marginH);
    context.lineTo(marginW, marginH);
    context.lineTo(width - marginW, marginH);
    context.stroke();
}
