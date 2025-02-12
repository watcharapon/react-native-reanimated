'use strict';

import { isFabric } from './PlatformChecker';
import { runOnUI } from './threads';
let VIEW_TAGS = [];
export function removeFromPropsRegistry(viewTag) {
  VIEW_TAGS.push(viewTag);
  if (VIEW_TAGS.length === 1) {
    queueMicrotask(flush);
  }
}
function flush() {
  if (__DEV__ && !isFabric()) {
    throw new Error('[Reanimated] PropsRegistry is only available on Fabric.');
  }
  runOnUI(removeFromPropsRegistryOnUI)(VIEW_TAGS);
  VIEW_TAGS = [];
}
function removeFromPropsRegistryOnUI(viewTags) {
  'worklet';

  global._removeFromPropsRegistry(viewTags);
}
//# sourceMappingURL=PropsRegistry.js.map