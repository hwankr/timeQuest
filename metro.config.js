// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Firebase JS SDK가 Expo SDK 53+에서 동작하려면 필요한 설정
// 1) .cjs 확장자를 번들링 대상에 포함
config.resolver.sourceExts.push('cjs');

// 2) package.json exports 필드를 무시하여 Firebase 모듈 해석 문제 방지
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
