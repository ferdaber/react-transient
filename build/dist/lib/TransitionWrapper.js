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
import { canRenderFragments } from './utils';
var TransitionWrapper = /** @class */ (function (_super) {
    __extends(TransitionWrapper, _super);
    function TransitionWrapper() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    TransitionWrapper.prototype.render = function () {
        var Wrapper = this.props.component || 'div';
        return React.Children.count(this.props.children) > 1 ? (canRenderFragments() ? (this.props.children) : (React.createElement(Wrapper, null, this.props.children))) : (this.props.children);
    };
    return TransitionWrapper;
}(React.Component));
export { TransitionWrapper };
export default TransitionWrapper;
//# sourceMappingURL=TransitionWrapper.js.map