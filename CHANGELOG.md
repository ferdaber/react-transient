# Changelog
## 0.4.4 - 2017-11-05
* More examples, and all are migrated to CodePen

## 0.4.2 - 2017-11-05
* Ejected `create-react-app` to set up mocks for Jest
* Added unit tests (Enzyme is added as a dev dependency)
* Changed internal imports to use named exports instead of default exports

## 0.4.1 - 2017-11-04
* Added documentation to props API

## 0.4.0 - 2017-11-04
* Fixed an issue with Safari not smoothly transitioning elements out in `TransitionGroup`
* Added `noCss` prop to `Transition` and `TransitionGroup`
    * If applied in `Transition` all CSS auto-detection is disabled, so that they do not interfere with Javascript hooks. Use this when performing transitions via an external animation library
    * In `TransitionGroup` all CSS auto-detection for moving children are disabled, as well as its children (see above)
* Changed internals so that `Transition` supports empty children, so it is now possible to toggle a `Transition` child on and off
* `TransitionGroup` now supports children of type `Transition`, so it is possible to customize each child of a `TransitionGroup` with their own props. `appear` will still be hardcoded to true until a future enhancement

## 0.3.0 - 2017-10-30
* Allow `TransitionGroup` to smoothly transition elements when one is leaving

## 0.2.1 - 2017-10-30
* Fixed issue with lib build

## 0.1.2 - 2017-10-30
* `TransitionGroup` will now smoothly animate elements that are currently moving when they are being displaced again

## 0.1.1 - 2017-10-29
* Fixed issue with types not being pointed to correctly

## 0.1.0 - 2017-10-29
* First versions of `Transition` and `TransitionGroup` components in `react-transient`