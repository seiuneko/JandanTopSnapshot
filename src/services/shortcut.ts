import { AppContext } from '../core/app-context.ts';

export class Shortcut {
    comments: HTMLElement[] = [];
    private readonly keyActions: Record<string, () => void>;

    constructor() {
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));

        this.keyActions = {
            't': this.toggleTucao.bind(this),
            'j': this.navigateToNextComment.bind(this),
            'k': this.navigateToPrevComment.bind(this)
        };
    }

    handleKeyDown(e: KeyboardEvent): void {
        if (e.target instanceof HTMLElement &&
            (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
            return;
        }

        const key = e.key.toLowerCase();
        const action = this.keyActions[key];

        if (action) {
            e.preventDefault();
            action();
        }
    }

    toggleTucao(): void {
        const appContext = AppContext.getInstance();
        const jandanApp = appContext.jandanApp;
        const hoveredComment = jandanApp.querySelector('.comment-row.p-2:hover')
        if (hoveredComment) {
            const vueRoot = appContext.vueRoot;
            const commentId = hoveredComment.querySelector<HTMLElement>('.comment-num')!.textContent!.slice(1);
            console.log(vueRoot.expandedTucao[commentId]);
            if (vueRoot.expandedTucao[commentId]) {
                vueRoot.closeTucao(commentId);
            } else {
                vueRoot.toggleTucao(commentId);
            }
        }
    }

    refreshComments(): HTMLElement[] {
        this.comments = Array.from(document.querySelectorAll('.comment-row.p-2'));
        return this.comments;
    }

    getCurrentTopCommentIndex(): number {
        for (const [i, comment] of this.comments.entries()) {
            const rect = comment.getBoundingClientRect();

            if (rect.top >= 0) {
                return i;
            }

            if (rect.bottom > 10) {
                return i;
            }
        }
        return -1;
    }

    focusComment(index: number): void {
        if (index >= 0 && index < this.comments.length) {
            const comment = this.comments[index];
            comment.scrollIntoView({behavior: 'smooth', block: 'start'});
        }
    }

    navigateToNextComment(): void {
        const currentIndex = this.getCurrentTopCommentIndex();
        const nextIndex = currentIndex + 1;

        if (nextIndex < this.comments.length) {
            this.focusComment(nextIndex);
        }
    }

    navigateToPrevComment(): void {
        const currentIndex = this.getCurrentTopCommentIndex();
        const prevIndex = currentIndex - 1;

        if (prevIndex >= 0) {
            this.focusComment(prevIndex);
        }
    }
}
