// apps/frontend/middleware.ts
import { createI18nMiddleware } from 'next-international/middleware';

const I18nMiddleware = createI18nMiddleware({
  locales: ['id', 'en'],
  defaultLocale: 'id',
  urlMappingStrategy: 'rewrite',
});

export function middleware(request: Request) {
  return I18nMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|static|.*\\..*|_next).*)'],
};