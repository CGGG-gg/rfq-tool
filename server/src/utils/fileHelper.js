const path = require('path');
const fs = require('fs');

/**
 * Resolve a path relative to the server root.
 */
function resolvePath(...segments) {
  return path.resolve(__dirname, '..', '..', ...segments);
}

/**
 * Ensure a directory exists, creating it recursively if needed.
 */
function ensureDir(dirPath) {
  const fullPath = resolvePath(dirPath);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
  return fullPath;
}

/**
 * Delete a file if it exists.
 */
function deleteFile(filePath) {
  const fullPath = resolvePath(filePath);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
    return true;
  }
  return false;
}

/**
 * Get the file extension from a filename or MIME type.
 */
function getExtension(filename) {
  return path.extname(filename).toLowerCase();
}

/**
 * Generate a safe filename with UUID.
 */
function generateFilename(originalName) {
  const ext = path.extname(originalName);
  const { v4: uuidv4 } = require('uuid');
  return `${uuidv4()}${ext}`;
}

module.exports = {
  resolvePath,
  ensureDir,
  deleteFile,
  getExtension,
  generateFilename,
};
