import { Roboto } from "next/font/google";
import "./globals.css";

/*
  Roboto — la tipografía oficial de Google Material Design.
  Disponible públicamente en Google Fonts. Geométrica con terminales
  amigables, excelente legibilidad en interfaces web y móvil.
*/
const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-roboto",
  display: "swap",
});

export const metadata = {
  title: "Ayuda Venezuela — Directorio de Recursos Humanitarios",
  description:
    "Colección verificada de recursos web internacionales y locales dedicados a la ayuda humanitaria, respuesta de emergencia y coordinación logística en Venezuela.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${roboto.variable} antialiased`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}