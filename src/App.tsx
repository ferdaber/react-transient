import * as React from 'react'
import Transition from './lib/Transition'

import './App.css'

interface ChildProps {
    children?: React.ReactChild
}

const Block = ({ children }: ChildProps) => <div className="box">{children || 'Hello World!'}</div>

const BlockA = ({ children }: ChildProps) => <Block>{children}</Block>

const BlockB = ({ children }: ChildProps) => <Block>{children}</Block>

class App extends React.Component {
    state = {
        isA: true,
        isAppended: true
    }

    render() {
        return (
            <div>
                <Transition name="block" appear>
                    {this.state.isA ? (
                        <BlockA>{'Hello World A!' + (this.state.isAppended ? ' also this' : '')}</BlockA>
                    ) : (
                        <BlockB>{'Hello World B!' + (this.state.isAppended ? ' also this' : '')}</BlockB>
                    )}
                </Transition>
                <button onClick={() => this.setState({ isA: !this.state.isA })}>Click Me!</button>
                <button onClick={() => this.setState({ isAppended: !this.state.isAppended })}>Click Me!</button>
            </div>
        )
    }
}

export default App
