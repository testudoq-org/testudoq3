/*global chrome */
const ChromeConfigInterface = require('../src/lib/chrome-browser-interface'),
	initConfigWidget = require('../src/lib/init-config-widget');
document.addEventListener("DOMContentLoaded", () => {
  initConfigWidget(
    document.getElementById("main"),
    new ChromeConfigInterface(chrome),
  );
});
