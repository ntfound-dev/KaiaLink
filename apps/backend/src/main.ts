// apps/backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import * as compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // --- GLOBAL PREFIX
  const GLOBAL_PREFIX = 'api';
  app.setGlobalPrefix(GLOBAL_PREFIX);

  // --- trust proxy (safe guard for Express adapter)
  try {
    const httpAdapter = (app as any).getHttpAdapter?.();
    const underlying = httpAdapter?.getInstance?.() as any | undefined;
    if (underlying && typeof underlying.set === 'function') {
      // Express app instance
      underlying.set('trust proxy', true);
      console.log('Set trust proxy on underlying Express instance');
    } else {
      console.log('Underlying HTTP adapter not Express / set() not available — skipping trust proxy.');
    }
  } catch (err) {
    console.warn('Could not set trust proxy (ignored):', err?.message ?? err);
  }

  // --- CORS config parsing ALLOWED_ORIGIN (single or comma-separated)
  const isProd = process.env.NODE_ENV === 'production';
  const rawAllowed = (process.env.ALLOWED_ORIGIN || '').trim();

  let allowedOrigin: string | string[] | boolean = true;
  if (rawAllowed) {
    const parts = rawAllowed.split(',').map((s) => s.trim()).filter(Boolean);
    allowedOrigin = parts.length === 1 ? parts[0] : parts;
  } else if (isProd) {
    console.warn(
      'ALLOWED_ORIGIN not set in production — defaulting to https://your-production-domain.com',
    );
    allowedOrigin = 'https://your-production-domain.com';
  } else {
    allowedOrigin = true; // dev: allow all
  }

  console.log('CORS allowed origin:', allowedOrigin);

  app.enableCors({
    origin: allowedOrigin,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders:
      'Content-Type,Authorization,Accept,Origin,User-Agent,X-Requested-With',
    exposedHeaders: 'Authorization,Content-Length,ETag',
    optionsSuccessStatus: 204,
  });

  // --- security & perf middlewares (optional but useful)
  app.use(helmet());
  app.use(compression());

  // --- ValidationPipe global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // --- Swagger
  const config = new DocumentBuilder()
    .setTitle('KaiaLink API')
    .setDescription('Dokumentasi API untuk Backend KaiaLink')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(`${GLOBAL_PREFIX}/docs`, app, document);

  // --- listen
  const port = Number(process.env.PORT || 3001);
  await app.listen(port, '0.0.0.0');

  const appUrl = await app.getUrl().catch(() => `http://0.0.0.0:${port}`);
  const localUrl = `http://localhost:${port}/${GLOBAL_PREFIX}`;
  console.log(`Aplikasi berjalan di: ${localUrl} (listening on 0.0.0.0:${port})`);
  console.log(`Raw app url: ${appUrl}`);
  console.log(`API docs available at: ${localUrl}/docs`);

  /**
   * Cookies note:
   * If you use cookies across origins (eg: ngrok), ensure cookie options:
   *   sameSite: 'none', secure: true
   * And frontend must call with credentials (axios: withCredentials: true)
   */
}
bootstrap();
