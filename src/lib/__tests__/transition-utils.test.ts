import { durationStringToMs, totalTransitionDuration, getSniffedCssInfo } from '../transition-utils'

describe('Transition utility functions', () => {
    it('transforms CSS duration strings to milliseconds correctly', () => {
        expect(durationStringToMs('1s')).toBe(1000)
        expect(durationStringToMs('0s')).toBe(0)
        expect(durationStringToMs('.7s')).toBe(700)
        expect(durationStringToMs('0.2s')).toBe(200)
        expect(durationStringToMs('3.5s')).toBe(3500)
        expect(durationStringToMs('20s')).toBe(20000)
        expect(durationStringToMs('0')).toBe(0)
    })

    it('gets total transition duration correctly', () => {
        let durations = '1s, 0s, .7s, 0.2s, 3.5s, 20s, 0'
        let delays = '0, 20s, 3.5s, 0.2s, .7s, 0s, 1s'
        expect(totalTransitionDuration(durations, delays)).toBe(20000)
        expect(totalTransitionDuration('1s, 2s', '0, 7s')).toBe(9000)
        expect(totalTransitionDuration('1s, 2s', '1s')).toBe(3000)
    })

    describe('CSS sniffing', () => {
        beforeEach(() => {
            jest.spyOn(window, 'getComputedStyle').mockReturnValue({
                animationDuration: '1s, 1s',
                animationDelay: '2s, 2s',
                transitionDuration: '3s, 3s',
                transitionDelay: '4s, 4s'
            })
        })

        it('gets sniffed CSS transition information correctly', () => {
            expect(getSniffedCssInfo(undefined, undefined)).toEqual({
                type: 'transition',
                duration: 7000,
                numDurations: 2
            })
            expect(getSniffedCssInfo('transition', undefined)).toEqual({
                type: 'transition',
                duration: 7000,
                numDurations: 2
            })
            expect(getSniffedCssInfo('animation', undefined)).toEqual({
                type: 'animation',
                duration: 3000,
                numDurations: 2
            })
        })
    })
})
