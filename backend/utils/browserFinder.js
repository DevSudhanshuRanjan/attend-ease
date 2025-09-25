const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

/**
 * Find Chrome/Chromium browser executable
 * @returns {Promise<string|null>} Path to Chrome executable or null if not found
 */
async function findChrome() {
  const platform = process.platform;
  
  try {
    if (platform === 'win32') {
      return await findChromeWindows();
    } else if (platform === 'darwin') {
      return await findChromeMac();
    } else {
      return await findChromeLinux();
    }
  } catch (error) {
    console.error('Error finding Chrome:', error);
    return null;
  }
}

/**
 * Find Chrome on Windows
 */
async function findChromeWindows() {
  const possiblePaths = [
    // Google Chrome paths
    process.env.PROGRAMFILES + '\\Google\\Chrome\\Application\\chrome.exe',
    process.env['PROGRAMFILES(X86)'] + '\\Google\\Chrome\\Application\\chrome.exe',
    process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
    process.env.PROGRAMFILES + '\\Google\\Application\\chrome.exe',
    
    // Chromium paths
    process.env.PROGRAMFILES + '\\Chromium\\Application\\chrome.exe',
    process.env['PROGRAMFILES(X86)'] + '\\Chromium\\Application\\chrome.exe',
    process.env.LOCALAPPDATA + '\\Chromium\\Application\\chrome.exe',
    
    // Microsoft Edge (Chromium-based)
    process.env.PROGRAMFILES + '\\Microsoft\\Edge\\Application\\msedge.exe',
    process.env['PROGRAMFILES(X86)'] + '\\Microsoft\\Edge\\Application\\msedge.exe',
    
    // Brave Browser
    process.env.PROGRAMFILES + '\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
    process.env['PROGRAMFILES(X86)'] + '\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
    process.env.LOCALAPPDATA + '\\BraveSoftware\\Brave-Browser\\Application\\brave.exe'
  ];

  for (const chromePath of possiblePaths) {
    if (chromePath && await fileExists(chromePath)) {
      console.log('Found Chrome at:', chromePath);
      return chromePath;
    }
  }

  // Try using where command
  try {
    const whereResult = execSync('where chrome', { encoding: 'utf8' }).trim();
    if (whereResult && await fileExists(whereResult)) {
      console.log('Found Chrome via where command:', whereResult);
      return whereResult;
    }
  } catch (error) {
    // where command failed, continue with other methods
  }

  return null;
}

/**
 * Find Chrome on macOS
 */
async function findChromeMac() {
  const possiblePaths = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium'
  ];

  for (const chromePath of possiblePaths) {
    if (await fileExists(chromePath)) {
      console.log('Found Chrome at:', chromePath);
      return chromePath;
    }
  }

  // Try using which command
  try {
    const whichResult = execSync('which google-chrome-stable', { encoding: 'utf8' }).trim();
    if (whichResult && await fileExists(whichResult)) {
      console.log('Found Chrome via which command:', whichResult);
      return whichResult;
    }
  } catch (error) {
    // which command failed
  }

  try {
    const whichResult = execSync('which chromium-browser', { encoding: 'utf8' }).trim();
    if (whichResult && await fileExists(whichResult)) {
      console.log('Found Chromium via which command:', whichResult);
      return whichResult;
    }
  } catch (error) {
    // which command failed
  }

  return null;
}

/**
 * Find Chrome on Linux
 */
async function findChromeLinux() {
  const possiblePaths = [
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/snap/bin/chromium',
    '/var/lib/snapd/snap/bin/chromium',
    '/usr/bin/microsoft-edge-stable',
    '/usr/bin/brave-browser'
  ];

  for (const chromePath of possiblePaths) {
    if (await fileExists(chromePath)) {
      console.log('Found Chrome at:', chromePath);
      return chromePath;
    }
  }

  // Try using which command
  const commands = ['google-chrome-stable', 'google-chrome', 'chromium-browser', 'chromium'];
  
  for (const command of commands) {
    try {
      const whichResult = execSync(`which ${command}`, { encoding: 'utf8' }).trim();
      if (whichResult && await fileExists(whichResult)) {
        console.log(`Found ${command} via which command:`, whichResult);
        return whichResult;
      }
    } catch (error) {
      // which command failed for this command
    }
  }

  return null;
}

/**
 * Check if file exists
 * @param {string} filePath - Path to check
 * @returns {Promise<boolean>} True if file exists
 */
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get Chrome version
 * @param {string} chromePath - Path to Chrome executable
 * @returns {Promise<string|null>} Chrome version or null
 */
async function getChromeVersion(chromePath) {
  try {
    const versionOutput = execSync(`"${chromePath}" --version`, { encoding: 'utf8' });
    const versionMatch = versionOutput.match(/[\d\.]+/);
    return versionMatch ? versionMatch[0] : null;
  } catch (error) {
    console.error('Error getting Chrome version:', error);
    return null;
  }
}

/**
 * Validate Chrome installation
 * @param {string} chromePath - Path to Chrome executable
 * @returns {Promise<boolean>} True if Chrome is valid
 */
async function validateChrome(chromePath) {
  if (!chromePath || !await fileExists(chromePath)) {
    return false;
  }

  try {
    // Try to get version to validate executable
    const version = await getChromeVersion(chromePath);
    return version !== null;
  } catch (error) {
    return false;
  }
}

module.exports = {
  findChrome,
  findChromeWindows,
  findChromeMac,
  findChromeLinux,
  getChromeVersion,
  validateChrome,
  fileExists
};