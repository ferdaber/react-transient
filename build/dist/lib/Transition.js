var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import TransitionWrapper from './TransitionWrapper';
import { onAllTransitionsEnd } from './transition-utils';
import { componentsEqual, maybeCall, noop, onNextFrame } from './utils';
var Transition = /** @class */ (function (_super) {
    __extends(Transition, _super);
    function Transition() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.state = {
            child: _this._getChild(_this.props),
            oldChild: null,
            isEntering: !!_this.props.appear,
            isLeaving: false
        };
        _this._isUnmounted = false;
        _this._timeoutClears = {
            appear: null,
            enter: null,
            leave: null
        };
        _this._transitionChildIn = function () {
            _this._safelySetState({
                isEntering: true,
                child: _this._getChild(_this.props)
            }, function () {
                var childEl = _this.childRef;
                if (!childEl)
                    return;
                _this._applyInitialTransitionClasses('enter', childEl);
                maybeCall(_this.props.onBeforeEnter, childEl);
                onNextFrame(function () {
                    if (_this.props.onEnter && _this.props.onEnter.length >= 2) {
                        _this._applyActiveTransitionClasses('enter', childEl);
                        _this.props.onEnter(childEl, _this._afterEnterCallback(childEl));
                    }
                    else {
                        _this._applyActiveTransitionClasses('enter', childEl);
                        maybeCall(_this.props.onEnter, childEl);
                        _this._onTransitionsEnd('enter', childEl, _this._afterEnterCallback(childEl));
                    }
                });
            });
        };
        _this._transitionChildOut = function () {
            _this._safelySetState({
                isLeaving: true
            });
            var oldChildEl = _this.oldChildRef;
            if (!oldChildEl)
                return;
            _this._applyInitialTransitionClasses('leave', oldChildEl);
            maybeCall(_this.props.onBeforeLeave, oldChildEl);
            onNextFrame(function () {
                if (_this.props.onLeave && _this.props.onLeave.length >= 2) {
                    _this._applyActiveTransitionClasses('leave', oldChildEl);
                    _this.props.onLeave(oldChildEl, _this._afterLeaveCallback(oldChildEl));
                }
                else {
                    _this._applyActiveTransitionClasses('leave', oldChildEl);
                    maybeCall(_this.props.onLeave, oldChildEl);
                    _this._onTransitionsEnd('leave', oldChildEl, _this._afterLeaveCallback(oldChildEl));
                }
            });
        };
        _this._afterEnterCallback = function (el) { return function () {
            _this._timeoutClears.enter = null;
            _this._applyPostAnimationClasses('enter', el);
            maybeCall(_this.props.onAfterEnter, el);
            _this._safelySetState({
                isEntering: false
            }, _this.props.mode === 'in-out' ? _this._transitionChildOut : noop);
        }; };
        _this._afterLeaveCallback = function (el) { return function () {
            _this._timeoutClears.leave = null;
            _this._applyPostAnimationClasses('leave', el);
            maybeCall(_this.props.onAfterLeave, el);
            _this._safelySetState({
                oldChild: null,
                isLeaving: false
            }, _this.props.mode === 'out-in' ? _this._transitionChildIn : noop);
        }; };
        return _this;
    }
    Transition.prototype.componentDidMount = function () {
        var _this = this;
        if (this.props.appear) {
            var childEl_1 = this.childRef;
            // set up new element to enter before next frame
            this._applyInitialTransitionClasses('enter', childEl_1);
            maybeCall(this.props.onBeforeAppear, childEl_1);
            onNextFrame(function () {
                // new element is now entering, wait for after-appear
                var doneCallback = function () {
                    _this._timeoutClears.appear = null;
                    _this._applyPostAnimationClasses('enter', childEl_1);
                    maybeCall(_this.props.onAfterAppear, childEl_1);
                };
                // order of priority:
                // explicitly defined done callback > props.duration defined > autoCss sniffing
                if (_this.props.onAppear && _this.props.onAppear.length >= 2) {
                    _this._applyActiveTransitionClasses('enter', childEl_1);
                    _this.props.onAppear(childEl_1, doneCallback);
                }
                else {
                    _this._applyActiveTransitionClasses('enter', childEl_1);
                    maybeCall(_this.props.onAppear, childEl_1);
                    _this._onTransitionsEnd('appear', childEl_1, doneCallback);
                }
            });
        }
    };
    Transition.prototype.componentWillReceiveProps = function (nextProps) {
        // React will not attempt to replace elements
        // render the child with the new props
        if (componentsEqual(this.props.children, nextProps.children)) {
            this._safelySetState({
                child: this._getChild(nextProps)
            });
        }
    };
    Transition.prototype.componentDidUpdate = function (prevProps) {
        var _this = this;
        // children have changed, React is going to replace elements
        // transition the element out
        if (!componentsEqual(this.props.children, prevProps.children) &&
            // prevent transition interruptions while an element is leaving in out-in mode
            !(this.props.mode === 'out-in' && this.state.isLeaving)) {
            this._clearTimeouts();
            if (!this.props.children && prevProps.children) {
                // child is unmounted, transition out right away
                this._safelySetState({
                    child: null,
                    oldChild: this._getChild(prevProps)
                });
                this._transitionChildOut();
            }
            else if (this.props.children && !prevProps.children) {
                // child is re-mounting, transition in right away
                this._safelySetState({
                    oldChild: null
                }, this._transitionChildIn);
            }
            else {
                // wait to get the old child ref first
                this._safelySetState({
                    oldChild: this._getChild(prevProps)
                }, function () {
                    _this.props.mode !== 'out-in' && _this._transitionChildIn();
                    _this.props.mode !== 'in-out' && _this._transitionChildOut();
                });
            }
        }
    };
    Transition.prototype.componentWillUnmount = function () {
        this._clearTimeouts();
        this._isUnmounted = true;
    };
    Transition.prototype.render = function () {
        var _this = this;
        var oldChild = (React.createElement(TransitionWrapper, { ref: function (ref) { return (_this._oldChildRef = ref); } }, this.state.oldChild));
        var child = (React.createElement(TransitionWrapper, { ref: function (ref) { return (_this._childRef = ref); } }, this.state.child));
        var bothChildren = (React.createElement(TransitionWrapper, { component: this.props.component },
            oldChild,
            child));
        return this.state.oldChild
            ? this.props.mode === 'out-in' || !this.state.child ? oldChild : bothChildren
            : child;
    };
    Object.defineProperty(Transition.prototype, "prefix", {
        get: function () {
            var prefix = this.props.name || 't';
            return "" + prefix;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Transition.prototype, "childRef", {
        get: function () {
            return ReactDOM.findDOMNode(this._childRef);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Transition.prototype, "oldChildRef", {
        get: function () {
            return this.props.children ? ReactDOM.findDOMNode(this._oldChildRef) : this.childRef;
        },
        enumerable: true,
        configurable: true
    });
    Transition.prototype._getChild = function (props) {
        return props.children ? React.Children.only(props.children) : null;
    };
    Transition.prototype._safelySetState = function (newState, afterCallback) {
        !this._isUnmounted && this.setState(newState, afterCallback);
    };
    Transition.prototype._onTransitionsEnd = function (type, el, callback) {
        if (this.props.duration || this.props.noCss) {
            var timeout_1 = window.setTimeout(callback, this.props.duration || 0);
            this._timeoutClears[type] = function () { return window.clearTimeout(timeout_1); };
        }
        else {
            this._timeoutClears[type] = onAllTransitionsEnd(this.props.type, el, callback);
        }
    };
    Transition.prototype._clearTimeouts = function () {
        if (this._timeoutClears.appear) {
            this._timeoutClears.appear();
            maybeCall(this.props.onCancelAppear, this.childRef || this.oldChildRef);
        }
        if (this._timeoutClears.enter) {
            this._timeoutClears.enter();
            maybeCall(this.props.onCancelEnter, this.childRef || this.oldChildRef);
        }
        if (this._timeoutClears.leave) {
            this._timeoutClears.leave();
            maybeCall(this.props.onCancelLeave, this.oldChildRef || this.childRef);
        }
    };
    Transition.prototype._getInitialClass = function (type) {
        return type === 'enter'
            ? this.props.enterClass || this.prefix + "-enter"
            : this.props.leaveClass || this.prefix + "-leave";
    };
    Transition.prototype._getActiveClass = function (type) {
        return type === 'enter'
            ? this.props.enteringClass || this.prefix + "-entering"
            : this.props.leavingClass || this.prefix + "-leaving";
    };
    Transition.prototype._getPostClass = function (type) {
        return type === 'enter'
            ? this.props.enterToClass || this.prefix + "-enter-to"
            : this.props.leaveToClass || this.prefix + "-leave-to";
    };
    Transition.prototype._applyInitialTransitionClasses = function (type, el) {
        el.classList.add(this._getInitialClass(type));
        el.classList.add(this._getActiveClass(type));
    };
    Transition.prototype._applyActiveTransitionClasses = function (type, el) {
        el.classList.remove(this._getInitialClass(type));
        el.classList.add(this._getPostClass(type));
    };
    Transition.prototype._applyPostAnimationClasses = function (type, el) {
        el.classList.remove(this._getActiveClass(type));
        el.classList.remove(this._getPostClass(type));
    };
    return Transition;
}(React.Component));
export { Transition };
export default Transition;
//# sourceMappingURL=Transition.js.map