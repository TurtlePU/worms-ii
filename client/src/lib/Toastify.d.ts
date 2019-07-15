/*!
 * Type definitions for Toastify.js 1.6.1.
 * @license MIT
 * 
 * Copyright (C) 2019 Turtle P.U. (https://github.com/TurtlePU)
 */
declare module 'toastify-js' {
    /** Type of module. */
    export interface Toastify {
        /** Prepares new toast. */
        (options?: ToastOptions): Toast;
    }

    /** Type of object returned from the module function. */
    export interface Toast {
        /** Version of toastify. */
        toastify: string;
        /** Shows prepared toast. */
        showToast(): void;
        /** Hides previously shown toast. */
        hideToast(): void;
    }

    /** Type of options object passed in the module function. */
    export type ToastOptions = Partial<{
        /** Text of a toast. Defaults to 'Hi there!'. */
        text: string;
        /** Duration of a toast in millis. Defaults to 3000. */
        duration: number;
        /** ID of a parent element. */
        selector: string;
        /** Called after display. */
        callback: () => void;
        /** On-click redirection URL. */
        destination: string;
        /**
         * Open `destination` in new window? 
         */
        newWindow: boolean;
        /** Show close icon? */
        close: boolean;
        /** Position of a toast — top or bottom. Defaults to top. */
        gravity: "bottom" | "top";
        /**
         * Position of a toast — left or right. Defaults to right.
         * @deprecated
         */
        positionLeft: boolean;
        /** Position of a toast — left, right or center. Defaults to right. */
        position: "left" | "right" | "center";
        /** Background color string which can be used in CSS. */
        backgroundColor: string;
        /** Avatar src url. */
        avatar: string;
        /** Additional class names for the toast. */
        className: string;
        /** Stop timeout on focus? Defaults to true. */
        stopOnFocus: boolean;
    }>;

    let module: Toastify;
    export default module;
}
