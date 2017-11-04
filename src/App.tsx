import * as React from 'react'
import Transition, { TransitionProps } from './lib/Transition'
import TransitionGroup from './lib/TransitionGroup'

import './App.css'

interface ChildProps {
    children?: React.ReactChild
}

const Block = ({ children }: ChildProps) => <div className="box">{children || 'Hello World!'}</div>

const BlockA = ({ children }: ChildProps) => <Block>{children}</Block>

const BlockB = ({ children }: ChildProps) => <Block>{children}</Block>

const log = (message: string) => (el: HTMLElement) => {
    console.log('-------------------------------')
    console.log(message)
    console.log(el)
    console.log(el.classList.toString())
    console.log('-------------------------------')
}

function shuffle<T>(array: T[]) {
    var currentIndex = array.length,
        temporaryValue,
        randomIndex

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex)
        currentIndex -= 1

        // And swap it with the current element.
        temporaryValue = array[currentIndex]
        array[currentIndex] = array[randomIndex]
        array[randomIndex] = temporaryValue
    }

    return array
}

const transitionProps: TransitionProps = {
    appear: true,
    mode: 'out-in',
    onBeforeAppear: log('onBeforeAppear'),
    onAppear: log('onAppear'),
    onAfterAppear: log('onAfterAppear'),
    onCancelAppear: log('onCancelAppear'),
    onBeforeEnter: log('onBeforeEnter'),
    onEnter: log('onEnter'),
    onAfterEnter: log('onAfterEnter'),
    onCancelEnter: log('onCancelEnter'),
    onBeforeLeave: log('onBeforeLeave'),
    onLeave: log('onLeave'),
    onAfterLeave: log('onAfterLeave'),
    onCancelLeave: log('onCancelLeave')
}

class App extends React.Component {
    state = {
        isA: true,
        isAppended: true,
        numberList: [] as number[],
        grid: Array(25)
            .fill(0)
            .map((n, idx) => idx + 1)
    }

    render() {
        return (
            <div>
                <button onClick={() => this.setState({ isA: !this.state.isA })}>Transition props!</button>
                <button onClick={() => this.setState({ isAppended: !this.state.isAppended })}>Modify props!</button>
                <button onClick={() => this.addNumber()}>Add number!</button>
                <button onClick={() => this.removeNumber()}>Remove number!</button>
                <button onClick={() => this.shuffle()}>Shuffle!</button>
                <button onClick={() => this.shuffleGrid()}>Shuffle Grid!</button>
                <Transition {...transitionProps} name="block">
                    {this.state.isA ? (
                        <BlockA>{'Hello World A!' + (this.state.isAppended ? ' also this' : '')}</BlockA>
                    ) : (
                        <BlockB>{'Hello World B!' + (this.state.isAppended ? ' also this' : '')}</BlockB>
                    )}
                </Transition>
                <TransitionGroup {...transitionProps} name="number">
                    {this.state.numberList.map(n => (
                        <div key={n} className="number">
                            Number: {n} <button onClick={() => this.removeNumber(n)}>X</button>
                        </div>
                    ))}
                </TransitionGroup>
                {/* <div
                    style={{
                        display: 'flex',
                        width: '100%',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <div className="grid-container">
                        <TransitionGroup name="grid-cell">
                            {this.state.grid.map((n, idx) => (
                                <div className="grid-cell" key={n}>
                                    {n}
                                </div>
                            ))}
                        </TransitionGroup>
                    </div>
                </div> */}
            </div>
        )
    }

    shuffle() {
        this.setState({
            numberList: shuffle([...this.state.numberList])
        })
    }

    shuffleGrid() {
        const grid = shuffle([...this.state.grid])
        this.setState({
            grid
        })
    }

    addNumber() {
        do {
            var newNum = ~~(1 + Math.random() * 100)
        } while (this.state.numberList.some(n => n === newNum))
        const newIndex = ~~(Math.random() * this.state.numberList.length)
        const numberList = [...this.state.numberList]
        numberList.splice(newIndex, 0, newNum)
        this.setState({ numberList })
    }

    removeNumber(numToRemove?: number) {
        if (numToRemove == null) {
            numToRemove = this.state.numberList[~~(Math.random() * this.state.numberList.length)]
        }
        this.setState({
            numberList: this.state.numberList.filter(n => n !== numToRemove)
        })
    }
}

export default App
