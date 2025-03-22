import Sentry from './sentry.js';

// Initialize Sentry
Sentry.init({
  dsn: 'https://815c4402aa7d273adbb56965901ea6d0@js-de.sentry-cdn.com/815c4402aa7d273adbb56965901ea6d0',
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay(),
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  try {
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
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        event: 'onInstalled',
        reason: details.reason
      }
    });
  }
});

chrome.runtime.setUninstallURL('https://blockdev.app/image-downloader/uninstalled');

// Message handling from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  try {
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
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        action: request.action,
        tabId: sender.tab.id
      }
    });
    sendResponse({ error: error.message });
  }
});

// Handle browser action click
chrome.action.onClicked.addListener((tab) => {
  try {
    // Inject the content script when the extension icon is clicked
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        event: 'actionClicked',
        tabId: tab.id
      }
    });
  }
});

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener((command) => {
  try {
    if (command === 'toggle-feature') {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          files: ['content.js']
        });
      });
    }
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        event: 'commandExecuted',
        command: command
      }
    });
  }
});
