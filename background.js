chrome.webRequest.onBeforeRequest.addListener(
  function (details) {
    return { redirectUrl: chrome.runtime.getURL("block.html") };
  },
  ["blocking"]
);
