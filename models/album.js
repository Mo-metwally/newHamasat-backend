'use strict';
const { Model } = require('sequelize');
const setImageURLs = require('../utils/imageUrlHelper');

module.exports = (sequelize, DataTypes) => {
  class Album extends Model {
    static associate(models) {
      // future associations here
    }
  }
  Album.init(
    {
      id: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true,
      },
      // store objects like: [{ image: 'file.jpeg', link: '/something' }]
      images: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Album',
      hooks: {
        afterFind: (albums) => {
          const options = { folder: 'albums', imageFields: ['images'] };
          if (Array.isArray(albums)) {
            albums.forEach((album) => setImageURLs(album, options));
          } else if (albums) {
            setImageURLs(albums, options);
          }
        },
      },
    }
  );
  return Album;
};
