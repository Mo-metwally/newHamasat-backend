const sharp = require("sharp");
const { v4: uuidv4 } = require("uuid");

exports.processImageResizing = async (
  imageBuffer,
  folder,
  prefix,
  options = { width: 700, quality: 70 }
) => {
  // تغيير الامتداد لـ webp
  const fileName = `${prefix}-${uuidv4()}-${Date.now()}.webp`;

  let transformer = sharp(imageBuffer).toFormat("webp"); // WebP بدل jpeg

  if (options.width) {
    transformer = transformer.resize({ width: options.width });
  }

  // حفظ الصورة بصيغة WebP
  await transformer
    .webp({ quality: options.quality })
    .toFile(`uploads/${folder}/${fileName}`);

  return fileName;
};
