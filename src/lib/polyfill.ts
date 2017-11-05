let lastTime = 0
export const raf =
    (window.requestAnimationFrame && window.requestAnimationFrame.bind(window)) ||
    (window.webkitRequestAnimationFrame && window.webkitRequestAnimationFrame.bind(window)) ||
    function(callback: FrameRequestCallback) {
        var currTime = new Date().getTime()
        var timeToCall = Math.max(0, 16 - (currTime - lastTime))
        var id = window.setTimeout(() => callback(currTime + timeToCall), timeToCall)
        lastTime = currTime + timeToCall
        return id
    }
