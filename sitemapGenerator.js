require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { create } = require('xmlbuilder2');
const axios = require('axios');
const { Product, Category, SubCategory } = require('./models');


const BASE_URL = process.env.CLIENT_URL || 'https://hamsathome.com';
const PUBLIC_PATH = path.resolve(__dirname, 'public/build');

async function generateSitemap() {
    try {
        console.log('🟢 Generating sitemaps...');

        // --- 1. Static Pages ---
        const staticPages = [
            '/', '/allsubcategories', '/shop',
            '/offers', '/newarrival', '/bestselling', '/suggestion',
            '/termsandconditions', '/deliverypolicy', '/privacypolicy'
        ];
        const staticXml = create({ version: '1.0', encoding: 'UTF-8' })
            .ele('urlset', { xmlns: 'http://www.sitemaps.org/schemas/sitemap/0.9' });
        staticPages.forEach(page => {
            const url = staticXml.ele('url');
            url.ele('loc').txt(`${BASE_URL}${page}`);
            url.ele('changefreq').txt('daily');
            url.ele('priority').txt('1.0');
        });
        fs.writeFileSync(path.join(PUBLIC_PATH, 'sitemap-static.xml'), staticXml.end({ prettyPrint: true }));

        // --- 2. Categories ---

        const categories = await Category.findAll();
        const categoriesXml = create({ version: '1.0', encoding: 'UTF-8' })
            .ele('urlset', { xmlns: 'http://www.sitemaps.org/schemas/sitemap/0.9' });
        categories.forEach(cat => {
            const url = categoriesXml.ele('url');
            url.ele('loc').txt(`${BASE_URL}/category/${cat.id}/${encodeURIComponent(cat.name_ar)}`);
            url.ele('changefreq').txt('daily');
            url.ele('priority').txt('0.9');
        });
        fs.writeFileSync(path.join(PUBLIC_PATH, 'sitemap-categories.xml'), categoriesXml.end({ prettyPrint: true }));

        // --- 2.5 SubCategories ---
        const subcategories = await SubCategory.findAll();
        const subcategoriesXml = create({ version: '1.0', encoding: 'UTF-8' })
            .ele('urlset', { xmlns: 'http://www.sitemaps.org/schemas/sitemap/0.9' });

        subcategories.forEach(sub => {
            const url = subcategoriesXml.ele('url');
            url.ele('loc').txt(`${BASE_URL}/subcategory/${sub.id}/${encodeURIComponent(sub.name_ar)}`);
            url.ele('changefreq').txt('daily');
            url.ele('priority').txt('0.85');
        });

        fs.writeFileSync(path.join(PUBLIC_PATH, 'sitemap-subcategories.xml'), subcategoriesXml.end({ prettyPrint: true }));


        // --- 3. Products ---
        const products = await Product.findAll();
        const productsXml = create({ version: '1.0', encoding: 'UTF-8' })
            .ele('urlset', { xmlns: 'http://www.sitemaps.org/schemas/sitemap/0.9' });

        products.forEach(prod => {
            const subcat = subcategories.find(s => s.id === prod.subcategoryId);
            const subcatName = subcat ? encodeURIComponent(subcat.name_ar) : 'sub';
            const url = productsXml.ele('url');
            url.ele('loc').txt(`${BASE_URL}/subcategory/${prod.subcategoryId}/${subcatName}/product/${prod.id}/${encodeURIComponent(prod.name_ar)}`);
            url.ele('changefreq').txt('weekly');
            url.ele('priority').txt('0.95');
        });
        fs.writeFileSync(path.join(PUBLIC_PATH, 'sitemap-products.xml'), productsXml.end({ prettyPrint: true }));

        // --- 4. Sitemap Index ---
        const sitemapIndex = create({ version: '1.0', encoding: 'UTF-8' })
            .ele('sitemapindex', { xmlns: 'http://www.sitemaps.org/schemas/sitemap/0.9' });
        ['sitemap-static.xml', 'sitemap-categories.xml', 'sitemap-subcategories.xml', 'sitemap-products.xml'].forEach(file => {
            const sitemap = sitemapIndex.ele('sitemap');
            sitemap.ele('loc').txt(`${BASE_URL}/${file}`);
            sitemap.ele('lastmod').txt(new Date().toISOString());
        });

        fs.writeFileSync(path.join(PUBLIC_PATH, 'sitemap.xml'), sitemapIndex.end({ prettyPrint: true }));


        // --- 5. Ping Google & Bing ---
        const sitemaps = [
            "sitemap.xml",
            "sitemap-static.xml",
            "sitemap-categories.xml",
            "sitemap-subcategories.xml",
            "sitemap-products.xml"
        ];

        const pingUrls = [];

        for (const sitemap of sitemaps) {
            const url = `${BASE_URL}/${sitemap}`;
            pingUrls.push(
                axios.get(`https://www.google.com/ping?sitemap=${url}`, { timeout: 5000 })
                    .then(() => console.log(`✅ Pinged Google: ${url}`))
                    .catch(err => console.log(`⚠️ Google ping failed for ${url}:`, err.message))
            );
            pingUrls.push(
                axios.get(`https://www.bing.com/ping?sitemap=${url}`, { timeout: 5000 })
                    .then(() => console.log(`✅ Pinged Bing: ${url}`))
                    .catch(err => console.log(`⚠️ Bing ping failed for ${url}:`, err.message))
            );
        }

        // Run all pings in parallel
        await Promise.allSettled(pingUrls);

        console.log('✅ All sitemaps generated and ping requests finished!');

    } catch (err) {
        console.error('❌ Error generating sitemaps:', err);
    }
}

// Export function
module.exports = generateSitemap;
