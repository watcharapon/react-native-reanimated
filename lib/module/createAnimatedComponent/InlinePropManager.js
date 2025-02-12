'use strict';

function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
import { flattenArray } from './utils';
import { makeViewDescriptorsSet } from '../reanimated2/ViewDescriptorsSet';
import { adaptViewConfig } from '../ConfigHelper';
import updateProps from '../reanimated2/UpdateProps';
import { stopMapper, startMapper } from '../reanimated2/mappers';
import { isSharedValue } from '../reanimated2/isSharedValue';
import { shouldBeUseWeb } from '../reanimated2/PlatformChecker';
const SHOULD_BE_USE_WEB = shouldBeUseWeb();
function isInlineStyleTransform(transform) {
  if (!Array.isArray(transform)) {
    return false;
  }
  return transform.some(t => hasInlineStyles(t));
}
function inlinePropsHasChanged(styles1, styles2) {
  if (Object.keys(styles1).length !== Object.keys(styles2).length) {
    return true;
  }
  for (const key of Object.keys(styles1)) {
    if (styles1[key] !== styles2[key]) return true;
  }
  return false;
}
function getInlinePropsUpdate(inlineProps) {
  'worklet';

  const update = {};
  for (const [key, styleValue] of Object.entries(inlineProps)) {
    if (isSharedValue(styleValue)) {
      update[key] = styleValue.value;
    } else if (Array.isArray(styleValue)) {
      update[key] = styleValue.map(item => {
        return getInlinePropsUpdate(item);
      });
    } else if (typeof styleValue === 'object') {
      update[key] = getInlinePropsUpdate(styleValue);
    } else {
      update[key] = styleValue;
    }
  }
  return update;
}
function extractSharedValuesMapFromProps(props) {
  const inlineProps = {};
  for (const key in props) {
    const value = props[key];
    if (key === 'style') {
      const styles = flattenArray(props.style ?? []);
      styles.forEach(style => {
        if (!style) {
          return;
        }
        for (const [styleKey, styleValue] of Object.entries(style)) {
          if (isSharedValue(styleValue)) {
            inlineProps[styleKey] = styleValue;
          } else if (styleKey === 'transform' && isInlineStyleTransform(styleValue)) {
            inlineProps[styleKey] = styleValue;
          }
        }
      });
    } else if (isSharedValue(value)) {
      inlineProps[key] = value;
    }
  }
  return inlineProps;
}
export function hasInlineStyles(style) {
  if (!style) {
    return false;
  }
  return Object.keys(style).some(key => {
    const styleValue = style[key];
    return isSharedValue(styleValue) || key === 'transform' && isInlineStyleTransform(styleValue);
  });
}
export function getInlineStyle(style, shouldGetInitialStyle) {
  if (shouldGetInitialStyle) {
    return getInlinePropsUpdate(style);
  }
  const newStyle = {};
  for (const [key, styleValue] of Object.entries(style)) {
    if (!isSharedValue(styleValue) && !(key === 'transform' && isInlineStyleTransform(styleValue))) {
      newStyle[key] = styleValue;
    }
  }
  return newStyle;
}
export class InlinePropManager {
  constructor() {
    _defineProperty(this, "_inlinePropsViewDescriptors", null);
    _defineProperty(this, "_inlinePropsMapperId", null);
    _defineProperty(this, "_inlineProps", {});
  }
  attachInlineProps(animatedComponent, viewInfo) {
    const newInlineProps = extractSharedValuesMapFromProps(animatedComponent.props);
    const hasChanged = inlinePropsHasChanged(newInlineProps, this._inlineProps);
    if (hasChanged) {
      if (!this._inlinePropsViewDescriptors) {
        this._inlinePropsViewDescriptors = makeViewDescriptorsSet();
        const {
          viewTag,
          viewName,
          shadowNodeWrapper,
          viewConfig
        } = viewInfo;
        if (Object.keys(newInlineProps).length && viewConfig) {
          adaptViewConfig(viewConfig);
        }
        this._inlinePropsViewDescriptors.add({
          tag: viewTag,
          name: viewName,
          shadowNodeWrapper: shadowNodeWrapper
        });
      }
      const shareableViewDescriptors = this._inlinePropsViewDescriptors.shareableViewDescriptors;
      const maybeViewRef = SHOULD_BE_USE_WEB ? {
        items: new Set([animatedComponent])
      } // see makeViewsRefSet
      : undefined;
      const updaterFunction = () => {
        'worklet';

        const update = getInlinePropsUpdate(newInlineProps);
        updateProps(shareableViewDescriptors, update, maybeViewRef);
      };
      this._inlineProps = newInlineProps;
      if (this._inlinePropsMapperId) {
        stopMapper(this._inlinePropsMapperId);
      }
      this._inlinePropsMapperId = null;
      if (Object.keys(newInlineProps).length) {
        this._inlinePropsMapperId = startMapper(updaterFunction, Object.values(newInlineProps));
      }
    }
  }
  detachInlineProps() {
    if (this._inlinePropsMapperId) {
      stopMapper(this._inlinePropsMapperId);
    }
  }
}
//# sourceMappingURL=InlinePropManager.js.map