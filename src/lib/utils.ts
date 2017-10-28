import * as React from 'react'

let lastTime = 0

export function maybeCall(func?: Function, ...args: any[]) {
    return func && func(...args)
}

export function componentsEqual(compA: React.ReactElement<{}>, compB: React.ReactElement<{}>) {
    return compA.key === compB.key && compA.type === compB.type
}

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

function durationStringToMs(s: string) {
    return Number(s.slice(0, -1)) * 1000
}

function totalTransitionDuration(durationString: string, delayString: string) {
    const durations = durationString.split(',')
    let delays = delayString.split(',')
    while (delays.length < durations.length) {
        delays = delays.concat(delays)
    }
    return Math.max(...durations.map((d, i) => durationStringToMs(d) + durationStringToMs(delays[i])))
}

export function getSniffedDuration(type: 'animation' | 'transition', el: HTMLElement) {
    const { animationDuration, animationDelay, transitionDuration, transitionDelay } = getComputedStyle(el)
    const maxAnimationDuration = totalTransitionDuration(animationDuration, animationDelay)
    const maxTransitionDuration = totalTransitionDuration(transitionDuration, transitionDelay)
    return type === 'animation'
        ? maxAnimationDuration
        : type === 'transition' ? maxTransitionDuration : Math.max(maxAnimationDuration, maxTransitionDuration)
}

export function onAllTransitionsEnd(type: 'animation' | 'transition', el: HTMLElement, callback: Function) {
    const { animationDuration, animationDelay, transitionDuration, transitionDelay } = getComputedStyle(el)
    type =
        type ||
        (totalTransitionDuration(animationDuration, animationDelay) >
        totalTransitionDuration(transitionDuration, transitionDelay)
            ? 'animation'
            : 'transition')
    const totalNumTransitionEnds =
        type === 'animation' ? animationDuration.split(',').length : transitionDuration.split(',').length
    const eventType = `${type}end`

    let numTransitionEnds = 0
    let timeout: number
    function doneCallback() {
        window.clearTimeout(timeout)
        el.removeEventListener(eventType, onAnimationEnd)
        callback()
    }
    function onAnimationEnd(event: AnimationEvent) {
        event.target === el && ++numTransitionEnds >= totalNumTransitionEnds && doneCallback()
    }
    timeout = window.setTimeout(doneCallback, getSniffedDuration(type, el))
    el.addEventListener(eventType, onAnimationEnd)

    return function clearTimeouts() {
        window.clearTimeout(timeout)
        el.removeEventListener(eventType, onAnimationEnd)
    }
}
