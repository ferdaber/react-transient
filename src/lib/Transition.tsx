import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { onAllTransitionsEnd } from './transition-utils'
import { componentsEqual, maybeCall, noop, onNextFrame } from './utils'

class TransitionWrapper extends React.Component {
    render() {
        return this.props.children as React.ReactElement<{}> | React.ReactElement<{}>[]
    }
}

export interface TransitionProps
    extends Partial<{
            name: string
            appear: boolean
            duration: number
            type: 'animation' | 'transition'
            mode: 'in-out' | 'out-in'

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
        }> {
    children: React.ReactElement<{}>
}

export interface TransitionState {
    child: React.ReactElement<{}>
    oldChild: React.ReactElement<{}>
    isEntering: boolean
    isLeaving: boolean
}

type EnterOrLeave = 'enter' | 'leave'

export default class Transition extends React.Component<TransitionProps, TransitionState> {
    _childRef: React.ReactInstance
    _oldChildRef: React.ReactInstance
    _timeoutClears = {
        appear: null as Function,
        enter: null as Function,
        leave: null as Function
    }

    state: TransitionState = {
        child: this._getChild(this.props),
        oldChild: null,
        isEntering: false,
        isLeaving: false
    }

    componentDidMount() {
        if (this.props.appear) {
            // set up new element to enter before next frame
            this._applyInitialTransitionClasses('enter', this.childRef)
            maybeCall(this.props.onBeforeAppear, this.childRef)

            onNextFrame(() => {
                // new element is now entering, wait for after-appear
                const doneCallback = () => {
                    this._timeoutClears.appear = null
                    this._applyPostAnimationClasses('enter', this.childRef)
                    maybeCall(this.props.onAfterAppear, this.childRef)
                }
                // order of priority:
                // explicitly defined done callback > props.duration defined > autoCss sniffing
                if (this.props.onAppear && this.props.onAppear.length >= 2) {
                    this._applyActiveTransitionClasses('enter', this.childRef)
                    this.props.onAppear(this.childRef, doneCallback)
                } else {
                    this._applyActiveTransitionClasses('enter', this.childRef)
                    maybeCall(this.props.onAppear, this.childRef)
                    this._onTransitionsEnd('appear', this.childRef, doneCallback)
                }
            })
        }
    }

    componentWillReceiveProps(nextProps: Readonly<TransitionProps>) {
        // React will not attempt to replace elements
        // render the child with the new props
        if (componentsEqual(this.props.children, nextProps.children)) {
            this.setState({
                child: React.Children.only(nextProps.children)
            })
        }
    }

    componentDidUpdate(prevProps: Readonly<TransitionProps>) {
        // children have changed, React is going to replace elements
        // transition the element out
        if (!componentsEqual(this.props.children, prevProps.children)) {
            this._clearTimeouts()
            this.setState(
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
    }

    render() {
        if (this.props.mode === 'out-in') {
            return this.state.oldChild ? (
                <TransitionWrapper ref={(ref: React.ReactInstance) => (this._oldChildRef = ref)}>
                    {this.state.oldChild}
                </TransitionWrapper>
            ) : (
                <TransitionWrapper ref={(ref: React.ReactInstance) => (this._childRef = ref)}>
                    {this.state.child}
                </TransitionWrapper>
            )
        } else {
            return (
                <TransitionWrapper>
                    <TransitionWrapper ref={(ref: React.ReactInstance) => (this._oldChildRef = ref)}>
                        {this.state.oldChild}
                    </TransitionWrapper>
                    <TransitionWrapper ref={(ref: React.ReactInstance) => (this._childRef = ref)}>
                        {this.state.child}
                    </TransitionWrapper>
                </TransitionWrapper>
            )
        }
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

    _getChild(props: TransitionProps) {
        return React.Children.only(props.children)
    }

    _transitionChildIn = () => {
        this.setState(
            {
                isEntering: true,
                child: this._getChild(this.props)
            },
            () => {
                this._applyInitialTransitionClasses('enter', this.childRef)
                maybeCall(this.props.onBeforeEnter, this.childRef)
                onNextFrame(() => {
                    if (this.props.onEnter && this.props.onEnter.length >= 2) {
                        this._applyActiveTransitionClasses('enter', this.childRef)
                        this.props.onEnter(this.childRef, this._afterEnterCallback)
                    } else {
                        this._applyActiveTransitionClasses('enter', this.childRef)
                        maybeCall(this.props.onEnter, this.childRef)
                        this._onTransitionsEnd('enter', this.childRef, this._afterEnterCallback)
                    }
                })
            }
        )
    }

    _transitionChildOut = () => {
        this.setState(
            {
                isLeaving: true
            },
            () => {
                this._applyInitialTransitionClasses('leave', this.oldChildRef)
                maybeCall(this.props.onBeforeLeave, this.oldChildRef)
                onNextFrame(() => {
                    if (this.props.onLeave && this.props.onLeave.length >= 2) {
                        this._applyActiveTransitionClasses('leave', this.oldChildRef)
                        this.props.onLeave(this.oldChildRef, this._afterLeaveCallback)
                    } else {
                        this._applyActiveTransitionClasses('leave', this.oldChildRef)
                        maybeCall(this.props.onLeave, this.oldChildRef)
                        this._onTransitionsEnd('leave', this.oldChildRef, this._afterLeaveCallback)
                    }
                })
            }
        )
    }

    _afterEnterCallback = () => {
        this._timeoutClears.enter = null
        this._applyPostAnimationClasses('enter', this.childRef)
        maybeCall(this.props.onAfterEnter, this.childRef)
        this.setState(
            {
                isEntering: false
            },
            this.props.mode === 'in-out' ? this._transitionChildOut : noop
        )
    }

    _afterLeaveCallback = () => {
        this._timeoutClears.leave = null
        this._applyPostAnimationClasses('leave', this.oldChildRef)
        maybeCall(this.props.onAfterLeave, this.oldChildRef)
        this.setState(
            {
                oldChild: null,
                isLeaving: false
            },
            this.props.mode === 'out-in' ? this._transitionChildIn : noop
        )
    }

    _onTransitionsEnd(type: 'appear' | EnterOrLeave, el: HTMLElement, callback: Function) {
        if (this.props.duration) {
            let timeout = window.setTimeout(callback, this.props.duration)
            this._timeoutClears[type] = () => window.clearTimeout(timeout)
        } else {
            this._timeoutClears[type] = onAllTransitionsEnd(this.props.type, el, callback)
        }
    }

    _clearTimeouts() {
        if (this._timeoutClears.appear) {
            this._timeoutClears.appear()
            maybeCall(this.props.onCancelAppear, this.childRef)
        }
        if (this._timeoutClears.enter) {
            this._timeoutClears.enter()
            maybeCall(this.props.onCancelEnter, this.childRef)
        }
        if (this._timeoutClears.leave) {
            this._timeoutClears.leave()
            maybeCall(this.props.onCancelLeave, this.childRef)
        }
    }

    _getInitialClass(type: EnterOrLeave) {
        return type === 'enter'
            ? this.props.enterClass || `${this.prefix}-enter`
            : this.props.leaveClass || `${this.prefix}-leave`
    }

    _getActiveClass(type: EnterOrLeave) {
        return type === 'enter'
            ? this.props.enteringClass || `${this.prefix}-entering`
            : this.props.leavingClass || `${this.prefix}-leaving`
    }

    _getPostClass(type: EnterOrLeave) {
        return type === 'enter'
            ? this.props.enterToClass || `${this.prefix}-enter-to`
            : this.props.leaveToClass || `${this.prefix}-leave-to`
    }

    _applyInitialTransitionClasses(type: EnterOrLeave, el: HTMLElement) {
        el.classList.add(this._getInitialClass(type))
        el.classList.add(this._getActiveClass(type))
    }

    _applyActiveTransitionClasses(type: EnterOrLeave, el: HTMLElement) {
        el.classList.remove(this._getInitialClass(type))
        el.classList.add(this._getPostClass(type))
    }

    _applyPostAnimationClasses(type: EnterOrLeave, el: HTMLElement) {
        el.classList.remove(this._getActiveClass(type))
        el.classList.remove(this._getPostClass(type))
    }
}
