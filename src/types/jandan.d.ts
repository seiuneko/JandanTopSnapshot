import Vue from "vue";

export declare namespace Jandan {
    interface App extends Vue {
        commentTucao: Record<string, any>;
        expandedTucao: Record<string, boolean>;
        comments: Comment[];
        currentTab: string;
        gifImages: Record<string, GifImage>;
    }

    interface Comment {
        id: string;
        images?: CommentImage[];

        [key: string]: any;
    }

    interface CommentImage {
        isGIF: boolean;
        srcLarge: string;

        [key: string]: any;
    }

    interface GifImage {
        thumbLoaded: boolean;
        fullLoaded: boolean;
        loading: boolean;
        fullURL: string;
    }
}