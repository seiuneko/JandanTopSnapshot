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
        id: number;
        images?: CommentImage[];
        sub_comment_count: number;

        [key: string]: any;
    }

    interface CommentImage {
        isGIF: boolean;
        src: string;
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