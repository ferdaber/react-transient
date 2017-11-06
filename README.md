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
### Transition Modes
* [Fade Out -> Fade In](https://codepen.io/igrek312/pen/dZXpXp)
* [Simultaneous Slide In & Slide Out](https://codepen.io/igrek312/pen/JOKRRY)
* [Expand In -> Explode Out](https://codepen.io/igrek312/pen/zPBKEG)
### Advanced
* [Staggered Transition](https://codepen.io/igrek312/pen/OOXRao)
