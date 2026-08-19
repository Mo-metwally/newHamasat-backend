require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const { Product, SubCategory, User, Brand } = require('./models');
const { Op } = require('sequelize');

function renderNotFoundPage(req, res) {
    const html = `
    <!DOCTYPE html>
    <html lang="ar">
    <head>
      <meta charset="UTF-8" />
      <meta name="robots" content="noindex, nofollow" />
      <meta name="description" content="عذراً، الصفحة التي تبحث عنها غير موجودة." />
      <title>الصفحة غير موجودة - همسات هوم</title>
      <link rel="icon" href="/favicon.ico" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    </head>
    <body>
      <div id="root"></div>
      <script>window.__INITIAL_DATA__ = { notFound: true }</script>
      <script src="/static/js/main.js"></script>
    </body>
    </html>
  `;
    res.status(404).send(html);
}


module.exports = function setupSSR(app) {
    const buildPath = path.join(__dirname, 'public/build');
    const indexPath = path.join(buildPath, 'index.html');

    let indexTemplate = null;

    if (fs.existsSync(indexPath)) {
        indexTemplate = fs.readFileSync(indexPath, 'utf8');
    } else {
        console.warn('⚠️  React build not found, SSR routes will return fallback HTML.');
        indexTemplate = '<html><head><title>App</title></head><body><div id="root">React build not found.</div></body></html>';
    }

    function injectMeta(template, meta, extra = '') {
        return template
            .replace(/<title>.*<\/title>/, `<title>${meta.title}</title>`)
            .replace(/<meta name="description".*?>/, `<meta name="description" content="${meta.description}" />`)
            .replace(/<meta name="keywords".*?>/, `<meta name="keywords" content="${meta.keywords || ''}" />`)
            .replace(/<meta property="og:type".*?>/, '') // 🟢 امسح أي og:type قديم
            .replace(/<meta property="og:title".*?>/, `<meta property="og:title" content="${meta.title}" />`)
            .replace(/<meta property="og:description".*?>/, `<meta property="og:description" content="${meta.description}" />`)
            .replace(/<meta property="og:image".*?>/, `<meta property="og:image" content="${meta.image}" />`)
            .replace(/<meta property="og:url".*?>/, `<meta property="og:url" content="${meta.url}" />`)
            .replace(/<meta name="twitter:title".*?>/, `<meta name="twitter:title" content="${meta.title}" />`)
            .replace(/<meta name="twitter:description".*?>/, `<meta name="twitter:description" content="${meta.description}" />`)
            .replace(/<meta name="twitter:image".*?>/, `<meta name="twitter:image" content="${meta.image}" />`)
            .replace(/<link rel="canonical".*?>/, `<link rel="canonical" href="${meta.url}" />`)
            .replace('</head>', `${extra}</head>`)
        // .replace('</head>', `
        //         <script async src="https://www.googletagmanager.com/gtag/js?id=G-M1NJJ7NK8S"></script>
        //         <script>
        //         window.dataLayer = window.dataLayer || [];
        //         function gtag(){dataLayer.push(arguments);}
        //         gtag('js', new Date());
        //         gtag('config', 'G-M1NJJ7NK8S', { page_path: '${meta.url}' });
        //         </script>
        //         </head>`);

    }

    function getPlainText(html) {
        if (!html) return '';
        return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, '').trim();
    }

    function commaSeparateWords(str) {
        if (!str) return '';
        // تقسيم النص على الفراغات وتحويله لقائمة ثم إعادة دمجها بفواصل
        return str
            .split(' ')
            .map(word => word.trim())
            .filter(Boolean)
            .join(',');
    }

    // ---------- SSR Routes ----------
    app.get('/subcategory/:subCatId/:subCatName/product/:productId/:productName', async (req, res) => {
        try {
            if (!fs.existsSync(indexPath)) return res.send(indexTemplate);

            const { productId, subCatId } = req.params;
            const { lang = 'ar' } = req.query;

            // ✅ تأكد أن الـ ID UUID صحيح
            if (!/^[0-9a-fA-F-]{36}$/.test(productId)) {
                return res.redirect('/notfound');
            }

            const product = await Product.findByPk(productId);
            if (!product) return res.redirect('/notfound');

            const productData = {
                name: product[`name_${lang}`] || product.name_ar,
                description: getPlainText(product[`description_${lang}`] || product.description_ar || '').substring(0, 160),
                image: product.image,
                price: product.price || "0.00",
                currency: product.currency || "EGP",
                availability: product.remaining > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
            };

            const relatedProducts = await Product.findAll({
                where: { subcategoryId: subCatId },
                order: [['createdAt', 'DESC']],
                limit: 6
            });

            const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
            let html = indexTemplate;

            // ✅ SEO Meta Tags
            html = injectMeta(html, {
                title: productData.name,
                description: productData.description || `منتج ${productData.name} معرض همسات للأدوات المنزلية يجمع لك كل ما يحتاجه المطبخ العصري: زجاج، كاسات، شربات، أطقم صيني وخزف، أنتيكات وكرستالات، أدوات المائدة، أطقم التسالي، أطقم الميلامين، أطقم الأركوبال والأركوبايركس، أطقم السفرة، أطقم الشاي والجاتوه، أطقم العشاء، والمزيد... مع تشكيلة واسعة من التصاميم الأنيقة، وجودة عالية بأسعار تنافسية تناسب كل الأذواق.`,
                image: productData.image,
                keywords: `${productData.name},${commaSeparateWords(productData.name)},${productData.description},${commaSeparateWords(productData.description)},همسات, همسات هوم, معرض همسات, أدوات منزلية, ادوات مطبخ, ادوات مطبخ عصرية, ادوات منزلية فاخرة, منتجات منزلية, مستلزمات المطبخ, مستلزمات البيت, ديكورات مطبخ, معرض ادوات منزلية, ادوات منزلية في الشرقية, ادوات منزلية في فاقوس, مطبخ عصري, اسعار ادوات منزلية, افضل ادوات منزلية, ادوات منزلية اونلاين, شراء ادوات منزلية, تسوق ادوات مطبخ, ادوات مطبخ حديثة, ادوات منزلية عالية الجودة, همسات للأدوات المنزلية, معرض ادوات منزلية فاقوس, ادوات منزلية شارع الدروس, معرض ادوات منزلية الشرقية, اطقم تقديم حديثة, همسات فاقوس, معرض همسات شارع الدروس, ادوات مطبخ فاقوس, مستلزمات منزلية الشرقية`,
                url,
            });

            // ✅ Structured Data (Product Schema)
            const productSchema = {
                "@context": "https://schema.org/",
                "@type": "Product",
                "name": productData.name,
                "image": [productData.image],
                "description": productData.description,
                "sku": product.sku || product.id,
                "brand": {
                    "@type": "Brand",
                    "name": product.brand || "متجرنا"
                },
                "offers": {
                    "@type": "Offer",
                    "url": url,
                    "priceCurrency": productData.currency,
                    "price": productData.price,
                    "availability": productData.availability
                }
            };

            html = html.replace(
                '</head>',
                `<script type="application/ld+json">${JSON.stringify(productSchema)}</script></head>`
            );

            // ✅ Inject Initial Data & Semantic SEO HTML
            const initialData = { product: productData, relatedProducts };
            const seoHtml = `
                <div id="root">
                    <main>
                        <h1>${productData.name}</h1>
                        <img src="${productData.image}" alt="${productData.name}" />
                        <p>${productData.description}</p>
                        <p>السعر: ${productData.price} ${productData.currency}</p>
                        <h2>منتجات ذات صلة</h2>
                        <ul>
                            ${relatedProducts.map(p => `<li><a href="/subcategory/${p.subcategoryId}/category/product/${p.id}/${encodeURIComponent(p.name_ar || '')}">${p.name_ar}</a></li>`).join('')}
                        </ul>
                    </main>
                </div>
            `;
            html = html.replace(
                '<div id="root"></div>',
                `${seoHtml}<script>window.__INITIAL_DATA__ = ${JSON.stringify(initialData)}</script>`
            );

            return res.send(html);

        } catch (err) {
            console.error(err);
            return res.redirect('/notfound');
        }
    });

    // ===== SSR Vendor Profile & Products =====
    app.get(['/vendor/:id', '/vendor/:id/products'], async (req, res) => {
        try {
            if (!fs.existsSync(indexPath)) return res.send(indexTemplate);

            const { id } = req.params;

            if (!/^[0-9a-fA-F-]{36}$/.test(id)) {
                return res.redirect('/notfound');
            }

            const vendor = await User.findByPk(id);
            if (!vendor) return res.redirect('/notfound');

            // ✅ جلب صورة البراند إذا كان هناك براند بنفس اسم البائع
            let vendorImage = '/Hamasat-ShowCase.webp';
            if (vendor.name) {
                const brand = await Brand.findOne({
                    where: {
                        [Op.or]: [
                            { name_ar: vendor.name.trim() },
                            { name_en: vendor.name.trim() }
                        ]
                    }
                });
                if (brand && brand.image) {
                    vendorImage = brand.image;
                }
            }

            const vendorDesc = vendor.vendorDescription ? getPlainText(vendor.vendorDescription).substring(0, 160) : `تسوق من متجر ${vendor.name} على همسات هوم. اكتشف أفضل المنتجات بأسعار تنافسية.`;
            const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;

            let html = indexTemplate;

            const isProductsPage = req.path.endsWith('/products');
            let productsHtml = '';
            
            if (isProductsPage) {
                const vendorProducts = await Product.findAll({
                    where: { vendorId: id },
                    order: [['createdAt', 'DESC']],
                    limit: 12
                });
                if (vendorProducts && vendorProducts.length > 0) {
                    productsHtml = `
                        <h2>منتجات ${vendor.name}</h2>
                        <ul>
                            ${vendorProducts.map(p => `<li><a href="/product/${p.id}">${p.name_ar}</a> - ${p.price} EGP</li>`).join('')}
                        </ul>
                    `;
                }
            }

            // ✅ SEO Meta Tags
            const pageTitle = isProductsPage ? `منتجات ${vendor.name} - متجر همسات هوم` : `${vendor.name} - متجر همسات هوم`;
            const pageDesc = isProductsPage ? `تصفح أحدث المنتجات والعروض من متجر ${vendor.name} على همسات هوم. تشكيلة مميزة من المنتجات المتوفرة بأفضل الأسعار.` : vendorDesc;
            
            html = injectMeta(html, {
                title: pageTitle,
                description: pageDesc,
                image: vendorImage,
                keywords: `منتجات ${vendor.name}, متجر ${vendor.name}, ${vendor.businessField || 'أدوات منزلية'}, همسات هوم, شراء أونلاين, تسوق, أفضل الأسعار`,
                url,
            });

            // ✅ Structured Data (Store Schema)
            const storeSchema = {
                "@context": "https://schema.org",
                "@type": "Store",
                "name": vendor.name,
                "description": vendorDesc,
                "image": vendorImage,
                "url": url,
                "telephone": vendor.phone || vendor.phoneNumber || "",
                "address": vendor.address || ""
            };

            html = html.replace(
                '</head>',
                `<script type="application/ld+json">${JSON.stringify(storeSchema)}</script></head>`
            );

            // ✅ Semantic SEO HTML
            const seoHtml = `
                <div id="root">
                    <main>
                        <h1>${pageTitle}</h1>
                        <p>${pageDesc}</p>
                        ${productsHtml}
                    </main>
                </div>
            `;
            html = html.replace(
                '<div id="root"></div>',
                `${seoHtml}`
            );

            return res.send(html);

        } catch (err) {
            console.error(err);
            return res.redirect('/notfound');
        }
    });

    // ===== SSR Home Page =====
    app.get('/', async (req, res) => {
        try {
            const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
            let html = indexTemplate; // لازم تكون جايب الـ index.html كـ template

            // Inject meta tags
            html = injectMeta(
                html,
                {
                    title: 'معرض همسات هوم للأدوات المنزلية',
                    description:
                        'معرض همسات للأدوات المنزلية يجمع لك كل ما يحتاجه المطبخ العصري: زجاج، كاسات، شربات، أطقم صيني وخزف، أنتيكات وكرستالات، أدوات المائدة، أطقم التسالي، أطقم الميلامين، أطقم الأركوبال والأركوبايركس، أطقم السفرة، أطقم الشاي والجاتوه، أطقم العشاء، والمزيد... مع تشكيلة واسعة من التصاميم الأنيقة، وجودة عالية بأسعار تنافسية تناسب كل الأذواق.',

                    image: '/Hamasat-ShowCase.webp',
                    keywords: 'همسات, همسات هوم, معرض همسات, أدوات منزلية, ادوات مطبخ, اطقم طهي, اطقم تقديم, اطقم سفرة, اواني منزلية, اواني طهي, طاسات جرانيت, طاسات تيفال, طاسات استانلس, حلل جرانيت, حلل تيفال, حلل استانلس, ادوات تقديم, ادوات تقطيع, ادوات مطبخ عصرية, ادوات منزلية فاخرة, منتجات منزلية, مستلزمات المطبخ, مستلزمات البيت, اطقم عشاء, اطقم صيني, اطقم شاي, اطقم قهوة, ديكورات مطبخ, معرض ادوات منزلية, ادوات منزلية في الشرقية, ادوات منزلية في فاقوس, مطبخ عصري, اسعار ادوات منزلية, افضل ادوات منزلية, ادوات منزلية اونلاين, شراء ادوات منزلية, تسوق ادوات مطبخ, ادوات مطبخ حديثة, ادوات منزلية عالية الجودة, همسات للأدوات المنزلية, معرض ادوات منزلية فاقوس, ادوات منزلية شارع الدروس, معرض ادوات منزلية الشرقية, اواني حديثة, اطقم تقديم حديثة, همسات فاقوس, معرض همسات شارع الدروس, ادوات مطبخ فاقوس, مستلزمات منزلية الشرقية',
                    url,
                },
                `
        <meta name="robots" content="index, follow" />
        <meta name="theme-color" content="#000000" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

        <!-- Open Graph -->
        <meta property="og:type" content="website" />
        <meta property="og:title" content="معرض همسات للأدوات المنزلية" />
        <meta property="og:description" content="معرض همسات للأدوات المنزلية يجمع لك كل ما يحتاجه المطبخ العصري: زجاج، كاسات، شربات، أطقم صيني وخزف، أنتيكات وكرستالات، أدوات المائدة، أطقم التسالي، أطقم الميلامين، أطقم الأركوبال والأركوبايركس، أطقم السفرة، أطقم الشاي والجاتوه، أطقم العشاء، والمزيد... مع تشكيلة واسعة من التصاميم الأنيقة، وجودة عالية بأسعار تنافسية تناسب كل الأذواق." />
        <meta property="og:image" content="/Hamasat-ShowCase.webp" />
        <meta property="og:url" content="${url}" />
        <meta property="og:site_name" content="همسات" />

        <!-- Twitter -->
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="معرض همسات للأدوات المنزلية" />
        <meta name="twitter:description" content="معرض همسات للأدوات المنزلية يجمع لك كل ما يحتاجه المطبخ العصري: زجاج، كاسات، شربات، أطقم صيني وخزف، أنتيكات وكرستالات، أدوات المائدة، أطقم التسالي، أطقم الميلامين، أطقم الأركوبال والأركوبايركس، أطقم السفرة، أطقم الشاي والجاتوه، أطقم العشاء، والمزيد... مع تشكيلة واسعة من التصاميم الأنيقة، وجودة عالية بأسعار تنافسية تناسب كل الأذواق."/>
        <meta name="twitter:image" content="/Hamasat-ShowCase.webp" />

        <link rel="canonical" href="${url}" />
         <script type="application/ld+json">
        {
        "@context": "https://schema.org",
        "@type": "Store",
        "name": "معرض همسات للأدوات المنزلية",
        "image": "https://hamsathome.com/Hamasat-ShowCase.webp",
        "@id": "https://hamsathome.com",
        "url": "https://hamsathome.com",
        "telephone": "+201026388831",
        "priceRange": "$$",
        "address": {
            "@type": "PostalAddress",
            "streetAddress": "شارع الدروس",
            "addressLocality": "فاقوس",
            "addressRegion": "الشرقية",
            "postalCode": "44611",
            "addressCountry": "EG"
        },
        "geo": {
            "@type": "GeoCoordinates",
            "latitude": 30.733,
            "longitude": 31.800
        },
        "openingHoursSpecification": [
        {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Saturday",
            "Sunday"
            ],
            "opens": "12:00",
            "closes": "23:59"
        }
        ],
        "sameAs": [
            "https://www.facebook.com/profile.php?id=100063762195504&locale=ar_AR",
            "https://www.instagram.com/hamasat238/",
            "https://www.google.com/maps/place/%D9%85%D8%B9%D8%B1%D8%B6+%D9%87%D9%85%D8%B3%D8%A7%D8%AA+%D9%84%D9%84%D8%A7%D8%AF%D9%88%D8%A7%D8%AA+%D8%A7%D9%84%D9%85%D9%86%D8%B2%D9%84%D9%8A%D9%87%E2%80%AD/@30.72606,31.792573,16z/data=!4m6!3m5!1s0x14f825347e535cc7:0xcccd3ef60be43279!8m2!3d30.72606!4d31.792573!16s%2Fg%2F11g18_lrdj?hl=en&entry=ttu&g_ep=EgoyMDI1MDkyOC4wIKXMDSoASAFQAw%3D%3D"
        ]
        }
        </script>
      `
            );

            // Inject initial data لو محتاج تعرض بيانات معينة
            const initialData = { homepage: true };
            html = html.replace(
                '<div id="root"></div>',
                `<div id="root"></div><script>window.__INITIAL_DATA__ = ${JSON.stringify(
                    initialData
                )}</script>`
            );

            res.send(html);
        } catch (err) {
            console.error(err);
            res.status(500).send('SSR Home error');
        }
    });


    // صفحة المتجر
    app.get('/shop', async (req, res) => {
        try {
            const products = await Product.findAll({
                order: [['createdAt', 'DESC']],
                limit: 20
            });

            // IDs للـ subcategories
            const subcategoryIds = [...new Set(products.map(p => p.subcategoryId))];

            // هات بياناتهم من جدول SubCategory
            const subcategories = await SubCategory.findAll({
                where: { id: subcategoryIds },
                attributes: ['id', 'name_ar']
            });

            // map للـ subcategories { id: name_ar }
            const subMap = subcategories.reduce((acc, sub) => {
                acc[sub.id] = sub.name_ar;
                return acc;
            }, {});

            // أول 6 منتجات + اضافة اسم السبكاتيجوري
            const firstProducts = products.slice(0, 6).map(p => ({
                id: p.id,
                name_ar: p.name_ar || 'unknown',
                subcategoryId: p.subcategoryId,
                subCatName_ar: subMap[p.subcategoryId] || 'unknown',
                image: p.image || '/Hamasat-ShowCase.webp',
            }));

            // المنتجات اللي بعد كده
            const seeAlso = products.slice(6, 12).map(p => ({
                id: p.id,
                name_ar: p.name_ar || 'unknown',
                subcategoryId: p.subcategoryId,
                subCatName_ar: subMap[p.subcategoryId] || 'unknown',
                image: p.image || '/Hamasat-ShowCase.webp',
            }));

            const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
            let html = indexTemplate;

            // og:image tags لكل منتج
            const ogImages = firstProducts
                .map(p => `<meta property="og:image" content="${p.image}" />`)
                .join('\n');

            // og:see_also tags
            const ogSeeAlso = firstProducts
                .map(p => {
                    const productUrl = `${req.protocol}://${req.get('host')}/subcategory/${p.subcategoryId}/${encodeURIComponent(p.subCatName_ar || '')}/product/${p.id}/${encodeURIComponent(p.name_ar)}`;
                    return `<meta property="og:see_also" content="${productUrl}" />`;
                })
                .join('\n');

            html = injectMeta(html, {
                title: 'معرض همسات - المتجر',
                description: 'معرض همسات - المتجر معرض همسات للأدوات المنزلية يجمع لك كل ما يحتاجه المطبخ العصري: زجاج، كاسات، شربات، أطقم صيني وخزف، أنتيكات وكرستالات، أدوات المائدة، أطقم التسالي، أطقم الميلامين، أطقم الأركوبال والأركوبايركس، أطقم السفرة، أطقم الشاي والجاتوه، أطقم العشاء، والمزيد... مع تشكيلة واسعة من التصاميم الأنيقة، وجودة عالية بأسعار تنافسية تناسب كل الأذواق. ',
                image: firstProducts[0]?.image || '/Hamasat-ShowCase.webp',
                keywords: 'همسات, همسات هوم, معرض همسات, أدوات منزلية, ادوات مطبخ, اطقم طهي, اطقم تقديم, اطقم سفرة, اواني منزلية, اواني طهي, طاسات جرانيت, طاسات تيفال, طاسات استانلس, حلل جرانيت, حلل تيفال, حلل استانلس, ادوات تقديم, ادوات تقطيع, ادوات مطبخ عصرية, ادوات منزلية فاخرة, منتجات منزلية, مستلزمات المطبخ, مستلزمات البيت, اطقم عشاء, اطقم صيني, اطقم شاي, اطقم قهوة, ديكورات مطبخ, معرض ادوات منزلية, ادوات منزلية في الشرقية, ادوات منزلية في فاقوس, مطبخ عصري, اسعار ادوات منزلية, افضل ادوات منزلية, ادوات منزلية اونلاين, شراء ادوات منزلية, تسوق ادوات مطبخ, ادوات مطبخ حديثة, ادوات منزلية عالية الجودة, همسات للأدوات المنزلية, معرض ادوات منزلية فاقوس, ادوات منزلية شارع الدروس, معرض ادوات منزلية الشرقية, اواني حديثة, اطقم تقديم حديثة, همسات فاقوس, معرض همسات شارع الدروس, ادوات مطبخ فاقوس, مستلزمات منزلية الشرقية',
                url
            }, ogImages + '\n' + ogSeeAlso + `
        <meta property="og:type" content="product.group" />
        <meta property="og:site_name" content="معرض همسات هوم للأدوات المنزلية" />
        <meta name="twitter:card" content="summary_large_image" />
    `);

            const initialData = { products: firstProducts, seeAlso };
            const allProducts = [...firstProducts, ...seeAlso];
            const seoHtml = `
                <div id="root">
                    <main>
                        <h1>معرض همسات - المتجر</h1>
                        <ul>
                            ${allProducts.map(p => `<li><a href="/subcategory/${p.subcategoryId}/${encodeURIComponent(p.subCatName_ar)}/product/${p.id}/${encodeURIComponent(p.name_ar)}">
                                <img src="${p.image}" alt="${p.name_ar}" />
                                <h2>${p.name_ar}</h2>
                            </a></li>`).join('')}
                        </ul>
                    </main>
                </div>
            `;
            html = html.replace(
                '<div id="root"></div>',
                `${seoHtml}<script>window.__INITIAL_DATA__ = ${JSON.stringify(initialData)}</script>`
            );

            res.send(html);
        } catch (err) {
            console.error(err);
            res.status(500).send('SSR server error');
        }
    });


    app.get('/offers', async (req, res) => {
        try {
            const products = await Product.findAll({
                where: {
                    salePrice: { [Op.gt]: 0 }
                },
                order: [['createdAt', 'DESC']],
                limit: 20
            });

            // هات IDs للـ subcategories من المنتجات
            const subcategoryIds = [...new Set(products.map(p => p.subcategoryId))];

            // هات بياناتهم من جدول Subcategory
            const subcategories = await SubCategory.findAll({
                where: { id: subcategoryIds },
                attributes: ['id', 'name_ar']
            });

            // اعمل map للـ subcategories عشان نوصل للاسم بسهولة
            const subMap = subcategories.reduce((acc, sub) => {
                acc[sub.id] = sub.name_ar;
                return acc;
            }, {});

            // جهّز المنتجات الأولى (للـ meta والـ SSR)
            const firstProducts = products.slice(0, 6).map(p => ({
                id: p.id,
                name_ar: p.name_ar || 'unknown',
                subcategoryId: p.subcategoryId,
                subCatName_ar: subMap[p.subcategoryId] || 'unknown',
                image: p.image || '/Hamasat-ShowCase.webp',
            }));

            const seeAlso = products.slice(6, 12).map(p => ({
                id: p.id,
                name_ar: p.name_ar || 'unknown',
                subcategoryId: p.subcategoryId,
                subCatName_ar: subMap[p.subcategoryId] || 'unknown',
                image: p.image || '/Hamasat-ShowCase.webp',
            }));

            const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
            let html = indexTemplate;

            // og:image tags
            const ogImages = firstProducts
                .map(p => `<meta property="og:image" content="${p.image}" />`)
                .join('\n');

            // og:see_also tags
            const ogSeeAlso = firstProducts
                .map(p => {
                    const productUrl = `${req.protocol}://${req.get('host')}/subcategory/${p.subcategoryId}/${encodeURIComponent(p.subCatName_ar)}/product/${p.id}/${encodeURIComponent(p.name_ar)}`;
                    return `<meta property="og:see_also" content="${productUrl}" />`;
                })
                .join('\n');

            // Inject meta tags
            html = injectMeta(html, {
                title: 'معرض همسات - العروض',
                description: 'استمتع بأفضل العروض والتخفيضات على منتجات همسات للأدوات المنزلية. معرض همسات للأدوات المنزلية يجمع لك كل ما يحتاجه المطبخ العصري: زجاج، كاسات، شربات، أطقم صيني وخزف، أنتيكات وكرستالات، أدوات المائدة، أطقم التسالي، أطقم الميلامين، أطقم الأركوبال والأركوبايركس، أطقم السفرة، أطقم الشاي والجاتوه، أطقم العشاء، والمزيد... مع تشكيلة واسعة من التصاميم الأنيقة، وجودة عالية بأسعار تنافسية تناسب كل الأذواق.',
                keywords: 'همسات, همسات هوم, معرض همسات, أدوات منزلية',
                image: firstProducts[0]?.image || '/Hamasat-ShowCase.webp',
                url
            }, ogImages + '\n' + ogSeeAlso + `
            <meta property="og:type" content="product.group" />
            <meta property="og:site_name" content="معرض همسات هوم للأدوات المنزلية" />
            <meta name="twitter:card" content="summary_large_image" />
        `);

            // Inject initial data & Semantic HTML
            const initialData = { products: firstProducts, seeAlso };
            const allOffers = [...firstProducts, ...seeAlso];
            const seoHtml = `
                <div id="root">
                    <main>
                        <h1>معرض همسات - العروض</h1>
                        <ul>
                            ${allOffers.map(p => `<li><a href="/subcategory/${p.subcategoryId}/${encodeURIComponent(p.subCatName_ar)}/product/${p.id}/${encodeURIComponent(p.name_ar)}">
                                <img src="${p.image}" alt="${p.name_ar}" />
                                <h2>${p.name_ar}</h2>
                            </a></li>`).join('')}
                        </ul>
                    </main>
                </div>
            `;
            html = html.replace(
                '<div id="root"></div>',
                `${seoHtml}<script>window.__INITIAL_DATA__ = ${JSON.stringify(initialData)}</script>`
            );

            res.send(html);
        } catch (err) {
            console.error('SSR error:', err);
            res.status(500).send('SSR server error');
        }
    });

    // صفحة الفئة
    app.get('/subcategory/:subCatId/:subCatName', async (req, res) => {
        const { subCatId } = req.params;
        const itemsPerPage = 6;

        try {
            // ✅ تحقق من وجود indexTemplate
            if (!fs.existsSync(indexPath)) return res.send(indexTemplate);

            // ✅ تحقق من أن الـ ID UUID صحيح
            if (!/^[0-9a-fA-F-]{36}$/.test(subCatId)) {
                return res.redirect('/notfound');
            }

            // ✅ هات المنتجات
            const products = await Product.findAll({
                where: { subcategoryId: subCatId },
                order: [['createdAt', 'DESC']]
            });

            // ✅ هات اسم السبكاتيجوري
            const subcategory = await SubCategory.findByPk(subCatId, {
                attributes: ['name_ar']
            });

            if (!subcategory) {
                return res.redirect('/notfound');
            }

            const subCatName = subcategory.name_ar || 'قسم';

            const firstItems = products.slice(0, itemsPerPage);
            const seeAlso = products.slice(itemsPerPage, itemsPerPage + 6);
            const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
            let html = indexTemplate;

            // ✅ og:image tags
            const ogImages = firstItems
                .map(p => `<meta property="og:image" content="${p.image}" />`)
                .join('\n');

            // ✅ og:see_also tags
            const ogSeeAlso = seeAlso
                .map(p => {
                    const productUrl = `${req.protocol}://${req.get('host')}/subcategory/${subCatId}/${encodeURIComponent(subCatName)}/product/${p.id}/${encodeURIComponent(p.name_ar)}`;
                    return `<meta property="og:see_also" content="${productUrl}" />`;
                })
                .join('\n');

            // ✅ Meta tags
            const meta = {
                title: `معرض همسات - ${subCatName}`,
                description: `تسوق أحدث منتجات همسات للأدوات المنزلية في قسم ${subCatName}. معرض همسات للأدوات المنزلية يجمع لك كل ما يحتاجه المطبخ العصري: زجاج، كاسات، شربات، أطقم صيني وخزف، أنتيكات وكرستالات، أدوات المائدة، أطقم التسالي، أطقم الميلامين، أطقم الأركوبال والأركوبايركس، أطقم السفرة، أطقم الشاي والجاتوه، أطقم العشاء، والمزيد... مع تشكيلة واسعة من التصاميم الأنيقة، وجودة عالية بأسعار تنافسية تناسب كل الأذواق.`,
                image: firstItems[0]?.image || '/Hamasat-ShowCase.webp',
                keywords: `${subCatName},${commaSeparateWords(subCatName)},همسات, همسات هوم, معرض همسات, أدوات منزلية, ادوات مطبخ, اطقم طهي, اطقم تقديم, اطقم سفرة, اواني منزلية, اواني طهي, طاسات جرانيت, طاسات تيفال, طاسات استانلس, حلل جرانيت, حلل تيفال, حلل استانلس, ادوات تقديم, ادوات تقطيع, ادوات مطبخ عصرية, ادوات منزلية فاخرة, منتجات منزلية, مستلزمات المطبخ, مستلزمات البيت, اطقم عشاء, اطقم صيني, اطقم شاي, اطقم قهوة, ديكورات مطبخ, معرض ادوات منزلية, ادوات منزلية في الشرقية, ادوات منزلية في فاقوس, مطبخ عصري, اسعار ادوات منزلية, افضل ادوات منزلية, ادوات منزلية اونلاين, شراء ادوات منزلية, تسوق ادوات مطبخ, ادوات مطبخ حديثة, ادوات منزلية عالية الجودة, همسات للأدوات المنزلية, معرض ادوات منزلية فاقوس, ادوات منزلية شارع الدروس, معرض ادوات منزلية الشرقية, اواني حديثة, اطقم تقديم حديثة, همسات فاقوس, معرض همسات شارع الدروس, ادوات مطبخ فاقوس, مستلزمات منزلية الشرقية`,
                url
            };

            html = injectMeta(html, meta, ogImages + '\n' + ogSeeAlso + `
      <meta property="og:type" content="product.group" />
      <meta property="og:site_name" content="معرض همسات هوم للأدوات المنزلية" />
      <meta name="twitter:card" content="summary_large_image" />
    `);

            // ✅ Inject Initial Data & Semantic HTML
            const initialData = { products: firstItems, seeAlso, subCatName };
            const allCatProducts = [...firstItems, ...seeAlso];
            const seoHtml = `
                <div id="root">
                    <main>
                        <h1>معرض همسات - ${subCatName}</h1>
                        <ul>
                            ${allCatProducts.map(p => `<li><a href="/subcategory/${subCatId}/${encodeURIComponent(subCatName)}/product/${p.id}/${encodeURIComponent(p.name_ar)}">
                                <img src="${p.image}" alt="${p.name_ar}" />
                                <h2>${p.name_ar}</h2>
                            </a></li>`).join('')}
                        </ul>
                    </main>
                </div>
            `;
            html = html.replace(
                '<div id="root"></div>',
                `${seoHtml}<script>window.__INITIAL_DATA__ = ${JSON.stringify(initialData)}</script>`
            );

            return res.send(html);

        } catch (err) {
            console.error(err);
            return res.redirect('/notfound');
        }
    });

    // صفحة كل الفئات
    app.get('/allsubcategories', async (req, res) => {
        try {
            const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
            let html = indexTemplate;

            html = injectMeta(html, {
                title: "كل الفئات - همسات هوم",
                description: "كل الفئات - همسات هوم استعرض جميع الفئات المتوفرة في معرض همسات هوم للأدوات المنزلية. زجاج، كاسات، شربات، أطقم صيني وخزف، أنتيكات وكرستالات، أدوات المائدة، أطقم التسالي، أطقم الميلامين، أطقم الأركوبال والأركوبايركس، أطقم السفرة، أطقم الشاي والجاتوه، أطقم العشاء، والمزيد بأفضل الأسعار.",
                keywords: 'همسات, همسات هوم, معرض همسات, أدوات منزلية, ادوات مطبخ, اطقم طهي, اطقم تقديم, اطقم سفرة, اواني منزلية, اواني طهي, طاسات جرانيت, طاسات تيفال, طاسات استانلس, حلل جرانيت, حلل تيفال, حلل استانلس, ادوات تقديم, ادوات تقطيع, ادوات مطبخ عصرية, ادوات منزلية فاخرة, منتجات منزلية, مستلزمات المطبخ, مستلزمات البيت, اطقم عشاء, اطقم صيني, اطقم شاي, اطقم قهوة, ديكورات مطبخ, معرض ادوات منزلية, ادوات منزلية في الشرقية, ادوات منزلية في فاقوس, مطبخ عصري, اسعار ادوات منزلية, افضل ادوات منزلية, ادوات منزلية اونلاين, شراء ادوات منزلية, تسوق ادوات مطبخ, ادوات مطبخ حديثة, ادوات منزلية عالية الجودة, همسات للأدوات المنزلية, معرض ادوات منزلية فاقوس, ادوات منزلية شارع الدروس, معرض ادوات منزلية الشرقية, اواني حديثة, اطقم تقديم حديثة, همسات فاقوس, معرض همسات شارع الدروس, ادوات مطبخ فاقوس, مستلزمات منزلية الشرقية',
                image: "/Hamasat-ShowCase.webp",
                url,
            });

            res.send(html);
        } catch (err) {
            console.error(err);
            res.status(500).send('SSR server error');
        }
    });

    // صفحة كل البراندات
    app.get('/allbrands', async (req, res) => {
        try {
            const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
            let html = indexTemplate;

            html = injectMeta(html, {
                title: "كل البراندات - همسات هوم",
                description: "كل البراندات - همسات هوم استعرض جميع الماركات المتوفرة في معرض همسات هوم للأدوات المنزلية. تسوق من براندات متنوعة تشمل أطقم الطهي، أدوات المطبخ، والمزيد بأفضل الأسعار.",
                keywords: 'همسات, همسات هوم, معرض همسات, أدوات منزلية, ادوات مطبخ, اطقم طهي, اطقم تقديم, اطقم سفرة, اواني منزلية, اواني طهي, طاسات جرانيت, طاسات تيفال, طاسات استانلس, حلل جرانيت, حلل تيفال, حلل استانلس, ادوات تقديم, ادوات تقطيع, ادوات مطبخ عصرية, ادوات منزلية فاخرة, منتجات منزلية, مستلزمات المطبخ, مستلزمات البيت, اطقم عشاء, اطقم صيني, اطقم شاي, اطقم قهوة, ديكورات مطبخ, معرض ادوات منزلية, ادوات منزلية في الشرقية, ادوات منزلية في فاقوس, مطبخ عصري, اسعار ادوات منزلية, افضل ادوات منزلية, ادوات منزلية اونلاين, شراء ادوات منزلية, تسوق ادوات مطبخ, ادوات مطبخ حديثة, ادوات منزلية عالية الجودة, همسات للأدوات المنزلية, معرض ادوات منزلية فاقوس, ادوات منزلية شارع الدروس, معرض ادوات منزلية الشرقية, اواني حديثة, اطقم تقديم حديثة, همسات فاقوس, معرض همسات شارع الدروس, ادوات مطبخ فاقوس, مستلزمات منزلية الشرقية',
                image: "/Hamasat-ShowCase.webp",
                url,
            });

            res.send(html);
        } catch (err) {
            console.error(err);
            res.status(500).send('SSR server error');
        }
    });

    // Serve static build if exists
    if (fs.existsSync(buildPath)) {
        app.use(express.static(buildPath));

        // أي راوت مش موجودة ترجع index.html
        app.get('*', (req, res) => {
            res.sendFile(path.join(buildPath, 'index.html'));
        });
    } else {
        // لو build مش موجود، ابعت HTML افتراضي
        app.get('*', (req, res) => {
            renderNotFoundPage(req, res);
        });

    }
};
