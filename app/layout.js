import "./globals.css";

export const metadata = {
  title: "Midnight | Streamer Bazar & Comunidade",
  description: "Encontre seus streamers favoritos, veja lives online e explore lojas integradas do Discord.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
      </body>
    </html>
  );
}
