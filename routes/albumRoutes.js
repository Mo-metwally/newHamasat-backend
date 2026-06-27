const express = require("express");
const albumController = require("../controllers/albumController");
const {
  uploadAlbumImages,
  resizeAlbumImages,
} = require("../services/imagesService");
const authService = require("../services/authService");

const router = express.Router();

router
  .route("/")
  .post(
    authService.protect,
    authService.allowedTo("superAdmin", "admin", "manager"),
    uploadAlbumImages,
    resizeAlbumImages,
    albumController.createAlbum
  )
  .get(albumController.getAlbum);

router.patch(
  "/add",
  authService.protect,
  authService.allowedTo("superAdmin", "admin", "manager"),
  uploadAlbumImages,
  resizeAlbumImages,
  albumController.addNewImagesWithLinkInAlbum
);

router.patch(
  "/remove",
  authService.protect,
  authService.allowedTo("superAdmin", "admin", "manager"),
  albumController.removeImagesWithLinkInAlbum
);

router.patch(
  "/update",
  authService.protect,
  authService.allowedTo("superAdmin", "admin", "manager"),
  uploadAlbumImages,
  resizeAlbumImages,
  albumController.updateImageInAlbum
);

module.exports = router;
