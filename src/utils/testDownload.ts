/**
 * Test utility for debugging Chrome download issues
 */

/**
 * Tests a Chrome download with different path configurations
 * This is a utility function to diagnose download path issues
 */
export const runDownloadTests = () => {
  if (typeof chrome === 'undefined' || !chrome.downloads || !chrome.downloads.download) {
    console.error('Chrome download API not available');
    return;
  }

  // Test 1: Download with no folder (plain filename)
  const test1 = {
    url: 'https://example.com/test-image.jpg',
    filename: 'test-direct.jpg'
  };
  
  chrome.downloads.download(test1, (downloadId) => {
    console.log(`TEST 1 - Plain filename: Download ID: ${downloadId}`);
    
    // Check the download item
    setTimeout(() => {
      chrome.downloads.search({ id: downloadId }, (results) => {
        if (results && results.length > 0) {
          console.log('TEST 1 - Download details:', JSON.stringify(results[0], null, 2));
        }
      });
    }, 1000);
  });

  // Test 2: Download with folder path
  const test2 = {
    url: 'https://example.com/test-image.jpg',
    filename: 'imagesss/test-with-folder.jpg'
  };
  
  chrome.downloads.download(test2, (downloadId) => {
    console.log(`TEST 2 - With folder: Download ID: ${downloadId}`);
    
    // Check the download item
    setTimeout(() => {
      chrome.downloads.search({ id: downloadId }, (results) => {
        if (results && results.length > 0) {
          console.log('TEST 2 - Download details:', JSON.stringify(results[0], null, 2));
        }
      });
    }, 1000);
  });
};

/**
 * Tests if Chrome respects the folder part in download paths
 */
export const testFolderPath = (folderName: string) => {
  if (typeof chrome === 'undefined' || !chrome.downloads || !chrome.downloads.download) {
    console.error('Chrome download API not available');
    return;
  }

  console.log(`Testing download with folder: "${folderName}"`);
  
  const options = {
    url: 'https://example.com/test-image.jpg',
    filename: `${folderName}/test-image-${Date.now()}.jpg`,
    conflictAction: 'uniquify' as chrome.downloads.FilenameConflictAction
  };
  
  console.log('Download options:', JSON.stringify(options));
  
  chrome.downloads.download(options, (downloadId) => {
    console.log(`Download started, ID: ${downloadId}`);
    
    if (downloadId) {
      // Check the download item after a short delay
      setTimeout(() => {
        chrome.downloads.search({ id: downloadId }, (results) => {
          if (results && results.length > 0) {
            console.log('Download details:', JSON.stringify({
              id: results[0].id,
              filename: results[0].filename,
              state: results[0].state
            }, null, 2));
          } else {
            console.log('Download not found');
          }
        });
      }, 1000);
    }
  });
}; 