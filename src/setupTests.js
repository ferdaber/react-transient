import Enzyme from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'

Enzyme.configure({ adapter: new Adapter() })

window.requestAnimationFrame = callback => setTimeout(() => callback(performance.now()), 0)
