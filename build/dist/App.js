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
import * as React from 'react';
import Transition from './lib/Transition';
import TransitionGroup from './lib/TransitionGroup';
import './App.css';
var Block = function (_a) {
    var children = _a.children;
    return React.createElement("div", { className: "box" }, children || 'Hello World!');
};
var BlockA = function (_a) {
    var children = _a.children;
    return React.createElement(Block, null, children);
};
var BlockB = function (_a) {
    var children = _a.children;
    return React.createElement(Block, null, children);
};
var log = function (message) { return function (el) {
    console.log('-------------------------------');
    console.log(message);
    console.log(el);
    console.log(el.classList.toString());
    console.log('-------------------------------');
}; };
function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;
    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }
    return array;
}
var transitionProps = {
    appear: true,
    mode: 'out-in',
    onBeforeAppear: log('onBeforeAppear'),
    onAppear: log('onAppear'),
    onAfterAppear: log('onAfterAppear'),
    onCancelAppear: log('onCancelAppear'),
    onBeforeEnter: log('onBeforeEnter'),
    onEnter: log('onEnter'),
    onAfterEnter: log('onAfterEnter'),
    onCancelEnter: log('onCancelEnter'),
    onBeforeLeave: log('onBeforeLeave'),
    onLeave: log('onLeave'),
    onAfterLeave: log('onAfterLeave'),
    onCancelLeave: log('onCancelLeave')
};
var App = /** @class */ (function (_super) {
    __extends(App, _super);
    function App() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.state = {
            isA: true,
            isAppended: true,
            numberList: [],
            grid: Array(25)
                .fill(0)
                .map(function (n, idx) { return idx + 1; })
        };
        return _this;
    }
    App.prototype.render = function () {
        var _this = this;
        return (React.createElement("div", null,
            React.createElement("button", { onClick: function () { return _this.setState({ isA: !_this.state.isA }); } }, "Transition props!"),
            React.createElement("button", { onClick: function () { return _this.setState({ isAppended: !_this.state.isAppended }); } }, "Modify props!"),
            React.createElement("button", { onClick: function () { return _this.addNumber(); } }, "Add number!"),
            React.createElement("button", { onClick: function () { return _this.removeNumber(); } }, "Remove number!"),
            React.createElement("button", { onClick: function () { return _this.shuffle(); } }, "Shuffle!"),
            React.createElement("button", { onClick: function () { return _this.shuffleGrid(); } }, "Shuffle Grid!"),
            React.createElement(Transition, __assign({}, transitionProps, { name: "block" }), this.state.isA ? (React.createElement(BlockA, null, 'Hello World A!' + (this.state.isAppended ? ' also this' : ''))) : (React.createElement(BlockB, null, 'Hello World B!' + (this.state.isAppended ? ' also this' : '')))),
            React.createElement(TransitionGroup, __assign({}, transitionProps, { name: "number" }), this.state.numberList.map(function (n) { return (React.createElement("div", { key: n, className: "number" },
                "Number: ",
                n,
                " ",
                React.createElement("button", { onClick: function () { return _this.removeNumber(n); } }, "X"))); })),
            React.createElement("div", { style: {
                    display: 'flex',
                    width: '100%',
                    alignItems: 'center',
                    justifyContent: 'center'
                } },
                React.createElement("div", { className: "grid-container" },
                    React.createElement(TransitionGroup, { name: "grid-cell" }, this.state.grid.map(function (n, idx) { return (React.createElement("div", { className: "grid-cell", key: n }, n)); }))))));
    };
    App.prototype.shuffle = function () {
        this.setState({
            numberList: shuffle(this.state.numberList.slice())
        });
    };
    App.prototype.shuffleGrid = function () {
        var grid = shuffle(this.state.grid.slice());
        this.setState({
            grid: grid
        });
    };
    App.prototype.addNumber = function () {
        do {
            var newNum = ~~(1 + Math.random() * 100);
        } while (this.state.numberList.some(function (n) { return n === newNum; }));
        var newIndex = ~~(Math.random() * this.state.numberList.length);
        var numberList = this.state.numberList.slice();
        numberList.splice(newIndex, 0, newNum);
        this.setState({ numberList: numberList });
    };
    App.prototype.removeNumber = function (numToRemove) {
        if (numToRemove == null) {
            numToRemove = this.state.numberList[~~(Math.random() * this.state.numberList.length)];
        }
        this.setState({
            numberList: this.state.numberList.filter(function (n) { return n !== numToRemove; })
        });
    };
    return App;
}(React.Component));
export default App;
//# sourceMappingURL=App.js.map