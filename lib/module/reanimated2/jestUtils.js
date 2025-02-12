/* eslint-disable @typescript-eslint/no-namespace */
'use strict';

import { isJest } from './PlatformChecker';
const defaultFramerateConfig = {
  fps: 60
};
const getCurrentStyle = component => {
  const styleObject = component.props.style;
  let currentStyle = {};
  if (Array.isArray(styleObject)) {
    styleObject.forEach(style => {
      currentStyle = {
        ...currentStyle,
        ...style
      };
    });
  } else {
    var _component$props$jest;
    currentStyle = {
      ...styleObject,
      ...((_component$props$jest = component.props.jestAnimatedStyle) === null || _component$props$jest === void 0 ? void 0 : _component$props$jest.value)
    };
  }
  return currentStyle;
};
const checkEqual = (current, expected) => {
  if (Array.isArray(expected)) {
    if (!Array.isArray(current) || expected.length !== current.length) {
      return false;
    }
    for (let i = 0; i < current.length; i++) {
      if (!checkEqual(current[i], expected[i])) {
        return false;
      }
    }
  } else if (typeof current === 'object' && current) {
    if (typeof expected !== 'object' || !expected) {
      return false;
    }
    for (const property in expected) {
      if (!checkEqual(current[property], expected[property])) {
        return false;
      }
    }
  } else {
    return current === expected;
  }
  return true;
};
const findStyleDiff = (current, expected, shouldMatchAllProps) => {
  const diffs = [];
  let isEqual = true;
  let property;
  for (property in expected) {
    if (!checkEqual(current[property], expected[property])) {
      isEqual = false;
      diffs.push({
        property,
        current: current[property],
        expect: expected[property]
      });
    }
  }
  if (shouldMatchAllProps && Object.keys(current).length !== Object.keys(expected).length) {
    isEqual = false;
    // eslint-disable-next-line @typescript-eslint/no-shadow
    let property;
    for (property in current) {
      if (expected[property] === undefined) {
        diffs.push({
          property,
          current: current[property],
          expect: expected[property]
        });
      }
    }
  }
  return {
    isEqual,
    diffs
  };
};
const compareStyle = (component, expectedStyle, config) => {
  if (!component.props.style) {
    return {
      message: () => `Component doesn't have a style.`,
      pass: false
    };
  }
  const {
    shouldMatchAllProps
  } = config;
  const currentStyle = getCurrentStyle(component);
  const {
    isEqual,
    diffs
  } = findStyleDiff(currentStyle, expectedStyle, shouldMatchAllProps);
  if (isEqual) {
    return {
      message: () => 'ok',
      pass: true
    };
  }
  const currentStyleStr = JSON.stringify(currentStyle);
  const expectedStyleStr = JSON.stringify(expectedStyle);
  const differences = diffs.map(diff => `- '${diff.property}' should be ${JSON.stringify(diff.expect)}, but is ${JSON.stringify(diff.current)}`).join('\n');
  return {
    message: () => `Expected: ${expectedStyleStr}\nReceived: ${currentStyleStr}\n\nDifferences:\n${differences}`,
    pass: false
  };
};
let frameTime = Math.round(1000 / defaultFramerateConfig.fps);
const beforeTest = () => {
  jest.useFakeTimers();
};
const afterTest = () => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
};
export const withReanimatedTimer = animationTest => {
  console.warn('This method is deprecated, you should define your own before and after test hooks to enable jest.useFakeTimers(). Check out the documentation for details on testing');
  beforeTest();
  animationTest();
  afterTest();
};
export const advanceAnimationByTime = (time = frameTime) => {
  console.warn('This method is deprecated, use jest.advanceTimersByTime directly');
  jest.advanceTimersByTime(time);
  jest.runOnlyPendingTimers();
};
export const advanceAnimationByFrame = count => {
  console.warn('This method is deprecated, use jest.advanceTimersByTime directly');
  jest.advanceTimersByTime(count * frameTime);
  jest.runOnlyPendingTimers();
};
const requireFunction = isJest() ? require : () => {
  throw new Error('[Reanimated] `setUpTests` is available only in Jest environment.');
};
export const setUpTests = (userFramerateConfig = {}) => {
  let expect = global.expect;
  if (expect === undefined) {
    const expectModule = requireFunction('expect');
    expect = expectModule;
    // Starting from Jest 28, "expect" package uses named exports instead of default export.
    // So, requiring "expect" package doesn't give direct access to "expect" function anymore.
    // It gives access to the module object instead.
    // We use this info to detect if the project uses Jest 28 or higher.
    if (typeof expect === 'object') {
      const jestGlobals = requireFunction('@jest/globals');
      expect = jestGlobals.expect;
    }
    if (expect === undefined || expect.extend === undefined) {
      expect = expectModule.default;
    }
  }
  const framerateConfig = {
    ...defaultFramerateConfig,
    ...userFramerateConfig
  };
  frameTime = Math.round(1000 / framerateConfig.fps);
  expect.extend({
    toHaveAnimatedStyle(component, expectedStyle, config = {}) {
      return compareStyle(component, expectedStyle, config);
    }
  });
};
export const getAnimatedStyle = component => {
  return getCurrentStyle(
  // This type assertion is needed to get type checking in the following
  // functions since `ReactTestInstance` has its `props` defined as `any`.
  component);
};
//# sourceMappingURL=jestUtils.js.map