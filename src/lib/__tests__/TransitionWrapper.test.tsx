import { TransitionWrapper } from '../TransitionWrapper'
import * as React from 'react'
import { shallow } from 'enzyme'

jest.mock('./utils', () => ({
    canRenderFragments() {
        return false
    }
}))

describe('Transition wrapper', () => {
    it('wraps components in a wrapper div for multiple children', () => {
        const wrapper = shallow(
            <TransitionWrapper>
                <div>Foo</div>
                <div>Bar</div>
            </TransitionWrapper>
        )
        expect(wrapper.children().type()).toBe('div')
    })
})
