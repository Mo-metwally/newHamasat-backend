const setImageURLs = (instance, options = {}) => {
  const { baseURL = process.env.BASE_URL, folder, imageFields = [] } = options;

  const formatUrl = (val) => {
    if (!val || typeof val !== "string") return val;
    // Extract filename if already a URL or path
    const filename = val.includes("/") ? val.split("/").pop() : val;
    return `${baseURL}/${folder}/${filename}`;
  };

  imageFields.forEach((field) => {
    if (instance[field]) {
      if (Array.isArray(instance[field])) {
        instance[field] = instance[field].map((item) => {
          if (typeof item === "object" && item.image) {
            return {
              ...item,
              image: formatUrl(item.image),
            };
          }
          if (typeof item === "string") {
            return formatUrl(item);
          }
          return item;
        });
      } else if (typeof instance[field] === "object" && instance[field].image) {
        instance[field].image = formatUrl(instance[field].image);
      } else if (typeof instance[field] === "string") {
        instance[field] = formatUrl(instance[field]);
      }
    }
  });
};

module.exports = setImageURLs;
