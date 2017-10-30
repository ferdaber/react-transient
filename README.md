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
### Fading in and out
```css
button {
    opacity: 1;
}

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
import './fade-toggle.css' 

class FadeToggle extends React.Component {
    state = {
        isToggled: false
    }
    
    toggle = () => {
        this.setState({
            isToggled: !this.state.isToggled
        }
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
