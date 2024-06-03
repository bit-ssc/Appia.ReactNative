import React from 'react';

import { NativeModules } from 'react-native';

const { ImageCropPicker } = NativeModules;

export default ImageCropPicker;
export const { openPicker } = ImageCropPicker;
export const { openCamera } = ImageCropPicker;
export const { openCropper } = ImageCropPicker;
export const { clean } = ImageCropPicker;
export const { cleanSingle } = ImageCropPicker;
