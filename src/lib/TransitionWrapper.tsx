import * as React from 'react'

import { canRenderFragments } from './utils'

export type WrapperComponent = string | React.SFC<any> | React.ComponentClass<any>

export interface TransitionWrapperProps {
    component?: WrapperComponent
    children: JSX.Element | JSX.Element[]
}
export class TransitionWrapper extends React.Component<TransitionWrapperProps, {}> {
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

export default TransitionWrapper
