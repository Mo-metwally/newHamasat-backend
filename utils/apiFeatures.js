const { Op } = require('sequelize');

class ApiFeatures {
  constructor(Model, queryString) {
    this.Model = Model;
    this.queryString = queryString;
    this.queryOptions = { where: {}, include: [] };
    this.paginationResult = null;
    this.totalRecords = 0;
  }

  filter() {
    const queryStringObj = { ...this.queryString };
    const excludeFields = ['page', 'sort', 'limit', 'fields', 'search', 'lang', 'adminView'];
    excludeFields.forEach((field) => delete queryStringObj[field]);

    Object.entries(queryStringObj).forEach(([key, value]) => {
      if (key === 'brand') {
        const brandAttributes = this.Model.sequelize.models.Brand.rawAttributes;
        const brandFields = Object.keys(brandAttributes).filter((attr) =>
          attr.startsWith('name_')
        );

        if (brandFields.length === 0) {
          throw new Error('No language-specific brand fields found.');
        }

        const orCondition = brandFields.map((field) => ({
          [field]: { [Op.or]: value.split(',') },
        }));

        this.queryOptions.include.push({
          model: this.Model.sequelize.models.Brand,
          as: 'brand',
          attributes: ['id'],
          where: { [Op.or]: orCondition },
          required: true,
        });
      } else if (value.includes(',')) {
        this.queryOptions.where[key] = { [Op.or]: value.split(',') };
      } else if (/^[><]=?/.test(value)) {
        const operator = value.startsWith('>=')
          ? Op.gte
          : value.startsWith('<=')
            ? Op.lte
            : value.startsWith('>')
              ? Op.gt
              : Op.lt;
        this.queryOptions.where[key] = {
          [operator]: value.replace(/^[><]=?/, ''),
        };
      } else {
        this.queryOptions.where[key] = { [Op.eq]: value };
      }
    });

    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').map((field) => {
        const direction = field.startsWith('-') ? 'DESC' : 'ASC';
        return [field.startsWith('-') ? field.slice(1) : field, direction];
      });
      this.queryOptions.order = sortBy;
    } else {
      this.queryOptions.order = [['createdAt', 'DESC']];
    }
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      this.queryOptions.attributes = this.queryString.fields.split(',');
    } else {
      this.queryOptions.attributes = { exclude: [] };
    }
    return this;
  }

  search() {
    if (this.queryString.search) {
      const conditions = [];
      const searchTerm = `%${this.queryString.search}%`;

      const modelAttributes = Object.keys(this.Model.rawAttributes);
      const languageSuffixes = [
        ...new Set(
          modelAttributes
            .map((attr) => attr.match(/_(\w+)$/))
            .filter(Boolean)
            .map((match) => match[1])
        ),
      ];

      const generateLanguageFields = (baseField) =>
        languageSuffixes.map((suffix) => ({
          [`${baseField}_${suffix}`]: { [Op.iLike]: searchTerm },
        }));

      ['name', 'description'].forEach((field) => {
        conditions.push(...generateLanguageFields(field));
      });

      conditions.push({
        keywords: { [Op.contains]: [this.queryString.search] },
      });

      this.queryOptions.where = {
        ...this.queryOptions.where,
        [Op.or]: conditions,
      };
    }

    return this;
  }

  async paginate() {
    this.totalRecords = await this.Model.count({
      where: this.queryOptions.where,
      include: this.queryOptions.include,
      distinct: true,
    });

    let page = Math.max(parseInt(this.queryString.page, 10) || 1, 1);
    const limit = Math.max(parseInt(this.queryString.limit, 10) || 2000, 1);
    const totalPages = Math.ceil(this.totalRecords / limit) || 1;

    if (page > totalPages) page = totalPages;

    const offset = (page - 1) * limit;
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    this.queryOptions.limit = limit;
    this.queryOptions.offset = offset;

    this.paginationResult = {
      totalRecords: this.totalRecords,
      totalPages,
      currentPage: page,
      limit,
      hasNext,
      hasPrev,
      nextPage: hasNext ? page + 1 : null,
      prevPage: hasPrev ? page - 1 : null,
    };

    return this;
  }

  languageFields() {
    const lang = this.queryString.lang;
    const modelAttributes = this.Model.rawAttributes;

    if (!lang) {
      this.queryOptions.attributes = Object.keys(modelAttributes);
      return this;
    }

    const langFields = Object.keys(modelAttributes).filter((field) =>
      field.endsWith(`_${lang}`)
    );

    const nonLangFields = Object.keys(modelAttributes).filter(
      (field) => !field.includes('_')
    );

    this.queryOptions.attributes = [...langFields, ...nonLangFields];
    return this;
  }

  async query() {
    return await this.Model.findAll(this.queryOptions);
  }
}

module.exports = ApiFeatures;
