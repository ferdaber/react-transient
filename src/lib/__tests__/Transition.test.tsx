import * as React from 'react'
import { mount, ReactWrapper } from 'enzyme'

import { onNextFrame } from '../utils'
import { TransitionWrapper } from '../TransitionWrapper'
import { Transition, SingleTransitionProps, TransitionProps, TransitionState } from '../Transition'

describe('Transition', () => {
    let getComputedStyleSpy: jest.Mock
    let el: ReactWrapper<SingleTransitionProps, TransitionState>
    const foo = <div key="foo">Foo!</div>
    const bar = <div key="bar">Bar!</div>

    const getRenderedChildren = (wrapperElement: ReactWrapper<TransitionProps, TransitionState>) =>
        wrapperElement
            .children()
            .children()
            .getElements()

    const tryOnNextFrame = (done: jest.DoneCallback, callback: Function) => {
        onNextFrame(() => {
            try {
                callback()
            } catch (e) {
                done.fail(e)
            }
        })
    }

    beforeAll(() => {
        getComputedStyleSpy = jest.spyOn(window, 'getComputedStyle').mockReturnValue({
            animationDuration: '0s',
            animationDelay: '0s',
            transitionDuration: '0s',
            transitionDelay: '0s'
        })
    })

    afterEach(() => {
        getComputedStyleSpy.mockClear()
    })

    it('renders correctly', () => {
        el = mount(<Transition>{foo}</Transition>)
        expect(el.children().type()).toBe(TransitionWrapper)
        expect(getRenderedChildren(el)).toContainEqual(foo)
    })

    it('uses appear props correctly on mount', done => {
        const onBeforeAppear = jest.fn(),
            onAppear = jest.fn(),
            onAfterAppear = jest.fn(),
            onEnter = jest.fn()
        el = mount(
            <Transition
                appear
                onBeforeAppear={onBeforeAppear}
                onAppear={onAppear}
                onAfterAppear={onAfterAppear}
                onEnter={onEnter}
            >
                {foo}
            </Transition>
        )
        const node = el.getDOMNode()
        expect(node.classList).toContain('t-enter')
        expect(onBeforeAppear).toBeCalledWith(node)
        expect(onAppear).not.toBeCalled()
        expect(onEnter).not.toBeCalled()
        tryOnNextFrame(done, () => {
            expect(node.classList).not.toContain('t-enter')
            expect(node.classList).toContain('t-enter-to')
            expect(node.classList).toContain('t-entering')
            expect(onAppear).toBeCalledWith(node)
            expect(onAfterAppear).not.toBeCalled()
            expect(onEnter).not.toBeCalled()
            tryOnNextFrame(done, () => {
                expect(node.classList).not.toContain('t-enter-to')
                expect(node.classList).not.toContain('t-entering')
                expect(onAfterAppear).toBeCalledWith(node)
                done()
            })
        })
    })

    it('uses enter props correctly', done => {
        const onBeforeEnter = jest.fn(),
            onEnter = jest.fn(),
            onAfterEnter = jest.fn()
        el = mount(
            <Transition onBeforeEnter={onBeforeEnter} onEnter={onEnter} onAfterEnter={onAfterEnter}>
                {null}
            </Transition>
        )
        el
            .setProps({
                children: foo
            })
            .update()
        const node = el.getDOMNode()
        expect(getRenderedChildren(el)).toContainEqual(foo)
        expect(node).toBeTruthy()
        expect(node.classList).toContain('t-enter')
        expect(onBeforeEnter).toBeCalledWith(node)
        expect(onEnter).not.toBeCalled()
        expect(el.instance().state.isEntering).toBe(true)
        tryOnNextFrame(done, () => {
            expect(node.classList).not.toContain('t-enter')
            expect(node.classList).toContain('t-entering')
            expect(node.classList).toContain('t-enter-to')
            expect(onEnter).toBeCalledWith(node)
            expect(onAfterEnter).not.toBeCalled()
            tryOnNextFrame(done, () => {
                expect(node.classList).not.toContain('t-entering')
                expect(node.classList).not.toContain('t-enter-to')
                expect(onAfterEnter).toBeCalledWith(node)
                expect(el.instance().state.isEntering).toBe(false)
                expect(el.instance().state.isLeaving).toBe(false)
                done()
            })
        })
    })

    it('uses leave props correctly', done => {
        const onBeforeLeave = jest.fn(),
            onLeave = jest.fn(),
            onAfterLeave = jest.fn()
        el = mount(
            <Transition onBeforeLeave={onBeforeLeave} onLeave={onLeave} onAfterLeave={onAfterLeave}>
                {foo}
            </Transition>
        )
        el
            .setProps({
                children: null
            })
            .update()
        const node = el.getDOMNode()
        expect(getRenderedChildren(el)).toContainEqual(foo)
        expect(node).toBeTruthy()
        expect(node.classList).toContain('t-leave')
        expect(onBeforeLeave).toBeCalledWith(node)
        expect(onLeave).not.toBeCalled()
        expect(el.instance().state.isLeaving).toBe(true)
        tryOnNextFrame(done, () => {
            expect(node.classList).not.toContain('t-leave')
            expect(node.classList).toContain('t-leaving')
            expect(node.classList).toContain('t-leave-to')
            expect(onLeave).toBeCalledWith(node)
            expect(onAfterLeave).not.toBeCalled()
            tryOnNextFrame(done, () => {
                expect(node.classList).not.toContain('t-leaving')
                expect(node.classList).not.toContain('t-leave-to')
                expect(onAfterLeave).toBeCalledWith(node)
                expect(el.instance().state.isLeaving).toBe(false)
                expect(el.instance().state.isEntering).toBe(false)
                done()
            })
        })
    })

    it('emits cancelled events correctly', done => {
        const onCancelAppear = jest.fn(),
            onCancelEnter = jest.fn(),
            onCancelLeave = jest.fn()
        el = mount(
            <Transition
                appear
                onCancelAppear={onCancelAppear}
                onCancelEnter={onCancelEnter}
                onCancelLeave={onCancelLeave}
            >
                {foo}
            </Transition>
        )
        let node = el.getDOMNode()
        tryOnNextFrame(done, () => {
            el
                .setProps({
                    children: null
                })
                .update()
            expect(onCancelAppear).toBeCalledWith(node)
            expect(onCancelAppear).toHaveBeenCalledTimes(1)
            tryOnNextFrame(done, () => {
                el
                    .setProps({
                        children: foo
                    })
                    .update()
                expect(onCancelLeave).toBeCalledWith(node)
                expect(onCancelLeave).toHaveBeenCalledTimes(1)
                tryOnNextFrame(done, () => {
                    el
                        .setProps({
                            children: bar
                        })
                        .update()
                    expect(onCancelEnter).toHaveBeenCalledTimes(1)
                    expect(getRenderedChildren(el).length).toBe(2)
                    done()
                })
            })
        })
    })

    it('overrides classes correctly', done => {
        el = mount(
            <Transition
                appear
                enterClass="enterClass"
                enteringClass="enteringClass"
                enterToClass="enterToClass"
                leaveClass="leaveClass"
                leavingClass="leavingClass"
                leaveToClass="leaveToClass"
            >
                {foo}
            </Transition>
        )
        const node = el.getDOMNode()
        expect(node.classList).toContain('enterClass')
        tryOnNextFrame(done, () => {
            expect(node.classList).toContain('enteringClass')
            expect(node.classList).toContain('enterToClass')
            tryOnNextFrame(done, () => {
                el
                    .setProps({
                        children: null
                    })
                    .update()
                expect(node.classList).toContain('leaveClass')
                tryOnNextFrame(done, () => {
                    expect(node.classList).toContain('leavingClass')
                    expect(node.classList).toContain('leaveToClass')
                    done()
                })
            })
        })
    })

    it('uses explicitly set done callbacks on JS hooks and ignores autoCss', done => {
        const doneSpy = jest.fn()
        const instantDone = (node: Element, complete: Function) => {
            doneSpy()
            complete()
        }
        el = mount(
            <Transition appear duration={300} onEnter={instantDone} onLeave={instantDone} onAppear={instantDone}>
                {foo}
            </Transition>
        )
        expect(doneSpy).not.toBeCalled()
        tryOnNextFrame(done, () => {
            expect(doneSpy).toHaveBeenCalledTimes(1)
            el
                .setProps({
                    children: null
                })
                .update()
            tryOnNextFrame(done, () => {
                expect(doneSpy).toHaveBeenCalledTimes(2)
                el
                    .setProps({
                        children: bar
                    })
                    .update()
                tryOnNextFrame(done, () => {
                    expect(doneSpy).toHaveBeenCalledTimes(3)
                    expect(getComputedStyleSpy).not.toBeCalled()
                    done()
                })
            })
        })
    })

    it('ignores autoCss when the prop is set', done => {
        el = mount(
            <Transition appear noCss>
                {foo}
            </Transition>
        )
        tryOnNextFrame(done, () => {
            el
                .setProps({
                    children: null
                })
                .update()
            tryOnNextFrame(done, () => {
                el
                    .setProps({
                        children: bar
                    })
                    .update()
                tryOnNextFrame(done, () => {
                    expect(getComputedStyleSpy).not.toBeCalled()
                    done()
                })
            })
        })
    })

    it('uses duration when available', done => {
        jest.useFakeTimers()
        const onAfterAppear = jest.fn(),
            onAfterEnter = jest.fn(),
            onAfterLeave = jest.fn()
        el = mount(
            <Transition
                appear
                duration={50}
                onAfterAppear={onAfterAppear}
                onAfterEnter={onAfterEnter}
                onAfterLeave={onAfterLeave}
            >
                {foo}
            </Transition>
        )
        tryOnNextFrame(done, () => {
            jest.runTimersToTime(49)
            expect(onAfterAppear).not.toBeCalled()
            jest.runTimersToTime(1)
            expect(onAfterAppear).toBeCalled()
            el
                .setProps({
                    children: null
                })
                .update()
            tryOnNextFrame(done, () => {
                jest.runTimersToTime(49)
                expect(onAfterLeave).not.toBeCalled()
                jest.runTimersToTime(1)
                expect(onAfterLeave).toBeCalled()
                el
                    .setProps({
                        children: bar
                    })
                    .update()
                tryOnNextFrame(done, () => {
                    jest.runTimersToTime(49)
                    expect(onAfterEnter).not.toBeCalled()
                    jest.runTimersToTime(1)
                    expect(onAfterEnter).toBeCalled()
                    done()
                })
                jest.runAllTimers()
            })
            jest.runAllTimers()
        })
        jest.runAllTimers()
    })
})
