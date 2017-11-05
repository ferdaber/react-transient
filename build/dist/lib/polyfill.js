var lastTime = 0;
export var raf = (typeof window.requestAnimationFrame !== undefined && window.requestAnimationFrame.bind(window)) ||
    (typeof window.webkitRequestAnimationFrame !== undefined && window.webkitRequestAnimationFrame.bind(window)) ||
    function (callback) {
        var currTime = new Date().getTime();
        var timeToCall = Math.max(0, 16 - (currTime - lastTime));
        var id = window.setTimeout(function () { return callback(currTime + timeToCall); }, timeToCall);
        lastTime = currTime + timeToCall;
        return id;
    };
//# sourceMappingURL=polyfill.js.map