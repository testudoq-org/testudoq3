# Contributing to Testudoq

Testudoq utilizes WebPack for packaging, Jasmine for tests (executed via Testem), and ESLint for linting. The primary scripts are defined in `package.json`.

## Module Format Standards (ESM)
TestudoQ exclusively uses ES modules (ESM). Adhere to these guidelines:
- **File Extension**: All JavaScript modules must use the `.mjs` extension.
- **Module Syntax**: Utilize `import` and `export` statements for all module interactions.
- **Asynchronous Code**: Employ `async/await` for managing asynchronous operations to enhance readability and maintainability.
- **Modern JavaScript**: Follow ES6+ conventions for all new and modified code.

Example:
```javascript
// src/lib/example-module.mjs
import { utilityFunction } from './utility-functions.mjs';

export async function performAction(data) {
  const result = await utilityFunction(data);
  return result;
}
```

## Setting up a Local Development Environment

Ensure that the `js-obfuscator` is installed:

```bash
npm install --save-dev js-obfuscator
```

Ensure that webpack is installed to prevent issues such as the error message "ReferenceError: require is not defined" indicates that the code is being executed in an environment where the require function is not available. 

```bash
npm install webpack webpack-cli --save-dev
```

To set up your local development environment, run the following command:

```bash
npm install
```

## Packaging the Extension

To package the extension, execute:

```bash
npm run pack-extension
```

This command generates and copies the necessary files into the `pack` directory. You can then zip it up for distribution as an extension or load it into a browser as an unpacked extension. Learn how to do this in [Chrome](https://developer.chrome.com/extensions/getstarted#unpacked) or [Firefox](https://developer.mozilla.org/en-US/Add-ons/WebExtensions/Temporary_Installation_in_Firefox).

If you encounter an issue where `ncp` is not recognized, resolve it by running:

```bash
npm install --save ncp
```

## Building the Extension
The extension is built using Webpack, configured via [`webpack.config.mjs`](webpack.config.mjs). This setup processes and bundles our ES modules (`.mjs` files) into a format suitable for Chrome (MV3) and Firefox.

To build the extension:
```bash
npm run build
```
This command typically executes scripts defined in [`package.json`](package.json), such as `build-extension` for a standard development build or `build-min-obs-extension` for a minimized and obfuscated production build. The Webpack configuration handles the complexities of ES module bundling, ensuring all `.mjs` files are correctly processed.

Build outputs are placed in the `dist/` directory (or as configured).

## Running Development Tests
Tests are primarily written using Jasmine and executed via Testem. Jest is utilized for its powerful assertion library and mocking capabilities, and the environment is configured to support ES Modules (`.mjs`).

To run all tests:
```bash
npm test
```
This command executes the test suite. The Jest configuration ([`jest.config.js`](jest.config.js)) is set up to handle `.mjs` files, typically by enabling Node's experimental ESM features or using Babel transforms to ensure compatibility.

Ensure testing dependencies like `jest`, `eslint-plugin-jest`, and `cross-env` are installed:
```bash
npm install jest eslint-plugin-jest cross-env --save-dev
```

## Running a Subset of Tests

To run a subset of tests, specify the prefix of the test file name using the command:

```bash
npm test --Testudoq:test_filter=<prefix of the test file name>
```

For example:

```bash
npm test --Testudoq:test_filter=execute-request
```

## Finding the Source Code from a Test Failure Report

In case of a test failure, find the actual error line using:

```bash
npm run sourcemap <packed URL without the origin and starting />
```

For instance:

```bash
npm run sourcemap testem/compiled/common/execute-request-spec.js:165:4
```

## Running Tests in an Open Browser Session (for Debugging)

To continuously watch the source and test folders and re-run tests as files change, use the following command:

```bash
npm run test-browser
```

This command supports the `--Testudoq:test_filter` option to restrict the test run to a subset.

## Environment Variables for Windows and macOS/Linux

For Windows, set the following environment variables:

```powershell
[System.Environment]::SetEnvironmentVariable("EDGE_PROFILE_PATH", "C:\Users\[value]\AppData\Local\Microsoft\Edge\User Data\[Profile]", [System.EnvironmentVariableTarget]::User)
[System.Environment]::SetEnvironmentVariable("CHROME_PROFILE_PATH", "C:\Users\[value]\AppData\Local\Google\Chrome\User Data\[Profile]", [System.EnvironmentVariableTarget]::User)
```

For macOS/Linux, use:

```bash
export EDGE_PROFILE_PATH="/path/to/profile"
export CHROME_DEFAULT_PROFILE_PATH="/path/to/default/profile"
```

This guide provides a step-by-step approach for contributors to set up, test, and debug the Testudoq extension. If you have any specific questions or would like further clarification on any aspect, feel free to reach out!
