require('dotenv').config();

const path = require('path');
const fs = require('fs');
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const compression = require('compression');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const hpp = require('hpp');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');

const { sequelize, User } = require('./models');
const ApiError = require('./utils/apiError');
const globalErrorMiddleware = require('./middleware/globalErrorMiddleware');
const mountRoutes = require('./routes');

const generateSitemap = require('./sitemapGenerator');
const generateFeed = require('./generateFeed');
const ssr = require('./ssr');

// Default superAdmin
const defaultSuperAdminEmail = process.env.DEFAULT_SUPERADMIN_EMAIL || 'hamasat.home.eg@gmail.com';
const defaultSuperAdminPassword = process.env.DEFAULT_SUPERADMIN_PASSWORD || 'Hamasat@01009770207';

const app = express();

app.set('trust proxy', 1); // مهم عشان يقرأ x-forwarded-proto

// ===== Force HTTPS Middleware =====
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    let host = req.headers.host;
    let proto = req.headers['x-forwarded-proto'] || req.protocol;

    // لو مش https → redirect
    if (proto !== 'https') {
      return res.redirect(301, `https://${host}${req.url}`);
    }

    // لو فيه www → نشيلها
    if (host.startsWith('www.')) {
      host = host.replace(/^www\./, '');
      return res.redirect(301, `https://${host}${req.url}`);
    }
  }
  next();
});


// ===== Middlewares =====
const allowlist = process.env.ALLOWLIST ? process.env.ALLOWLIST.split(',').map(url => url.trim()) : [];
console.log(allowlist)
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowlist.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Not allowed by CORS: ${origin}`));
      }
    },
    credentials: true,
  })
);

app.use(compression());
app.use(bodyParser.json());
app.use(cookieParser());

app.use(
  helmet.contentSecurityPolicy({
    useDefaults: true,
    directives: {
      defaultSrc: [
        "'self'",
        "https://hamsathome.com",
        "https://www.hamsathome.com"
      ],

      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // ✅ ضروري لتشغيل Google & Facebook inline scripts
        "https://www.googletagmanager.com",
        "https://www.google-analytics.com",
        "https://connect.facebook.net",
        "https://maps.googleapis.com",
        "https://maps.gstatic.com",
        "https://static.cloudflareinsights.com",
      ],

      styleSrc: [
        "'self'",
        "'unsafe-inline'", // ✅ مطلوب لتطبيق CSS inline أو Google Fonts
        "https://fonts.googleapis.com"
      ],

      imgSrc: [
        "'self'",
        "data:",
        "https:",
        "blob:",
        "https://www.facebook.com",
        "https://scontent.xx.fbcdn.net",
        "https://www.google-analytics.com",
        "https://maps.googleapis.com",
        "https://maps.gstatic.com",
        "https://hamsathome.com",
        "https://www.hamsathome.com"
      ],

      connectSrc: [
        "'self'",
        "https://hamsathome.com",
        "https://www.hamsathome.com",
        "https://www.google-analytics.com",
        "https://www.googletagmanager.com",
        "https://connect.facebook.net",
        "https://maps.googleapis.com",
        "https://maps.gstatic.com"
      ],

      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com",
        "data:"
      ],

      frameSrc: [
        "'self'",
        "https://www.google.com",
        "https://www.google.com/maps",
        "https://maps.google.com",
        "https://connect.facebook.net",
        "https://web.facebook.com",
        "https://www.facebook.com"
      ],

      manifestSrc: [
        "'self'",
        "https://hamsathome.com",
        "https://www.hamsathome.com"
      ],
    },
  })
);



app.use(express.static(path.join(__dirname, 'uploads')));
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'common'));


app.use(
  rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 400,
    message: { message: 'Too many requests, please try again later.' },
    statusCode: 429,
  })
);
app.use(hpp());

// ===== API Routes =====
app.get('/api/health', (req, res) =>
  res.status(200).json({ success: true, message: 'API is up and running!' })
);

mountRoutes(app);

// ===== SSR Routes =====
ssr(app); // اضافة كل SSR routes من ssr.js

// ===== Serve React Build or Fallback =====
const buildPath = path.join(__dirname, 'public/build');
const indexFile = path.join(buildPath, 'index.html');

if (fs.existsSync(indexFile)) {
  // Serve JS/CSS/fonts مع Cache طويل + immutable
  app.use(express.static(buildPath, {
    maxAge: '30d', // 1 سنة
    etag: true,
    lastModified: true,
    immutable: true, // الملفات مع hash تتغير الاسم لو محتوى اتغير
  }));

  // Serve media/images
  app.use('/static/media', express.static(path.join(buildPath, 'static/media'), {
    maxAge: '30d',
    immutable: true,
  }));

  // React fallback لأي route
  app.get('*', (req, res) => {
    res.sendFile(indexFile);
  });
} else {
  app.get('*', (req, res) => {
    res.send('<html><head><title>App</title></head><body><div id="root">React build not found.</div></body></html>');
  });
}

// ===== Global Error Middleware =====
app.use(globalErrorMiddleware);

// ===== Start Server =====
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, async () => {
  await sequelize.authenticate();
  await sequelize.sync({ alter: true });

  console.log(`Server running on port ${PORT}`);

  // Default Super Admin Creation
  const superAdminExists = await User.findOne({ where: { role: 'superAdmin' } });
  if (!superAdminExists) {
    await User.create({
      email: defaultSuperAdminEmail,
      password: defaultSuperAdminPassword,
      role: 'superAdmin',
      name: 'Super Admin',
      isActive: true,
    });
    console.log('Default superAdmin created.');
  }

  // ==== Generate Sitemap فورًا عند start السيرفر ====
  await generateSitemap();
  await generateFeed();
  // ==== جدولة توليد Sitemap كل 7 أيام ====
  cron.schedule('0 0 */7 * *', async () => {
    console.log('🔄 Weekly sitemap regeneration started...');
    await generateSitemap();
    await generateFeed();
  }, {
    timezone: "Africa/Cairo"

  });
  console.log(`🕒 Feeds regenerated at: ${new Date().toLocaleString()}`);

});

// ===== Graceful Shutdown =====
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  server.close(() => process.exit(0));
});

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  server.close(() => process.exit(0));
});
