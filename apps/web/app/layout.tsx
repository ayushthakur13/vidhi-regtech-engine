export const metadata = {
  title: "Vidhi — Compliance Tracker",
  description: "Grounded regulatory obligation tracking for SEBI intermediaries.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
