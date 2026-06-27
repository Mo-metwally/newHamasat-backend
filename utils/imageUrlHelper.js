const setImageURLs = (instance, options = {}) => {
  const { baseURL = process.env.BASE_URL, folder, imageFields = [] } = options;

  imageFields.forEach((field) => {
    if (instance[field]) {
      if (Array.isArray(instance[field])) {
        instance[field] = instance[field].map((item) => {
          // Case 1: object { image, link }
          if (typeof item === "object" && item.image) {
            return {
              ...item,
              image: typeof item.image === "string" && item.image.startsWith(baseURL)
                ? item.image
                : typeof item.image === "string"
                ? `${baseURL}/${folder}/${item.image}`
                : item.image,
            };
          }

          // Case 2: plain string
          if (typeof item === "string") {
            return item.startsWith(baseURL)
              ? item
              : `${baseURL}/${folder}/${item}`;
          }

          return item;
        });
      } else if (typeof instance[field] === "object" && instance[field].image) {
        // Handle single object
        instance[field].image = typeof instance[field].image === "string" && instance[field].image.startsWith(baseURL)
          ? instance[field].image
          : typeof instance[field].image === "string"
          ? `${baseURL}/${folder}/${instance[field].image}`
          : instance[field].image;
      } else if (typeof instance[field] === "string") {
        // Handle single string
        if (instance[field] && !instance[field].startsWith(baseURL)) {
          instance[field] = `${baseURL}/${folder}/${instance[field]}`;
        }
      }
    }
  });
};

module.exports = setImageURLs;
