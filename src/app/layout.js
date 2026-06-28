import Script from 'next/script';
import "./globals.css";

const GA_ID = 'G-QXFRPSVFK6';

export const metadata = {
  title: "Directorio de Páginas Web de Emergencia — Ayuda Venezuela",
  description:
    "Colección verificada de recursos web internacionales y locales dedicados a la ayuda humanitaria, respuesta de emergencia y coordinación logística en Venezuela.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        {/* Google Analytics — cargado después de la interactividad para no bloquear el render */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}', { page_path: window.location.pathname });
          `}
        </Script>

        {children}
      </body>
    </html>
  );
}