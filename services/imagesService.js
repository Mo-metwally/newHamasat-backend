const asyncHandler = require("express-async-handler");
const { processImageResizing } = require("../utils/imageProcessing");
const { uploadMixOfImages, uploadSingleImage } = require("../utils/fileUpload");

exports.uploadProductImages = uploadMixOfImages([
  {
    name: "image",
    maxCount: 1,
  },
  {
    name: "images",
    maxCount: 8,
  },
]);
exports.resizeProductImages = asyncHandler(async (req, res, next) => {
  if (req.files && req.files.image) {
    const imageCoverFileName = await processImageResizing(
      req.files.image[0].buffer,
      "products",
      "product-cover"
    );
    req.body.image = imageCoverFileName;
  }

  if (req.files && req.files.images) {
    req.body.images = [];
    await Promise.all(
      req.files.images.map(async (img, index) => {
        const imageName = await processImageResizing(
          img.buffer,
          "products",
          `product-${index + 1}`
        );
        req.body.images.push(imageName);
      })
    );
  }

  next();
});

exports.uploadAlbumImages = uploadMixOfImages([
  { name: "images", maxCount: 10 },
]);
exports.resizeAlbumImages = asyncHandler(async (req, res, next) => {
  if (!req.files?.images) return next();

  const numImages = req.files.images.length;
  req.body.images = new Array(numImages);

  let links = [];

  if (req.body.links) {
    if (typeof req.body.links === "string") {
      try {
        links = JSON.parse(req.body.links);
      } catch (e) {
        links = [req.body.links];
      }
    } else if (Array.isArray(req.body.links)) {
      links = req.body.links;
    } else {
      links = [req.body.links];
    }
  }

  if (!links.length) {
    const linkMap = [];
    for (const key in req.body) {
      const match = key.match(/^links\[(\d+)\]$/);
      if (match) {
        const index = parseInt(match[1], 10);
        linkMap[index] = req.body[key];
      }
    }
    links = linkMap.filter((link) => link !== undefined);
  }

  await Promise.all(
    req.files.images.map(async (img, idx) => {
      const fileName = await processImageResizing(
        img.buffer,
        "albums",
        `album-${idx + 1}`,
        { width: null, quality: 100 }
      );

      req.body.images[idx] = {
        image: fileName,
        link: links[idx] !== undefined ? links[idx] : null,
      };
    })
  );

  next();
});

exports.uploadCategoryImage = uploadSingleImage("image");
exports.resizeImageCategory = asyncHandler(async (req, res, next) => {
  if (req.file) {
    const filename = await processImageResizing(
      req.file.buffer,
      "categories",
      "category"
    );
    req.body.image = filename;
  }

  next();
});

exports.uploadSubCategoryImage = uploadSingleImage("image");
exports.resizeSubCategoryImage = asyncHandler(async (req, res, next) => {
  if (req.file) {
    const filename = await processImageResizing(
      req.file.buffer,
      "subcategories",
      "subcategory"
    );
    req.body.image = filename;
  }

  next();
});

exports.uploadBrandImage = uploadSingleImage("image");
exports.resizeBrandImage = asyncHandler(async (req, res, next) => {
  if (req.file) {
    const filename = await processImageResizing(
      req.file.buffer,
      "brands",
      "brand"
    );
    req.body.image = filename;
  }

  next();
});
