import { Jandan } from "@/types/jandan";

export class AppContext {
    private static instance: AppContext;

    private constructor() {
    }

    private _jandanApp: HTMLElement | null = null;

    get jandanApp(): HTMLElement {
        return this._jandanApp!;
    }

    private _vueRoot: Jandan.App | null = null;

    get vueRoot(): Jandan.App {
        return this._vueRoot!;
    }

    static getInstance(): AppContext {
        if (!AppContext.instance) {
            AppContext.instance = new AppContext();

            const jandanAppElement = document.querySelector<HTMLElement>('.post > div:nth-child(1)');
            if (!jandanAppElement) {
                throw new Error("无法获取 jandanApp DOM 元素");
            }

            AppContext.instance._jandanApp = jandanAppElement;
            AppContext.instance._vueRoot = jandanAppElement.__vue__?.$root as Jandan.App;

            if (!AppContext.instance._vueRoot) {
                throw new Error("无法获取页面 Vue 实例");
            }
        }
        return AppContext.instance;
    }
}
