import * as React from 'react'
import Transition from './lib/Transition'

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

class App extends React.Component {
    state = {
        isA: true,
        isAppended: true
    }

    render() {
        return (
            <div>
                <button onClick={() => this.setState({ isA: !this.state.isA })}>Click Me!</button>
                <button onClick={() => this.setState({ isAppended: !this.state.isAppended })}>Click Me!</button>
                <Transition
                    name="block"
                    appear
                    mode="out-in"
                    onBeforeAppear={log('onBeforeAppear')}
                    onAppear={log('onAppear')}
                    onAfterAppear={log('onAfterAppear')}
                    onCancelAppear={log('onCancelAppear')}
                    onBeforeEnter={log('onBeforeEnter')}
                    onEnter={log('onEnter')}
                    onAfterEnter={log('onAfterEnter')}
                    onCancelEnter={log('onCancelEnter')}
                    onBeforeLeave={log('onBeforeLeave')}
                    onLeave={log('onLeave')}
                    onAfterLeave={log('onAfterLeave')}
                    onCancelLeave={log('onCancelLeave')}
                >
                    {this.state.isA ? (
                        <BlockA>{'Hello World A!' + (this.state.isAppended ? ' also this' : '')}</BlockA>
                    ) : (
                        <BlockB>{'Hello World B!' + (this.state.isAppended ? ' also this' : '')}</BlockB>
                    )}
                </Transition>
            </div>
        )
    }
}

export default App
