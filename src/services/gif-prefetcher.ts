import { Jandan } from "@/types/jandan";

export class GifPrefetcher {
    constructor() {
    }

    async loadImage(url: string): Promise<boolean> {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                console.log(`GIF预加载完成: ${url}`);
                resolve(true);
            };
            img.onerror = () => {
                console.log(`GIF预加载失败: ${url}`);
                resolve(false);
            };
            img.src = url;
        });
    }

    async prefetch(gifImages: Jandan.GifImage): Promise<void> {
        const gifUrls = Object.values(gifImages)
            .map(gifInfo => gifInfo.fullURL);

        for (const url of gifUrls) {
            await this.loadImage(url);
        }
    }
}
