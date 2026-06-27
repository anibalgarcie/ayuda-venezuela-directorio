import { Poppins } from "next/font/google";
import "./globals.css";

// Configuración de la fuente Poppins (la más moderna y redonda)
const poppins = Poppins({ 
  subsets: ["latin"],
  // Importamos varios grosores para tener títulos gruesos y textos ligeros
  weight: ['300', '400', '500', '600', '700', '800'], 
  variable: '--font-poppins', // Creamos una variable CSS opcional
});

export const metadata = {
  title: "S.O.S Venezuela - Portal de Emergencia",
  description: "Información unificada en tiempo real ante la crisis sísmica. Revisa, reporta y salva vidas.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      {/* Aplicamos Poppins directamente al body */}
      <body className={`${poppins.className} antialiased bg-zinc-950 text-zinc-100`}>
        {children}
      </body>
    </html>
  );
}