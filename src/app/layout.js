import "./globals.css";

export const metadata = {
  title: "Directorio de Páginas Web de Emergencia — Ayuda Venezuela",
  description:
    "Colección verificada de recursos web internacionales y locales dedicados a la ayuda humanitaria, respuesta de emergencia y coordinación logística en Venezuela.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}