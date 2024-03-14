# Contributing to Testudoq

Testudoq utilizes WebPack for packaging, Jasmine for tests (executed via Testem), and ESLint for linting. The primary scripts are defined in `package.json`.

## Setting up a Local Development Environment

To set up your local development environment, run the following command:

```bash
npm i
```

## Packaging the Extension

To package the extension, execute:

```bash
npm run pack-extension
```

This will generate and copy the necessary files into the `pack` directory. You can then zip it up for distribution as an extension or load it into a browser as an unpacked extension. Check out how to do this in [Chrome](https://developer.chrome.com/extensions/getstarted#unpacked) or [Firefox](https://developer.mozilla.org/en-US/Add-ons/WebExtensions/Temporary_Installation_in_Firefox).

If you encounter an issue where 'ncp' is not recognized, resolve it by running:

```bash
npm install --save ncp
```

## Running Development Tests

To run development tests, use the command:

```bash
npm t
```

If you encounter the warning "React version was set to "detect" in eslint-plugin-react settings, but the "react" package is not installed," address it by running the following commands:

```bash
npm install react-dom
npm install eslint-plugin-jest --save-dev  # Resolve jest/expect-expect issue
npm install jest --save-dev
npm install cross-env --save-dev
```

## Running a Subset of Tests

To run a subset of tests, specify the prefix of the test file name using the command:

```bash
npm t --Testudoq:test_filter=<prefix of the test file name>
```

For example:

```bash
npm t --Testudoq:test_filter=execute-request
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
