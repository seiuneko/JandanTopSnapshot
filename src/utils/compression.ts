export class CompressionUtil {
    static async compressToBase64<T>(data: T): Promise<string> {
        const compressedStream = new Response(JSON.stringify(data))
            .body!
            .pipeThrough(new CompressionStream('gzip'));
        const buf = await new Response(compressedStream).arrayBuffer();
        return btoa(String.fromCharCode(...new Uint8Array(buf)));
    }

    static async decompressFromBase64<T>(base64Data: string): Promise<T> {
        return fetch('data:;base64,' + base64Data)
            .then(async res => {
                const decompressedStream = res.body!.pipeThrough(
                    new DecompressionStream("gzip")
                );
                return await new Response(decompressedStream)
                    .text()
                    .then(text => JSON.parse(text) as T);
            });
    }
}
