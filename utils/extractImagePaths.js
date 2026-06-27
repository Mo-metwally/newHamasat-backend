const extractImagePaths = (record, config) => {
  const paths = [];

  config.forEach(({ field, isMultiple, basePath }) => {
    if (isMultiple) {
      const images = record[field];
      if (Array.isArray(images)) {
        images.forEach((img) => {
          paths.push(`${basePath}/${img.split('/').pop()}`);
        });
      }
    } else {
      const image = record[field];
      if (image) {
        paths.push(`${basePath}/${image.split('/').pop()}`);
      }
    }
  });

  return paths;
};

module.exports = extractImagePaths;
