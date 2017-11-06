# React-Transient
[![npm version](https://badge.fury.io/js/react-transient.svg)](https://badge.fury.io/js/react-transient)
## Install
### NPM
```
npm install react-transient
```
```jsx
import { Transition, TransitionGroup } from 'react-transient'
const Foo = () => (
    <Transition name='foo' mode='out-in'>
        {/*...*/}
    </Transition>
)
```
### Unpkg
```html
<script src="https://unpkg.com/react-transient/dist/react-transient.min.js"></script>
```
```js
const { Transition, TransitionGroup } = ReactTransient
const Foo = () => React.createElement(Transition, {
    name: 'foo'
    mode: 'out-in'
}, /*...*/)
```
## API
Documentation is coming soon! For now, please take a look at the source Typescript files for props definitions:
* [`Transition`](https://github.com/ferdaber/react-transient/blob/master/src/lib/Transition.tsx)
* [`TransitionGroup`](https://github.com/ferdaber/react-transient/blob/master/src/lib/TransitionGroup.tsx) (uses the same props as `Transition` with hardcoded `appear` set to `true`)
## Examples
### Demos
* __Transition Modes__
    * [Fade Out -> Fade In](https://codepen.io/igrek312/pen/dZXpXp)
    * [Simultaneous Slide In & Slide Out](https://codepen.io/igrek312/pen/JOKRRY)
    * [Expand In -> Explode Out](https://codepen.io/igrek312/pen/zPBKEG)
* __Advanced__
    * [Staggered Transition](https://codepen.io/igrek312/pen/OOXRao)
### Fading in and out
```css
.toggle-enter,
.toggle-leave-to {
    opacity: 0;
}

.toggle-entering,
.toggle-leaving {
    transition: opacity 200ms linear;
}
```
```jsx
class FadeToggle extends React.Component {
    state = {
        isToggled: false
    }
    
    toggle = () => {
        this.setState({
            isToggled: !this.state.isToggled
        })
    }
    
    render() {
        return (
            <Transition name='toggle' mode='out-in'>
                {this.state.isToggled ? (
                    <button onClick={this.toggle} key='on'>Turn me off!</button>
                ) : (
                    <button onClick={this.toggle} key='off'>Turn me on!</button>
                )}
            </Transition>
        )
    }
}
```
### Advanced slide in-out
```css
.btn {
    display: block;
    position: absolute;
}

.on.btn-enter,
.on.btn-leave-to {
    transform: translateY(-100%);
    opacity: 0;
}

.btn-entering,
.btn-leaving {
    transition: all 200ms linear;
}

.off.btn-enter,
.off.btn-leave-to {
    transform: translateY(100%);
    opacity: 0;
}
```
```jsx
class SlideInOut extends React.Component {
    state = {
        isOn: false
    }

    toggle = () => {
        this.setState({
            isOn: !this.state.isOn
        })
    }

    render() {
        return (
            <div style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <Transition name="btn">
                    {this.state.isOn ? (
                        <button onClick={this.toggle} key="on" className="btn on">On</button>
                    ) : (
                        <button onClick={this.toggle} key="off" className="btn off">Off</button>
                    )}
                </Transition>
            </div>
        )
    }
}
```
