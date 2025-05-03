import { AppContext } from '../core/app-context.ts';

export class Shortcut {
    comments: HTMLElement[] = [];

    constructor() {
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    }

    handleKeyDown(e: KeyboardEvent): void {
        if (e.target instanceof HTMLElement &&
            (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
            return;
        }

        switch (e.key.toLowerCase()) {
            case 't':
                this.toggleTucao(e);
                break;
            case 'j':
                this.navigateToNextComment();
                e.preventDefault();
                break;
            case 'k':
                this.navigateToPrevComment();
                e.preventDefault();
                break;
        }
    }

    toggleTucao(e: KeyboardEvent): void {
        const jandanApp = AppContext.getInstance().jandanApp;
        const hoveredComment = jandanApp.querySelector('.comment-row.p-2:hover')
        if (hoveredComment) {
            hoveredComment.querySelector<HTMLElement>('.button-group:last-child')!.click();
            e.preventDefault();
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
