jest.mock('../polyfill')
import { componentsEqual, insertAtIndex, maybeCall } from '../utils'
import { ReactElement } from 'react'

type TestElement = ReactElement<{}>

describe('General utilities', () => {
    it('maybe calls defined functions', () => {
        const spy = jest.fn()
        expect(() => maybeCall(undefined)).not.toThrow()
        maybeCall(spy, 'foo', 'bar', 'baz')
        expect(spy).toBeCalledWith('foo', 'bar', 'baz')
    })

    it('compares components correctly', () => {
        expect(componentsEqual(undefined, undefined)).toBe(true)
        expect(componentsEqual(undefined, {} as TestElement)).toBe(false)
        expect(
            componentsEqual(
                {
                    type: 'a'
                } as TestElement,
                {
                    type: 'a'
                } as TestElement
            )
        ).toBe(true)
        expect(
            componentsEqual(
                {
                    type: 'a'
                } as TestElement,
                {
                    type: 'b'
                } as TestElement
            )
        ).toBe(false)
        expect(
            componentsEqual(
                {
                    type: 'b'
                } as TestElement,
                {
                    type: 'b',
                    key: 'b'
                } as TestElement
            )
        ).toBe(false)
    })

    it('inserts elements in arrays correctly', () => {
        const a = [0, 1, 2]
        expect(insertAtIndex(a, 1, 1)).toBe(3)
        expect(a).toEqual([0, 1, 2, 1])
        const b = []
        b[2] = 1
        expect(insertAtIndex(b, 1, 0)).toBe(0)
        expect(b).toEqual([1, undefined, 1])
    })
})
