import * as React from 'react'

export function maybeCall(func?: Function, ...args: any[]) {
    return func && func(...args)
}

export function componentsEqual(compA: React.ReactElement<{}>, compB: React.ReactElement<{}>) {
    return compA.key === compB.key && compA.type === compB.type
}

let lastTime = 0
export const raf =
    requestAnimationFrame ||
    webkitRequestAnimationFrame ||
    function(callback: FrameRequestCallback) {
        var currTime = new Date().getTime()
        var timeToCall = Math.max(0, 16 - (currTime - lastTime))
        var id = setTimeout(() => callback(currTime + timeToCall), timeToCall)
        lastTime = currTime + timeToCall
        return id
    }
