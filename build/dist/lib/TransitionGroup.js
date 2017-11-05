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
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0)
            t[p[i]] = s[p[i]];
    return t;
};
import { onAllTransitionsEnd } from './transition-utils';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import Transition from './Transition';
import TransitionWrapper from './TransitionWrapper';
import { insertAtIndex, maybeCall, onNextFrame, noop } from './utils';
var TransitionGroup = /** @class */ (function (_super) {
    __extends(TransitionGroup, _super);
    function TransitionGroup() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.state = {
            children: _this._wrapChildren(_this.props)
        };
        _this._refs = Object.create(null);
        _this._timeouts = Object.create(null);
        return _this;
    }
    TransitionGroup.prototype.componentWillReceiveProps = function (nextProps) {
        var _this = this;
        var children = this.state.children;
        var nextChildren = this._wrapChildren(nextProps);
        var mergedChildren = [];
        this._movingChildren = [];
        var _loop_1 = function (i) {
            var child = children[i];
            var nextChildIndex = child && nextChildren.findIndex(function (c) { return c.key === child.key; });
            var newChild = nextChildren[i] && !children.some(function (c) { return c.key === nextChildren[i].key; }) && nextChildren[i];
            if (nextChildIndex >= 0) {
                // child exists already, but may have moved
                insertAtIndex(mergedChildren, nextChildren[nextChildIndex], nextChildIndex);
                if (!this_1.props.noCss) {
                    var oldElement = ReactDOM.findDOMNode(this_1._refs[child.key]);
                    oldElement.style.transform = '';
                    this_1._movingChildren.push({
                        clientRect: oldElement.getBoundingClientRect(),
                        key: child.key
                    });
                }
            }
            else if (nextChildIndex === -1) {
                // child is leaving
                var oldOnAfterLeave_1 = child.element.props.onAfterLeave;
                insertAtIndex(mergedChildren, {
                    key: child.key,
                    element: React.cloneElement(child.element, {
                        children: null,
                        onAfterLeave: function (el) {
                            maybeCall(oldOnAfterLeave_1, el);
                            _this._unmountAtKey(child.key);
                        }
                    })
                }, i);
            }
            if (newChild) {
                // a new child is transitioning in
                insertAtIndex(mergedChildren, newChild, i);
            }
            this_1.setState({
                children: mergedChildren
            }, this_1.props.noCss
                ? noop
                : function () {
                    _this._clearTransitions();
                    _this._movingChildren.forEach(function (childPosition) {
                        var el = ReactDOM.findDOMNode(_this._refs[childPosition.key]);
                        _this._transitionChildMove(childPosition.clientRect, el, childPosition.key);
                    });
                });
        };
        var this_1 = this;
        for (var i = 0; i < Math.max(children.length, nextChildren.length); i++) {
            _loop_1(i);
        }
    };
    TransitionGroup.prototype.render = function () {
        return (React.createElement(TransitionWrapper, { component: this.props.component }, this.state.children.map(function (child) { return child.element; })));
    };
    Object.defineProperty(TransitionGroup.prototype, "strippedProps", {
        get: function () {
            var _a = this.props, children = _a.children, restProps = __rest(_a, ["children"]);
            return restProps;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TransitionGroup.prototype, "moveClassName", {
        get: function () {
            return (this.props.name || 't') + "-move";
        },
        enumerable: true,
        configurable: true
    });
    TransitionGroup.prototype._wrapChildren = function (props) {
        var _this = this;
        return React.Children.map(props.children, function (child) { return ({
            key: child.key,
            element: child.type === Transition ? (React.cloneElement(child, __assign({}, _this.strippedProps, child.props, { appear: true, key: child.key, ref: function (ref) { return (_this._refs[child.key] = ref); } }))) : (React.createElement(Transition, __assign({}, _this.strippedProps, { appear: true, key: child.key, ref: function (ref) { return (_this._refs[child.key] = ref); } }), child))
        }); });
    };
    TransitionGroup.prototype._unmountAtKey = function (key) {
        var children = this.state.children.slice();
        var indexToUnmount = this.state.children.findIndex(function (c) { return c.key === key; });
        children.splice(indexToUnmount, 1);
        this.setState({
            children: children
        });
    };
    TransitionGroup.prototype._clearTransitions = function () {
        for (var key in this._timeouts) {
            if (this._timeouts[key]) {
                this._timeouts[key]();
            }
        }
    };
    TransitionGroup.prototype._transitionChildMove = function (oldClientRect, childEl, key) {
        var _this = this;
        if (!childEl)
            return;
        var _a = childEl.getBoundingClientRect(), left = _a.left, top = _a.top;
        var dLeft = oldClientRect.left - left;
        var dTop = oldClientRect.top - top;
        if (dLeft === 0 && dTop === 0)
            return;
        childEl.style.transform = "translate(" + dLeft + "px, " + dTop + "px)";
        onNextFrame(function () {
            childEl.classList.add(_this.moveClassName);
            childEl.style.transform = '';
            var doneCallback = function () {
                childEl.classList.remove(_this.moveClassName);
                _this._timeouts[key] = null;
            };
            var clearTransition = onAllTransitionsEnd('transition', childEl, doneCallback);
            _this._timeouts[key] = function () {
                clearTransition();
                doneCallback();
            };
        });
    };
    return TransitionGroup;
}(React.Component));
export { TransitionGroup };
export default TransitionGroup;
//# sourceMappingURL=TransitionGroup.js.map