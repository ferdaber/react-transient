import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { componentsEqual, maybeCall, onAllTransitionsEnd, raf } from './utils'

class TransitionWrapper extends React.Component {
    render() {
        return React.Children.only(this.props.children)
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
    isEntering: boolean
    isLeaving: boolean
}

type EnterOrLeave = 'enter' | 'leave'

export default class Transition extends React.Component<TransitionProps, TransitionState> {
    _childRef: React.ReactInstance
    _timeoutClears = {
        appear: null as Function,
        enter: null as Function,
        leave: null as Function
    }

    state: TransitionState = {
        child: this.child,
        isEntering: false,
        isLeaving: false
    }

    componentDidMount() {
        if (this.props.appear) {
            // set up new element to enter before next frame
            maybeCall(this.props.onBeforeAppear, this.childRef)
            this._applyInitialTransitionClasses('enter')

            raf(() => {
                raf(() => {
                    // new element is now entering, wait for after-appear
                    const doneCallback = () => {
                        this._timeoutClears.appear = null
                        this._applyPostAnimationClasses('enter')
                        maybeCall(this.props.onAfterAppear, this.childRef)
                    }
                    if (this.props.onAppear && this.props.onAppear.length >= 2) {
                        // if there is done callback expected, call onAfterAppear right away
                        this._applyActiveTransitionClasses('enter')
                        this.props.onAppear(this.childRef, doneCallback)
                    } else {
                        this._applyActiveTransitionClasses('enter')
                        maybeCall(this.props.onAppear, this.childRef)
                        this._onTransitionsEnd('appear', doneCallback)
                    }
                })
            })
        }
    }

    componentWillReceiveProps(nextProps: Readonly<TransitionProps>) {
        // React will not attempt to replace elements
        // render the child with the new props
        if (componentsEqual(this.props.children, nextProps.children) && !this.state.isLeaving) {
            this.setState({
                child: React.Children.only(nextProps.children)
            })
        }
    }

    componentDidUpdate(prevProps: Readonly<TransitionProps>) {
        function startEnterCallback(this: Transition) {
            maybeCall(this.props.onBeforeEnter, this.childRef)
            this._applyInitialTransitionClasses('enter')

            raf(() => {
                raf(() => {
                    const doneCallback = () => {
                        this._timeoutClears.enter = null
                        this._applyPostAnimationClasses('enter')
                        this.setState({
                            isEntering: false
                        })
                        maybeCall(this.props.onAfterEnter, this.childRef)
                    }

                    if (this.props.onEnter && this.props.onEnter.length >= 2) {
                        this.props.onEnter(this.childRef, doneCallback)
                        this._applyActiveTransitionClasses('enter')
                    } else {
                        maybeCall(this.props.onEnter, this.childRef)
                        this._applyActiveTransitionClasses('enter')
                        this._onTransitionsEnd('enter', doneCallback)
                    }
                })
            })
        }
        // children have changed, React is going to replace elements
        // transition the element out
        if (!componentsEqual(this.props.children, prevProps.children)) {
            maybeCall(this.props.onBeforeLeave, this.childRef)
            this._applyInitialTransitionClasses('leave')
            this.setState({
                isLeaving: true
            })

            raf(() => {
                raf(() => {
                    const doneCallback = () => {
                        this._timeoutClears.leave = null
                        const prevRef = this.childRef
                        this._applyPostAnimationClasses('leave')
                        maybeCall(this.props.onAfterLeave, prevRef)
                        this.setState(
                            {
                                child: this.child,
                                isEntering: true,
                                isLeaving: false
                            },
                            startEnterCallback
                        )
                    }

                    if (this.props.onLeave && this.props.onLeave.length >= 2) {
                        this.props.onLeave(this.childRef, doneCallback)
                        this._applyActiveTransitionClasses('leave')
                    } else {
                        maybeCall(this.props.onLeave, this.childRef)
                        this._applyActiveTransitionClasses('leave')
                        this._onTransitionsEnd('leave', doneCallback)
                    }
                })
            })
        }
    }

    componentWillUnmount() {
        this._clearTimeouts()
    }

    render() {
        return <TransitionWrapper ref={this._setRef}>{this.state.child}</TransitionWrapper>
    }

    get child() {
        return React.Children.only(this.props.children)
    }

    get childRef() {
        return ReactDOM.findDOMNode(this._childRef) as HTMLElement
    }

    get prefix() {
        const prefix = this.props.name || 't'
        return `${prefix}`
    }

    _setRef = (ref: React.ReactInstance) => {
        this._childRef = ref
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

    _onTransitionsEnd(type: 'appear' | EnterOrLeave, callback: Function) {
        if (this.props.duration) {
            let timeout = window.setTimeout(callback, this.props.duration)
            this._timeoutClears[type] = () => window.clearTimeout(timeout)
        } else {
            this._timeoutClears[type] = onAllTransitionsEnd(this.props.type, this.childRef, callback)
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

    _applyInitialTransitionClasses(type: EnterOrLeave) {
        this.childRef.classList.add(this._getInitialClass(type))
        this.childRef.classList.add(this._getActiveClass(type))
    }

    _applyActiveTransitionClasses(type: EnterOrLeave) {
        this.childRef.classList.remove(this._getInitialClass(type))
        this.childRef.classList.add(this._getPostClass(type))
    }

    _applyPostAnimationClasses(type: EnterOrLeave) {
        this.childRef.classList.remove(this._getActiveClass(type))
        this.childRef.classList.remove(this._getPostClass(type))
    }
}
