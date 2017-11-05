import { TransitionWrapper } from '../TransitionWrapper'
import * as React from 'react'
import { mount } from 'enzyme'

class Foo extends React.Component {
    render() {
        return <div>{this.props.children}</div>
    }
}

describe('Transition wrapper', () => {
    it('does not wrap components for multiple children', () => {
        const wrapper = mount(
            <TransitionWrapper>
                <div>Foo</div>
                <Foo>Bar</Foo>
            </TransitionWrapper>
        )
        expect(wrapper.children().length).toBe(2)
        expect(
            wrapper
                .children()
                .at(0)
                .type()
        ).toBe('div')
        expect(
            wrapper
                .children()
                .at(1)
                .type()
        ).toBe(Foo)
    })
})
