const fs = require('fs').promises;

const unlinkFiles = async (paths) => {
  try {
    await Promise.all(
      paths.map(async (path) => {
        try {
          await fs.unlink(path);
        } catch (err) {
          console.error(`Failed to unlink file: ${path}, Error: ${err.message}`);
        }
      })
    );
  } catch (err) {
    console.error(`Error while unlinking files: ${err.message}`);
  }
};

module.exports = unlinkFiles;
