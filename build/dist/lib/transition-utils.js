export function durationStringToMs(s) {
    return Number(s.slice(0, -1)) * 1000;
}
export function totalTransitionDuration(durationString, delayString) {
    var durations = durationString.split(',');
    var delays = delayString.split(',');
    while (delays.length < durations.length) {
        delays = delays.concat(delays);
    }
    return Math.max.apply(Math, durations.map(function (d, i) { return durationStringToMs(d) + durationStringToMs(delays[i]); }));
}
export function getSniffedCssInfo(type, el) {
    var _a = getComputedStyle(el), animationDuration = _a.animationDuration, animationDelay = _a.animationDelay, transitionDuration = _a.transitionDuration, transitionDelay = _a.transitionDelay;
    var maxDurations = {
        animation: null,
        transition: null
    };
    maxDurations.animation = totalTransitionDuration(animationDuration, animationDelay);
    maxDurations.transition = totalTransitionDuration(transitionDuration, transitionDelay);
    var maxType = maxDurations.transition > maxDurations.animation ? 'transition' : 'animation';
    return type
        ? {
            type: type,
            duration: maxDurations[type],
            numDurations: type === 'transition' ? transitionDuration.split(',').length : animationDuration.split(',').length
        }
        : {
            type: maxType,
            duration: maxDurations[maxType],
            numDurations: maxType === 'transition' ? transitionDuration.split(',').length : animationDuration.split(',').length
        };
}
export function onAllTransitionsEnd(type, el, callback) {
    // use explicitly provided type if available
    // sniff for CSS properties for transition or animation and get the maximum duration
    // set a timeout for the maximum duration, and also append transition/animation end handlers
    // call the callback when the timeout or the event handlers occur, whichever comes first
    var sniffedInfo = getSniffedCssInfo(type, el);
    var totalNumTransitionEnds = sniffedInfo.numDurations;
    var eventType = sniffedInfo.type + "end";
    var numTransitionEnds = 0;
    var timeout;
    function doneCallback() {
        window.clearTimeout(timeout);
        el.removeEventListener(eventType, onAnimationEnd);
        callback();
    }
    function onAnimationEnd(event) {
        // the slowest animation is the last animation, so we are done when the number of animations ended
        // is equal to the total
        event.target === el && ++numTransitionEnds >= totalNumTransitionEnds && doneCallback();
    }
    timeout = window.setTimeout(doneCallback, sniffedInfo.duration);
    el.addEventListener(eventType, onAnimationEnd);
    return function clearTimeouts() {
        window.clearTimeout(timeout);
        el.removeEventListener(eventType, onAnimationEnd);
    };
}
//# sourceMappingURL=transition-utils.js.map