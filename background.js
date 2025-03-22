// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
    chrome.tabs.create({
      url: 'https://blockdev.app/image-downloader/installed',
    });
  } else if (details.reason === chrome.runtime.OnInstalledReason.UPDATE) {
    // When extension is updated
  } else if (details.reason === chrome.runtime.OnInstalledReason.CHROME_UPDATE) {
    // When browser is updated
  } else if (details.reason === chrome.runtime.OnInstalledReason.SHARED_MODULE_UPDATE) {
    // When a shared module is updated
  }
});
chrome.runtime.setUninstallURL('https://blockdev.app/image-downloader/uninstalled');

// Message handling from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getImages') {
    // Inject content script to get images from the active tab
    chrome.scripting.executeScript({
      target: { tabId: sender.tab.id },
      files: ['content.js']
    });
  }

  if (request.action === 'downloadImage') {
    chrome.downloads.download({
      url: request.imageUrl,
      filename: request.filename || 'image.jpg',
      saveAs: request.saveAs || false
    });
  }
});

// Handle browser action click
chrome.action.onClicked.addListener((tab) => {
  // Inject the content script when the extension icon is clicked
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['content.js']
  });
});

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener((command) => {
  if (command === 'toggle-feature') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        files: ['content.js']
      });
    });
  }
});
