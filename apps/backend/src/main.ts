// apps/backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // --- SET GLOBAL PREFIX supaya semua route berada di /api
  // (misal: GET /api/users/me)
  const GLOBAL_PREFIX = 'api';
  app.setGlobalPrefix(GLOBAL_PREFIX);

  // CORS: untuk development boleh flexible, production gunakan env
  const isProd = process.env.NODE_ENV === 'production';
  const allowedOrigin = isProd
    ? process.env.ALLOWED_ORIGIN || 'https://your-production-domain.com'
    : true; // development: allow all origins (or set 'http://localhost:3000')

  app.enableCors({
    origin: allowedOrigin,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type,Authorization,Accept,Origin,User-Agent,X-Requested-With',
    exposedHeaders: 'Authorization,Content-Length,ETag',
    optionsSuccessStatus: 204,
  });

  // ValidationPipe global
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

  // Swagger / OpenAPI - docs tersedia di /api/docs (sesuaikan path)
  const config = new DocumentBuilder()
    .setTitle('KaiaLink API')
    .setDescription('Dokumentasi API untuk Backend KaiaLink')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  // gunakan `/api/docs` sehingga tidak bertabrakan dengan prefix
  SwaggerModule.setup(`${GLOBAL_PREFIX}/docs`, app, document);

  // Jika kamu menjalankan di WSL, dengerin 0.0.0.0 agar host (Windows) bisa akses
  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');

  // Logging: tunjukkan URL yang benar untuk akses dari host dev
  const localUrl = `http://localhost:${port}/${GLOBAL_PREFIX}`;
  const hostUrl = `http://${await app.getUrl()}`; // kadang returns 0.0.0.0 mapping
  console.log(`Aplikasi berjalan di: ${localUrl} (listening on 0.0.0.0:${port})`);
  console.log(`API docs available at: ${localUrl}/docs`);
}
bootstrap();
