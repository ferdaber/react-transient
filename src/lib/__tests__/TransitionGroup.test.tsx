import * as React from 'react'
import { mount, ReactWrapper } from 'enzyme'

import { TransitionWrapper } from '../TransitionWrapper'
import { Transition } from '../Transition'
import { TransitionGroup, TransitionGroupProps, TransitionGroupState } from '../TransitionGroup'

const foos = Array(5)
    .fill(0)
    .map((noop, idx) => <div key={idx}>{`Foo #${idx}`}</div>)

describe('Transition group', () => {
    let el: ReactWrapper<TransitionGroupProps, TransitionGroupState>

    const getRenderedChildren = (wrapperElement: ReactWrapper<TransitionGroupProps, TransitionGroupState>) =>
        wrapperElement
            .children()
            .children()
            .getElements()

    it('renders correctly', () => {
        el = mount(<TransitionGroup>{foos}</TransitionGroup>)
        expect(el.children().type()).toBe(TransitionWrapper)
        expect(getRenderedChildren(el).length).toBe(5)
        el
            .children()
            .children()
            .forEach((e, idx) => {
                expect(e.getDOMNode().textContent).toBe(`Foo #${idx}`)
            })
    })

    it('uses its name prop correctly', () => {
        el = mount(<TransitionGroup name="foo">{foos}</TransitionGroup>)
        getRenderedChildren(el).forEach(e => {
            expect(e.props.name).toBe('foo')
        })
        el
            .children()
            .children()
            .forEach(e => {
                expect(e.getDOMNode().classList).toContain('foo-enter')
            })
    })

    it('hardcodes appear to all children', () => {
        el = mount(<TransitionGroup appear={false}>{foos}</TransitionGroup>)
        getRenderedChildren(el).forEach(e => {
            expect(e.props.appear).toBe(true)
        })
    })

    it('allows customized Transition children', () => {
        el = mount(
            <TransitionGroup>
                {foos.map((e, idx) => (
                    <Transition key={idx} name={`foo-${idx}`}>
                        {e}
                    </Transition>
                ))}
            </TransitionGroup>
        )
        getRenderedChildren(el).forEach((e, idx) => {
            expect(e.type).toBe(Transition)
            expect(e.props.name).toBe(`foo-${idx}`)
        })
    })
})
