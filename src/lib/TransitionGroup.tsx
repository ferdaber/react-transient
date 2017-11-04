import { onAllTransitionsEnd } from './transition-utils'
import * as React from 'react'
import * as ReactDOM from 'react-dom'

import Transition, { TransitionProps } from './Transition'
import TransitionWrapper from './TransitionWrapper'

import { insertAtIndex, maybeCall, onNextFrame, noop } from './utils'

export interface TransitionGroupProps extends TransitionProps {
    children: JSX.Element | JSX.Element[]
}

export interface TransitionGroupState {
    children: Child[]
}

export interface Child {
    key: React.Key
    element: JSX.Element
}

interface ChildPosition {
    clientRect: ClientRect
    key: React.Key
}

export class TransitionGroup extends React.Component<TransitionGroupProps, TransitionGroupState> {
    state: TransitionGroupState = {
        children: this._wrapChildren(this.props)
    }

    private _refs: {
        [key: string]: Transition
    } = Object.create(null)
    private _timeouts: {
        [key: string]: Function
    } = Object.create(null)
    private _movingChildren: ChildPosition[]

    componentWillReceiveProps(nextProps: TransitionGroupProps) {
        const children = this.state.children
        const nextChildren = this._wrapChildren(nextProps)
        const mergedChildren: Child[] = []
        this._movingChildren = []
        for (let i = 0; i < Math.max(children.length, nextChildren.length); i++) {
            const child = children[i]
            const nextChildIndex = child && nextChildren.findIndex(c => c.key === child.key)
            const newChild = nextChildren[i] && !children.some(c => c.key === nextChildren[i].key) && nextChildren[i]
            if (nextChildIndex >= 0) {
                // child exists already, but may have moved
                insertAtIndex(mergedChildren, nextChildren[nextChildIndex], nextChildIndex)
                if (!this.props.noCss) {
                    let oldElement = ReactDOM.findDOMNode(this._refs[child.key]) as HTMLElement
                    oldElement.style.transform = ''
                    this._movingChildren.push({
                        clientRect: oldElement.getBoundingClientRect(),
                        key: child.key
                    })
                }
            } else if (nextChildIndex === -1) {
                // child is leaving
                const oldOnAfterLeave = child.element.props.onAfterLeave
                insertAtIndex(
                    mergedChildren,
                    {
                        key: child.key,
                        element: React.cloneElement(child.element, {
                            children: null,
                            onAfterLeave: (el: HTMLElement) => {
                                maybeCall(oldOnAfterLeave, el)
                                this._unmountAtKey(child.key)
                            }
                        })
                    },
                    i
                )
            }
            if (newChild) {
                // a new child is transitioning in
                insertAtIndex(mergedChildren, newChild, i)
            }
            this.setState(
                {
                    children: mergedChildren
                },
                this.props.noCss
                    ? noop
                    : () => {
                          this._clearTransitions()
                          this._movingChildren.forEach(childPosition => {
                              const el = ReactDOM.findDOMNode(this._refs[childPosition.key]) as HTMLElement
                              this._transitionChildMove(childPosition.clientRect, el, childPosition.key)
                          })
                      }
            )
        }
    }

    render() {
        return (
            <TransitionWrapper component={this.props.component}>
                {this.state.children.map(child => child.element)}
            </TransitionWrapper>
        )
    }

    get strippedProps() {
        const { children, ...restProps } = this.props
        return restProps
    }

    get moveClassName() {
        return `${this.props.name || 't'}-move`
    }

    private _wrapChildren(props: TransitionGroupProps): Child[] {
        return React.Children.map(props.children, (child: JSX.Element) => ({
            key: child.key,
            element:
                child.type === Transition ? (
                    React.cloneElement(child, {
                        ...this.strippedProps,
                        appear: true,
                        key: child.key,
                        ref: (ref: Transition) => (this._refs[child.key] = ref)
                    } as TransitionProps)
                ) : (
                    <Transition
                        {...this.strippedProps}
                        appear
                        key={child.key}
                        ref={ref => (this._refs[child.key] = ref)}
                    >
                        {child}
                    </Transition>
                )
        }))
    }

    private _unmountAtKey(key: React.Key) {
        const children = [...this.state.children]
        const indexToUnmount = this.state.children.findIndex(c => c.key === key)
        children.splice(indexToUnmount, 1)
        this.setState({
            children
        })
    }

    private _clearTransitions() {
        for (const key in this._timeouts) {
            if (this._timeouts[key]) {
                this._timeouts[key]()
            }
        }
    }

    private _transitionChildMove(oldClientRect: ClientRect, childEl: HTMLElement, key: React.Key) {
        if (!childEl) return
        const { left, top } = childEl.getBoundingClientRect()
        const dLeft = oldClientRect.left - left
        const dTop = oldClientRect.top - top
        if (dLeft === 0 && dTop === 0) return
        childEl.style.transform = `translate(${dLeft}px, ${dTop}px)`

        onNextFrame(() => {
            childEl.classList.add(this.moveClassName)
            childEl.style.transform = ''
            const doneCallback = () => {
                childEl.classList.remove(this.moveClassName)
                this._timeouts[key] = null
            }
            const clearTransition = onAllTransitionsEnd('transition', childEl, doneCallback)
            this._timeouts[key] = () => {
                clearTransition()
                doneCallback()
            }
        })
    }
}

export default TransitionGroup
