export function durationStringToMs(s: string) {
    return Number(s.slice(0, -1)) * 1000
}

export function totalTransitionDuration(durationString: string, delayString: string) {
    const durations = durationString.split(',')
    let delays = delayString.split(',')
    while (delays.length < durations.length) {
        delays = delays.concat(delays)
    }
    return Math.max(...durations.map((d, i) => durationStringToMs(d) + durationStringToMs(delays[i])))
}

export function getSniffedCssInfo(type: 'animation' | 'transition', el: HTMLElement) {
    const { animationDuration, animationDelay, transitionDuration, transitionDelay } = getComputedStyle(el)
    const maxDurations = {
        animation: null as number,
        transition: null as number
    }
    maxDurations.animation = totalTransitionDuration(animationDuration, animationDelay)
    maxDurations.transition = totalTransitionDuration(transitionDuration, transitionDelay)
    const maxType = maxDurations.transition > maxDurations.animation ? 'transition' : 'animation'
    return type
        ? {
              type,
              duration: maxDurations[type],
              numDurations:
                  type === 'transition' ? transitionDuration.split(',').length : animationDuration.split(',').length
          }
        : {
              type: maxType,
              duration: maxDurations[maxType],
              numDurations:
                  maxType === 'transition' ? transitionDuration.split(',').length : animationDuration.split(',').length
          }
}

export function onAllTransitionsEnd(type: 'animation' | 'transition', el: HTMLElement, callback: Function) {
    // use explicitly provided type if available
    // sniff for CSS properties for transition or animation and get the maximum duration
    // set a timeout for the maximum duration, and also append transition/animation end handlers
    // call the callback when the timeout or the event handlers occur, whichever comes first

    const sniffedInfo = getSniffedCssInfo(type, el)
    const totalNumTransitionEnds = sniffedInfo.numDurations
    const eventType = `${sniffedInfo.type}end`

    let numTransitionEnds = 0
    let timeout: number
    function doneCallback() {
        window.clearTimeout(timeout)
        el.removeEventListener(eventType, onAnimationEnd)
        callback()
    }
    function onAnimationEnd(event: AnimationEvent) {
        // the slowest animation is the last animation, so we are done when the number of animations ended
        // is equal to the total
        event.target === el && ++numTransitionEnds >= totalNumTransitionEnds && doneCallback()
    }
    timeout = window.setTimeout(doneCallback, sniffedInfo.duration)
    el.addEventListener(eventType, onAnimationEnd)

    return function clearTimeouts() {
        window.clearTimeout(timeout)
        el.removeEventListener(eventType, onAnimationEnd)
    }
}
