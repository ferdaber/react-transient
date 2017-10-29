import * as React from 'react'

import Transition, { TransitionProps } from './Transition'
import TransitionWrapper from './TransitionWrapper'

import { insertAtIndex, maybeCall } from './utils'

export interface TransitionGroupProps extends TransitionProps {
    children: JSX.Element | JSX.Element[]
}

export interface TransitionGroupState {
    children: JSX.Element[]
}

export class TransitionGroup extends React.Component<TransitionGroupProps, TransitionGroupState> {
    state: TransitionGroupState = {
        children: this._wrapChildren(this.props)
    }

    componentWillReceiveProps(nextProps: TransitionGroupProps) {
        const children = this.state.children
        const nextChildren = this._wrapChildren(nextProps)
        const mergedChildren: JSX.Element[] = []
        for (let i = 0; i < Math.max(children.length, nextChildren.length); i++) {
            const child = children[i]
            const nextChildIndex = child && nextChildren.findIndex(c => c.key === child.key)
            const newChild = nextChildren[i] && !children.some(c => c.key === nextChildren[i].key) && nextChildren[i]
            if (nextChildIndex >= 0) {
                // child exists already, but may have moved
                insertAtIndex(mergedChildren, nextChildren[nextChildIndex], nextChildIndex)
            } else if (nextChildIndex === -1) {
                // child is leaving
                const oldOnAfterLeave = child.props.onAfterLeave
                insertAtIndex(
                    mergedChildren,
                    React.cloneElement(child, {
                        children: null,
                        onAfterLeave: (el: HTMLElement) => {
                            maybeCall(oldOnAfterLeave, el)
                            this._unmountAtKey(child.key)
                        }
                    }),
                    i
                )
            }
            if (newChild) {
                // a new child is transitioning in
                insertAtIndex(mergedChildren, newChild, i)
            }
        }
        this.setState({
            children: mergedChildren
        })
    }

    render() {
        return <TransitionWrapper component={this.props.component}>{this.state.children}</TransitionWrapper>
    }

    get strippedProps() {
        const { children, ...restProps } = this.props
        return restProps
    }

    private _wrapChildren(props: TransitionGroupProps) {
        return React.Children.map(props.children, (child: JSX.Element) => (
            <Transition {...this.strippedProps} appear key={child.key}>
                {child}
            </Transition>
        ))
    }

    private _unmountAtKey(key: React.Key) {
        const children = [...this.state.children]
        const indexToUnmount = this.state.children.findIndex(c => c.key === key)
        children.splice(indexToUnmount, 1)
        this.setState({
            children
        })
    }
}

export default TransitionGroup
