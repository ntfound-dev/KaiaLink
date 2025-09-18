// apps/frontend/app/layout.tsx  (ROOT layout — hanya satu file ini pakai <html> & <body>)
import ClientProviders from "./client-providers"; // sesuaikan path jika beda

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head />
      <body>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
