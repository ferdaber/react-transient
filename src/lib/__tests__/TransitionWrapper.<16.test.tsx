import { TransitionWrapper } from '../TransitionWrapper'
import * as React from 'react'
import { mount } from 'enzyme'

jest.mock('../utils', () => ({
    canRenderFragments() {
        return false
    }
}))

class Foo extends React.Component {
    render() {
        return <div>{this.props.children}</div>
    }
}

describe('Transition wrapper', () => {
    it('wraps components in a wrapper div for multiple children', () => {
        const wrapper = mount(
            <TransitionWrapper>
                <div>Foo</div>
                <div>Bar</div>
            </TransitionWrapper>
        )
        expect(wrapper.children().type()).toBe('div')
    })

    it('wraps components in a custom component for multiple children', () => {
        const wrapper = mount(
            <TransitionWrapper component={Foo}>
                <div>Foo</div>
                <div>Bar</div>
            </TransitionWrapper>
        )
        expect(wrapper.children().type()).toBe(Foo)
    })

    it('does not wrap a component for a single child', () => {
        const wrapper = mount(
            <TransitionWrapper>
                <Foo />
            </TransitionWrapper>
        )
        expect(wrapper.children().type()).toBe(Foo)
    })
})
