import * as React from 'react'
import { raf } from './polyfill'

export function maybeCall(func?: Function, ...args: any[]) {
    return func && func(...args)
}

export function componentsEqual(compA: React.ReactElement<{}>, compB: React.ReactElement<{}>) {
    return !!((!compA && !compB) || (compA && compB && compA.key === compB.key && compA.type === compB.type))
}

export function canRenderFragments() {
    return +React.version.split('.')[0] >= 16
}

export function onNextFrame(callback: FrameRequestCallback) {
    raf(() => raf(callback))
}

// tslint:disable-next-line
export function noop() {}

export function insertAtIndex<T>(array: T[], item: T, index: number) {
    while (array[index] !== undefined) {
        index++
    }
    array[index] = item
    return index
}
