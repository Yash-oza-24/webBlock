const validateUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

const sanitizeUrl = (url) => {
  return url.trim().toLowerCase();
};

const updateBlockingRules = async () => {
  try {
    const { blockedSites = [] } = await chrome.storage.local.get("blockedSites");
    
    // Validate and sanitize all URLs
    const validSites = blockedSites
      .map(sanitizeUrl)
      .filter(validateUrl);

    // Remove existing dynamic rules
    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    const ruleIds = existingRules.map(rule => rule.id);
    
    if (ruleIds.length > 0) {
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: ruleIds
      });
    }

    // Add new rules only if there are valid sites
    if (validSites.length > 0) {
      await chrome.declarativeNetRequest.updateDynamicRules({
        addRules: validSites.map((site, index) => ({
          id: index + 1,
          priority: 1,
          action: {
            type: "redirect",
            redirect: { extensionPath: "/block.html" }
          },
          condition: {
            urlFilter: site,
            resourceTypes: ["main_frame"]
          }
        }))
      });
    }
  } catch (error) {
    console.error('Error updating blocking rules:', error);
  }
};

// Initial update
chrome.runtime.onInstalled.addListener(updateBlockingRules);
chrome.runtime.onStartup.addListener(updateBlockingRules);

// Listen for changes with debounce
let updateTimeout;
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.blockedSites) {
    clearTimeout(updateTimeout);
    updateTimeout = setTimeout(updateBlockingRules, 500);
  }
});
  