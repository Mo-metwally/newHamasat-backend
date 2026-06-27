const asyncHandler = require("express-async-handler");
const { Album } = require("../models");
const validateArray = require("../utils/arrayValidation");
const unlinkFiles = require("../utils/unlinkFiles");

function extractFileNameFromUrl(url) {
  if (!url) return null;
  try {
    return url.split("/").pop();
  } catch {
    return url;
  }
}

const ALBUM_ID = "albums-carousel";

async function getAlbumOr404(res) {
  const album = await Album.findByPk(ALBUM_ID);
  if (!album) {
    res.status(404).json({ success: false, message: "Album not found." });
    return null;
  }
  return album;
}

exports.createAlbum = asyncHandler(async (req, res) => {
  const { images } = req.body;
  if (!validateArray(images, "Images", res)) return;

  const exists = await Album.findByPk(ALBUM_ID);
  if (exists) {
    return res
      .status(400)
      .json({ success: false, message: "Album already exists." });
  }

  await Album.create({ id: ALBUM_ID, images });

  const album = await Album.findByPk(ALBUM_ID);
  res.status(201).json({
    success: true,
    message: "Album created successfully.",
    data: album,
  });
});

exports.updateImageInAlbum = asyncHandler(async (req, res) => {
  const { oldImage, newLink } = req.body;

  if (!oldImage) {
    return res
      .status(400)
      .json({ success: false, message: "oldImage is required." });
  }

  const album = await getAlbumOr404(res);
  if (!album) return;

  const currentImages = album.images || [];
  const oldFileName = extractFileNameFromUrl(oldImage);

  let updated = false;
  let newFileName = null;

  if (req.body.images && req.body.images.length > 0) {
    newFileName = req.body.images[0].image;
  }

  album.images = await Promise.all(
    currentImages.map(async (img) => {
      if (extractFileNameFromUrl(img.image) === oldFileName) {
        updated = true;

        if (newFileName) {
          await unlinkFiles([`uploads/albums/${oldFileName}`]);
        }

        return {
          image: newFileName
            ? `http://127.0.0.1:5000/albums/${extractFileNameFromUrl(
                newFileName
              )}`
            : img.image,
          link: newLink !== undefined ? newLink : img.link,
        };
      }
      return img;
    })
  );

  if (!updated) {
    return res
      .status(404)
      .json({ success: false, message: "Image not found in album." });
  }

  await album.save();

  const reloaded = await Album.findByPk(ALBUM_ID);
  res.status(200).json({
    success: true,
    message: "Image updated successfully.",
    data: reloaded,
  });
});

exports.addNewImagesWithLinkInAlbum = asyncHandler(async (req, res) => {
  const { images } = req.body;
  if (!validateArray(images, "Images", res)) return;

  const album = await getAlbumOr404(res);
  if (!album) return;

  album.images = [...(album.images || []), ...images];
  await album.save();

  const reloaded = await Album.findByPk(ALBUM_ID);
  res.status(200).json({
    success: true,
    message: "Images added successfully.",
    data: reloaded,
  });
});

exports.removeImagesWithLinkInAlbum = asyncHandler(async (req, res) => {
  const { imageNames } = req.body;
  if (!validateArray(imageNames, "imageNames", res)) return;

  const album = await getAlbumOr404(res);
  if (!album) return;

  const fileNamesOnly = imageNames.map(extractFileNameFromUrl);

  const currentImages = album.images || [];

  const filesToUnlink = currentImages
    .filter((img) => fileNamesOnly.includes(extractFileNameFromUrl(img.image)))
    .map((img) => `uploads/albums/${extractFileNameFromUrl(img.image)}`);

  album.images = currentImages.filter(
    (img) => !fileNamesOnly.includes(extractFileNameFromUrl(img.image))
  );

  await album.save();

  if (filesToUnlink.length > 0) {
    await unlinkFiles(filesToUnlink);
  }

  const reloaded = await Album.findByPk(ALBUM_ID);
  res.status(200).json({
    success: true,
    message: "Images removed successfully.",
    data: reloaded,
  });
});

exports.getAlbum = asyncHandler(async (req, res) => {
  const album = await getAlbumOr404(res);
  if (!album) return;

  res.status(200).json({ success: true, data: album });
});
