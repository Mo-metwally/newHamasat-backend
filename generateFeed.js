require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { create } = require('xmlbuilder2');
const { Product, Category, SubCategory } = require('./models');

const BASE_URL = process.env.BASE_URL || 'https://hamsathome.com';
const PUBLIC_PATH = path.resolve(__dirname, 'public/build');

async function generateFeed() {
    try {
        console.log('🟢 Generating XML product feed...');

        // ✅ احضر المنتجات مع التصنيفات
        const products = await Product.findAll({
            include: [
                { model: SubCategory, as: 'subCategory', attributes: ['id', 'name_ar', 'categoryId'] },
                { model: Category, as: 'category', attributes: ['id', 'name_ar'] },
            ],
        });

        // ✅ تجهيز الداتا
        const productRows = products.map((p) => {
            const sub = p.subCategory;
            const cat = p.category;
            const subName = encodeURIComponent(sub?.name_ar || 'sub');
            const prodName = encodeURIComponent(p.name_ar || p.name_en || '');
            const url = `${BASE_URL}/subcategory/${sub?.id || 0}/${subName}/product/${p.id}/${prodName}`;


            return {
                id: p.id,
                title: p.name_ar || p.name_en || `منتج ${p.id}`,
                description: (p.description_ar || '')
                    .replace(/<[^>]*>/g, '') // 🧹 حذف الوسوم HTML
                    .replace(/[\r\n]+/g, ' ') // 🧾 إزالة الأسطر
                    .trim()
                    .slice(0, 1000),
                link: url,
                image_link: p.image ? p.image : `${BASE_URL}/placeholder.webp`,
                price:
                    p.saleprice && p.saleprice > 0
                        ? `${p.saleprice} EGP`
                        : `${p.price} EGP`,
                currency: 'EGP',
                availability: p.remaining > 0 ? 'in stock' : 'out of stock',
                brand: 'همسات هوم',
                condition: 'new',
                category: cat ? cat.name_ar : '',
                subcategory: sub ? sub.name_ar : '',
            };
        });

        // ===============================
        // 📰 XML Feed (Google Merchant style)
        // ===============================
        const xmlRoot = create({ version: '1.0', encoding: 'UTF-8' })
            .ele('rss', { version: '2.0', 'xmlns:g': 'http://base.google.com/ns/1.0' })
            .ele('channel')
            .ele('title').txt('Hamsat Home Products').up()
            .ele('link').txt(BASE_URL).up()
            .ele('description').txt('Product Feed for Hamsat Home').up();

        productRows.forEach((p) => {
            const item = xmlRoot.ele('item');
            item.ele('g:id').txt(p.id).up();
            item.ele('g:title').txt(p.title).up();
            item.ele('g:description').txt(p.description).up();
            item.ele('g:link').txt(p.link).up();
            item.ele('g:image_link').txt(p.image_link).up();
            item.ele('g:price').txt(p.price).up();
            item.ele('g:availability').txt(p.availability).up();
            item.ele('g:brand').txt(p.brand).up();
            item.ele('g:condition').txt(p.condition).up();
            item.up();
        });

        const xmlFile = path.join(PUBLIC_PATH, 'feed-products.xml');
        fs.writeFileSync(xmlFile, xmlRoot.end({ prettyPrint: true }));

        console.log(`✅ XML feed created successfully at: ${xmlFile}`);
    } catch (err) {
        console.error('❌ Error generating XML feed:', err);
    }
}

module.exports = generateFeed;
