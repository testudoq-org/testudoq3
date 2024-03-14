/* eslint-disable no-tabs */
module.exports = function BrowserInterface(browser) {
  const self = this;

  self.saveOptions = function (options) {
    browser.storage.sync.set(options);
  };

  self.getOptionsAsync = function () {
    return browser.storage.sync.get(null);
  };

  self.openSettings = function () {
    browser.runtime.openOptionsPage();
  };

  self.openUrl = function (url) {
    browser.tabs.create({
      url,
    });
  };

  self.addStorageListener = function (listener) {
    browser.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === "sync") {
        listener(changes);
      }
    });
  };

  self.getRemoteFile = function (url) {
    return fetch(url, {
      mode: "cors",
    }).then((response) => {
      if (response.ok) {
        return response.text();
      }
      throw new Error("Network error reading the remote URL");
    });
  };

  self.closeWindow = function () {
    browser.windows.getCurrent((window) => {
      browser.windows.remove(window.id);
    });
  };

  self.readFile = function (fileInfo) {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.onload = function (event) {
        try {
          resolve(event.target.result);
        } catch (e) {
          reject(e);
        }
      };
      fileReader.onerror = reject;
      fileReader.readAsText(fileInfo, "UTF-8");
    });
  };

  self.executeScript = function (tabId, source) {
    return browser.tabs.executeScript(tabId, {
      code: source,
    });
  };

  self.sendMessage = function (tabId, message) {
    return browser.tabs.sendMessage(tabId, message);
  };

  self.requestPermissions = function (permissionsArray) {
    return browser.permissions.request({
      permissions: permissionsArray,
    });
  };

  self.removePermissions = function (permissionsArray) {
    return browser.permissions.remove({
      permissions: permissionsArray,
    });
  };

  self.copyToClipboard = function (text) {
    navigator.clipboard.writeText(text);
  };

  self.showMessage = function (text) {
    alert(text);
  };
};
