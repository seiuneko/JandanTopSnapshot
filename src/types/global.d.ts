import { AxiosStatic } from "axios";
import Vue from "vue";

declare global {
    const axios: AxiosStatic;

    interface HTMLElement {
        __vue__?: Vue;
    }

    interface Date {
        toISOLocaleString(): string;
    }
}

export {};