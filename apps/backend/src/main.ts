// LOKASI FILE: apps/backend/src/main.ts
// -------------------------------------
// Versi ini sudah diperbaiki untuk menerima koneksi dari Windows.

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Mengaktifkan CORS agar frontend bisa mengakses API ini
  app.enableCors();

  // Mengaktifkan ValidationPipe secara global
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

  // Setup untuk dokumentasi API menggunakan Swagger
  const config = new DocumentBuilder()
    .setTitle('KaiaLink API')
    .setDescription('Dokumentasi API untuk Backend KaiaLink')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  // Kita gunakan '/api' agar sesuai dengan URL pengujian kita
  SwaggerModule.setup('api', app, document); 

  const port = process.env.PORT || 3001;

  // --- PERUBAHAN PENTING ADA DI SINI ---
  // Menambahkan '0.0.0.0' agar server menerima koneksi dari luar WSL (Windows)
  await app.listen(port, '0.0.0.0');
  
  console.log(`Aplikasi berjalan di: http://localhost:${port}/api`);
}
bootstrap();

