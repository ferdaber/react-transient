import * as React from 'react';
import { raf } from './polyfill';
export function maybeCall(func) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    return func && func.apply(void 0, args);
}
export function componentsEqual(compA, compB) {
    return !!((!compA && !compB) || (compA && compB && compA.key === compB.key && compA.type === compB.type));
}
export function canRenderFragments() {
    return +React.version.split('.')[0] >= 16;
}
export function onNextFrame(callback) {
    raf(function () { return raf(callback); });
}
// tslint:disable-next-line
export function noop() { }
export function insertAtIndex(array, item, index) {
    while (array[index] !== undefined) {
        index++;
    }
    array[index] = item;
    return index;
}
//# sourceMappingURL=utils.js.map