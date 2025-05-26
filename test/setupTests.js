import { TextEncoder, TextDecoder } from 'util';

// Polyfill for TextEncoder and TextDecoder which are used by some modules
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// If you have other global setup, add it here
// For example, mocking localStorage or other browser APIs

// You can also extend Jest's expect matchers if needed
// import '@testing-library/jest-dom'; // Example if using jest-dom
