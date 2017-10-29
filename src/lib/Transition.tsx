import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { onAllTransitionsEnd } from './transition-utils'
import { canRenderFragments, componentsEqual, maybeCall, noop, onNextFrame } from './utils'

interface TransitionWrapperProps {
    component?: string | React.SFC<any> | React.ComponentClass<any>
    children: JSX.Element | JSX.Element[]
}
class TransitionWrapper extends React.Component<TransitionWrapperProps, {}> {
    render() {
        const Wrapper = this.props.component || 'div'
        return React.Children.count(this.props.children) > 1 ? (
            canRenderFragments() ? (
                this.props.children
            ) : (
                <Wrapper>{this.props.children}</Wrapper>
            )
        ) : (
            this.props.children
        )
    }
}

export interface TransitionProps
    extends Partial<{
            name: string
            appear: boolean
            duration: number
            type: 'animation' | 'transition'
            mode: 'in-out' | 'out-in'
            component: string | React.SFC<any> | React.ComponentClass<any>

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
    children: JSX.Element
}

export interface TransitionState {
    child: JSX.Element
    oldChild: JSX.Element
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
        isEntering: !!this.props.appear,
        isLeaving: false
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
        if (
            !componentsEqual(this.props.children, prevProps.children) &&
            // prevent transition interruptions while an element is leaving in out-in mode
            !(this.props.mode === 'out-in' && this.state.isLeaving)
        ) {
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
                const childEl = this.childRef
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

    _transitionChildOut = () => {
        this.setState(
            {
                isLeaving: true
            },
            () => {
                const oldChildEl = this.oldChildRef
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

    _afterEnterCallback = (el: HTMLElement) => () => {
        this._timeoutClears.enter = null
        this._applyPostAnimationClasses('enter', el)
        maybeCall(this.props.onAfterEnter, el)
        this.setState(
            {
                isEntering: false
            },
            this.props.mode === 'in-out' ? this._transitionChildOut : noop
        )
    }

    _afterLeaveCallback = (el: HTMLElement) => () => {
        this._timeoutClears.leave = null
        this._applyPostAnimationClasses('leave', el)
        maybeCall(this.props.onAfterLeave, el)
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
            maybeCall(this.props.onCancelLeave, this.oldChildRef || this.childRef)
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
