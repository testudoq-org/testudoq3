module.exports = function ChromeMenuBuilder(chrome) {
  let itemValues = {};
  let itemHandlers = {};
  const self = this;
  const contexts = ["editable"];
  self.rootMenu = function (title) {
    return chrome.contextMenus.create({
      id: title + Math.random(),
      title,
      contexts,
    });
  };
  self.subMenu = function (title, parentMenu) {
    return chrome.contextMenus.create({
      id: parentMenu + title + Math.random(),
      title,
      parentId: parentMenu,
      contexts,
    });
  };
  self.separator = function (parentMenu) {
    return chrome.contextMenus.create({
      id: parentMenu + Math.random(),
      type: "separator",
      parentId: parentMenu,
      contexts,
    });
  };
  self.menuItem = function (title, parentMenu, clickHandler, value) {
    const id = chrome.contextMenus.create({
      id: contexts + parentMenu + title + Math.random(),
      title,
      parentId: parentMenu,
      contexts,
    });
    itemValues[id] = value;
    itemHandlers[id] = clickHandler;
    return id;
  };
  self.choice = function (title, parentMenu, clickHandler, value) {
    const id = chrome.contextMenus.create({
      id: `value${Math.random()}`,
      type: "radio",
      checked: value,
      title,
      parentId: parentMenu,
      contexts,
    });
    itemHandlers[id] = clickHandler;
    return id;
  };
  self.removeAll = function () {
    itemValues = {};
    itemHandlers = {};
    return new Promise((resolve) => chrome.contextMenus.removeAll(resolve));
  };
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    const itemId = info && info.menuItemId;
    if (itemHandlers[itemId]) {
      itemHandlers[itemId](tab.id, itemValues[itemId]);
    }
  });
  self.selectChoice = function (menuId) {
    return chrome.contextMenus.update(menuId, { checked: true });
  };
};
