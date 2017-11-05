import * as React from 'react'
import * as ReactDOM from 'react-dom'

import { TransitionWrapper, WrapperComponent } from './TransitionWrapper'

import { onAllTransitionsEnd } from './transition-utils'
import { componentsEqual, maybeCall, noop, onNextFrame } from './utils'

export interface BaseTransitionProps {
    /**
     * Prefix of CSS classes assigned to transitioning elements.
     * Default value is 't'
     */
    name: string
    /**
     * If true, element will transition in on first mount
     */
    appear: boolean
    /**
     * Manual duration of transition, if set it will override
     * auto-CSS duration detection, this is not used if a done callback
     * is explicitly used in a JS hook
     */
    duration: number
    /**
     * Explicit CSS property to sniff, if set and auto-CSS is used
     * it will only consider the specific property when determining
     * transition duration
     */
    type: 'animation' | 'transition'
    /**
     * The transition mode: if unset elements will transition in at the
     * same time as leaving elements; if 'in-out' entering elements will
     * transition in prior to leaving elements transitioning out; if 'out-in'
     * leaving elements will transition out prior to entering elements transitioning in
     */
    mode: 'in-out' | 'out-in'
    /**
     * If true, auto-CSS detection will be disabled. Make sure to use a duration
     * or the JS hooks with manual done callback, otherwise elements will transition in/out
     * within one frame tick
     */
    noCss: boolean
    /**
     * Only used for React < v16, when rendering multiple children,
     * the Transition and TransitionGroup components will require a container element,
     * by default it is a div but can be overriden with this prop. Use a string
     * for a built-in tag and the function/class for a custom component
     */
    component: WrapperComponent

    /**
     * Name of the class for an element that is about to enter.
     * Applied for a single frame after the element is inserted into the DOM, and styles
     * are guaranteed to be applied prior to the element being rendered.
     * Default value is {name}-enter
     */
    enterClass: string
    /**
     * Name of the class for an element that is entering.
     * Applied during the entirety of the transition period.
     * Default value is {name}-entering
     */
    enteringClass: string
    /**
     * Name of the class for an element that is entering.
     * Applied right as enterClass is removed, and lasts for the remainder of the
     * transition period.
     * Default value is {name}-enter-to
     */
    enterToClass: string

    /**
     * Name of the class for an element that is about to leave.
     * Applied for a single frame as the element is about to leave.
     * Default value is {name}-leave
     */
    leaveClass: string
    /**
     * Name of the class for an element that is leaving.
     * Applied during the entirety of the transition period.
     * Default value is {name}-leaving
     */
    leavingClass: string
    /**
     * Name of the class for an element that is leaving.
     * Applied right as leaveClass is removed, and lasts for the remainder of the
     * transition period.
     * Default value is {name}-leave-to
     */
    leaveToClass: string

    /**
     * Called right after an element is inserted into the DOM. All changes are guaranteed
     * to apply prior to the element being rendered.
     * Ignored if appear is not set
     */
    onBeforeAppear(el: HTMLElement): void
    /**
     * Called one frame after onBeforeAppear is emitted
     * If the provided callback uses a done parameter (two mandatory params), duration
     * and auto-CSS detection are disabled
     * Ignored if appear is not set
     */
    onAppear(el: HTMLElement, done: () => void): void
    /**
     * Called at the end of an element's transition
     * Ignored if appear is not set
     */
    onAfterAppear(el: HTMLElement): void
    /**
     * Called if an appearing element is interrupted by another element transitioning in
     * Ignored if appear is not set
     */
    onCancelAppear(el: HTMLElement): void

    /**
     * Called right after an element is inserted into the DOM. All changes are guaranteed
     * to apply prior to the element being rendered.
     */
    onBeforeEnter(el: HTMLElement): void
    /**
     * Called one frame after onBeforeEnter is emitted
     * If the provided callback uses a done parameter (two mandatory params), duration
     * and auto-CSS detection are disabled
     */
    onEnter(el: HTMLElement, done: () => void): void
    /**
     * Called at the end of an element's transition
     */
    onAfterEnter(el: HTMLElement): void
    /**
     * Called if an entering element is interrupted by another element transitioning in
     */
    onCancelEnter(el: HTMLElement): void

    /**
     * Called right as an element is about to leave
     */
    onBeforeLeave(el: HTMLElement): void
    /**
     * Called one frame after onBeforeLeave is emitted
     * If the provided callback uses a done parameter (two mandatory params), duration
     * and auto-CSS detection are disabled
     */
    onLeave(el: HTMLElement, done: () => void): void
    /**
     * Called at the end of an element's transition, right before it is about to unmount
     */
    onAfterLeave(el: HTMLElement): void
    /**
     * Called if a leaving element is interrupted by another element transitioning in
     */
    onCancelLeave(el: HTMLElement): void
}

export interface TransitionProps extends Partial<BaseTransitionProps> {}
export interface SingleTransitionProps extends TransitionProps {
    children: JSX.Element
}

export interface TransitionState {
    child: JSX.Element
    oldChild: JSX.Element
    isEntering: boolean
    isLeaving: boolean
}

type EnterOrLeave = 'enter' | 'leave'

export class Transition extends React.Component<SingleTransitionProps, TransitionState> {
    state: TransitionState = {
        child: this._getChild(this.props),
        oldChild: null,
        isEntering: !!this.props.appear,
        isLeaving: false
    }

    private _isUnmounted = false
    private _childRef: React.ReactInstance
    private _oldChildRef: React.ReactInstance
    private _timeoutClears = {
        appear: null as Function,
        enter: null as Function,
        leave: null as Function
    }

    componentDidMount() {
        if (this.props.appear) {
            const childEl = this.childRef
            // set up new element to enter before next frame
            this._applyInitialTransitionClasses('enter', childEl)
            maybeCall(this.props.onBeforeAppear, childEl)

            onNextFrame(() => {
                // new element is now entering, wait for after-appear
                const doneCallback = () => {
                    this._timeoutClears.appear = null
                    this._applyPostAnimationClasses('enter', childEl)
                    maybeCall(this.props.onAfterAppear, childEl)
                }
                // order of priority:
                // explicitly defined done callback > props.duration defined > autoCss sniffing
                if (this.props.onAppear && this.props.onAppear.length >= 2) {
                    this._applyActiveTransitionClasses('enter', childEl)
                    this.props.onAppear(childEl, doneCallback)
                } else {
                    this._applyActiveTransitionClasses('enter', childEl)
                    maybeCall(this.props.onAppear, childEl)
                    this._onTransitionsEnd('appear', childEl, doneCallback)
                }
            })
        }
    }

    componentWillReceiveProps(nextProps: Readonly<SingleTransitionProps>) {
        // React will not attempt to replace elements
        // render the child with the new props
        if (componentsEqual(this.props.children, nextProps.children)) {
            this._safelySetState({
                child: this._getChild(nextProps)
            })
        }
    }

    componentDidUpdate(prevProps: Readonly<SingleTransitionProps>) {
        // children have changed, React is going to replace elements
        // transition the element out
        if (
            !componentsEqual(this.props.children, prevProps.children) &&
            // prevent transition interruptions while an element is leaving in out-in mode
            !(this.props.mode === 'out-in' && this.state.isLeaving)
        ) {
            this._clearTimeouts()
            if (!this.props.children && prevProps.children) {
                // child is unmounted, transition out right away
                this._safelySetState({
                    child: null,
                    oldChild: this._getChild(prevProps)
                })
                this._transitionChildOut()
            } else if (this.props.children && !prevProps.children) {
                // child is re-mounting, transition in right away
                this._safelySetState(
                    {
                        oldChild: null
                    },
                    this._transitionChildIn
                )
            } else {
                // wait to get the old child ref first
                this._safelySetState(
                    {
                        oldChild: this._getChild(prevProps)
                    },
                    () => {
                        this.props.mode !== 'out-in' && this._transitionChildIn()
                        this.props.mode !== 'in-out' && this._transitionChildOut()
                    }
                )
            }
        }
    }

    componentWillUnmount() {
        this._clearTimeouts()
        this._isUnmounted = true
    }

    render() {
        const oldChild = (
            <TransitionWrapper ref={(ref: React.ReactInstance) => (this._oldChildRef = ref)}>
                {this.state.oldChild}
            </TransitionWrapper>
        )
        const child = (
            <TransitionWrapper ref={(ref: React.ReactInstance) => (this._childRef = ref)}>
                {this.state.child}
            </TransitionWrapper>
        )
        const bothChildren = (
            <TransitionWrapper component={this.props.component}>
                {oldChild}
                {child}
            </TransitionWrapper>
        )
        return this.state.oldChild
            ? this.props.mode === 'out-in' || !this.state.child ? oldChild : bothChildren
            : child
    }

    get prefix() {
        const prefix = this.props.name || 't'
        return `${prefix}`
    }

    get childRef() {
        return ReactDOM.findDOMNode(this._childRef) as HTMLElement
    }

    get oldChildRef() {
        return this.props.children ? ReactDOM.findDOMNode(this._oldChildRef) as HTMLEmbedElement : this.childRef
    }

    private _getChild(props: SingleTransitionProps) {
        return props.children ? React.Children.only(props.children) : null
    }

    private _safelySetState<K extends keyof TransitionState>(
        newState: Pick<TransitionState, K>,
        afterCallback?: () => any
    ) {
        !this._isUnmounted && this.setState(newState, afterCallback)
    }

    private _transitionChildIn = () => {
        this._safelySetState(
            {
                isEntering: true,
                child: this._getChild(this.props)
            },
            () => {
                const childEl = this.childRef
                if (!childEl) {
                    this._safelySetState({
                        isEntering: false
                    })
                    return
                }
                this._applyInitialTransitionClasses('enter', childEl)
                maybeCall(this.props.onBeforeEnter, childEl)
                onNextFrame(() => {
                    if (this.props.onEnter && this.props.onEnter.length >= 2) {
                        this._applyActiveTransitionClasses('enter', childEl)
                        this.props.onEnter(childEl, this._afterEnterCallback(childEl))
                    } else {
                        this._applyActiveTransitionClasses('enter', childEl)
                        maybeCall(this.props.onEnter, childEl)
                        this._onTransitionsEnd('enter', childEl, this._afterEnterCallback(childEl))
                    }
                })
            }
        )
    }

    private _transitionChildOut = () => {
        const oldChildEl = this.oldChildRef
        if (!oldChildEl) return
        this._safelySetState({
            isLeaving: true
        })
        this._applyInitialTransitionClasses('leave', oldChildEl)
        maybeCall(this.props.onBeforeLeave, oldChildEl)
        onNextFrame(() => {
            if (this.props.onLeave && this.props.onLeave.length >= 2) {
                this._applyActiveTransitionClasses('leave', oldChildEl)
                this.props.onLeave(oldChildEl, this._afterLeaveCallback(oldChildEl))
            } else {
                this._applyActiveTransitionClasses('leave', oldChildEl)
                maybeCall(this.props.onLeave, oldChildEl)
                this._onTransitionsEnd('leave', oldChildEl, this._afterLeaveCallback(oldChildEl))
            }
        })
    }

    private _afterEnterCallback = (el: HTMLElement) => () => {
        this._timeoutClears.enter = null
        this._applyPostAnimationClasses('enter', el)
        maybeCall(this.props.onAfterEnter, el)
        this._safelySetState(
            {
                isEntering: false
            },
            this.props.mode === 'in-out' ? this._transitionChildOut : noop
        )
    }

    private _afterLeaveCallback = (el: HTMLElement) => () => {
        this._timeoutClears.leave = null
        this._applyPostAnimationClasses('leave', el)
        maybeCall(this.props.onAfterLeave, el)
        this._safelySetState(
            {
                oldChild: null,
                isLeaving: false
            },
            this.props.mode === 'out-in' ? this._transitionChildIn : noop
        )
    }

    private _onTransitionsEnd(type: 'appear' | EnterOrLeave, el: HTMLElement, callback: Function) {
        if (this.props.duration || this.props.noCss) {
            let timeout = window.setTimeout(callback, this.props.duration || 0)
            this._timeoutClears[type] = () => window.clearTimeout(timeout)
        } else {
            this._timeoutClears[type] = onAllTransitionsEnd(this.props.type, el, callback)
        }
    }

    // TODO: emit cancel events for JS-only transitions?
    // timeouts are only set for autoCss and duration-based transitions
    // TODO: remove classes when transitions are interrupted
    private _clearTimeouts() {
        if (this._timeoutClears.appear) {
            this._timeoutClears.appear()
            maybeCall(this.props.onCancelAppear, this.childRef || this.oldChildRef)
        }
        if (this._timeoutClears.enter) {
            this._timeoutClears.enter()
            maybeCall(this.props.onCancelEnter, this.childRef || this.oldChildRef)
        }
        if (this._timeoutClears.leave) {
            this._timeoutClears.leave()
            maybeCall(this.props.onCancelLeave, this.oldChildRef || this.childRef)
        }
    }

    private _getInitialClass(type: EnterOrLeave) {
        return type === 'enter'
            ? this.props.enterClass || `${this.prefix}-enter`
            : this.props.leaveClass || `${this.prefix}-leave`
    }

    private _getActiveClass(type: EnterOrLeave) {
        return type === 'enter'
            ? this.props.enteringClass || `${this.prefix}-entering`
            : this.props.leavingClass || `${this.prefix}-leaving`
    }

    private _getPostClass(type: EnterOrLeave) {
        return type === 'enter'
            ? this.props.enterToClass || `${this.prefix}-enter-to`
            : this.props.leaveToClass || `${this.prefix}-leave-to`
    }

    private _applyInitialTransitionClasses(type: EnterOrLeave, el: HTMLElement) {
        el.classList.add(this._getInitialClass(type))
        el.classList.add(this._getActiveClass(type))
    }

    private _applyActiveTransitionClasses(type: EnterOrLeave, el: HTMLElement) {
        el.classList.remove(this._getInitialClass(type))
        el.classList.add(this._getPostClass(type))
    }

    private _applyPostAnimationClasses(type: EnterOrLeave, el: HTMLElement) {
        el.classList.remove(this._getActiveClass(type))
        el.classList.remove(this._getPostClass(type))
    }
}

export default Transition
