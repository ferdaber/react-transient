import * as React from 'react'
import * as ReactDOM from 'react-dom'

import TransitionWrapper, { WrapperComponent } from './TransitionWrapper'

import { onAllTransitionsEnd } from './transition-utils'
import { componentsEqual, maybeCall, noop, onNextFrame } from './utils'

export interface TransitionProps
    extends Partial<{
            name: string
            appear: boolean
            duration: number
            type: 'animation' | 'transition'
            mode: 'in-out' | 'out-in'
            component: WrapperComponent

            enterClass: string
            enteringClass: string
            enterToClass: string

            leaveClass: string
            leavingClass: string
            leaveToClass: string

            onBeforeAppear(el: HTMLElement): void
            onAppear(el: HTMLElement, done: () => void): void
            onAfterAppear(el: HTMLElement): void
            onCancelAppear(el: HTMLElement): void

            onBeforeEnter(el: HTMLElement): void
            onEnter(el: HTMLElement, done: () => void): void
            onAfterEnter(el: HTMLElement): void
            onCancelEnter(el: HTMLElement): void

            onBeforeLeave(el: HTMLElement): void
            onLeave(el: HTMLElement, done: () => void): void
            onAfterLeave(el: HTMLElement): void
            onCancelLeave(el: HTMLElement): void
        }> {}

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
        return this.state.oldChild ? (this.props.mode === 'out-in' ? oldChild : bothChildren) : child
    }

    get prefix() {
        const prefix = this.props.name || 't'
        return `${prefix}`
    }

    get childRef() {
        return ReactDOM.findDOMNode(this._childRef) as HTMLElement
    }

    get oldChildRef() {
        return ReactDOM.findDOMNode(this._oldChildRef) as HTMLEmbedElement
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
                if (!childEl) return
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
        this._safelySetState(
            {
                isLeaving: true
            },
            () => {
                const oldChildEl = this.oldChildRef
                if (!oldChildEl) return
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
        )
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
        if (this.props.duration) {
            let timeout = window.setTimeout(callback, this.props.duration)
            this._timeoutClears[type] = () => window.clearTimeout(timeout)
        } else {
            this._timeoutClears[type] = onAllTransitionsEnd(this.props.type, el, callback)
        }
    }

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
