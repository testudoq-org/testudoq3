# Testudoq - Exploratory Testing Assistant for Chrome and Firefox

![Testudoq](screenshots/chrome-medium-tile.png)

Testudoq is an exploratory testing assistant available for Chrome and Firefox. It enhances the testing experience by providing convenient access to common boundaries and edge cases through the context menu (right-click) for editable elements. This allows testers to have problematic values easily accessible during exploratory testing sessions.

## Features

- Convenient access to common boundaries and edge cases for exploratory testing
- Easy extension with custom config files
- Works on input fields, text areas, and content editable DIVs
- Supports multi-frame pages from the same domain
- Compatible with Chrome, Edge, and Firefox
- Minimal overhead per page (<1k), no third-party library dependencies, and completely passive without interfering with web app execution

## Usage

The extension can be installed from the [Chrome Web Store](url) or [Mozilla Add-ons](url).

After installation, simply right-click on any editable item on the page to reveal the Testudoq submenu. Click on an item, and it will be inserted into the editable field.

## More Information

- [What's New in the Latest Version?](https://tbc.org/v3.html)
- [How to Install and Use Testudoq](https://tbc.org/using.html)
- [Contribute or Support Development](https://tbc.org/contributing.html)
- [Customize Menus in Testudoq](https://tbc.org/customising.html)
- [Developer Guide](CONTRIBUTING.md)
- [Resources About Edge Cases in Testudoq Menus](https://tbc.org/resources.html)

## Getting Started

### Check Package JSON Dependencies

Ensure that you are using the latest dependencies:

```bash
npm install -g npm-check-updates
ncu
```

### Add Cross-Platform Dependencies

Install cross-platform dependencies:

```bash
npm install fs-extra
```

### Add Airbnb ESLint Configuration

Install Airbnb ESLint configuration:

```bash
npm install eslint-config-airbnb --save-dev
```

## Authors of the Original Fork

- [Gojko Adzic](https://gojko.net)
- [@bbbco](http://twitter.com/bbbco) (old Firefox Addon)

---

## Icon Credit

Tortoise icon from [Pet Icons created by Freepik - Flaticon](https://www.flaticon.com/free-icons/pet).
