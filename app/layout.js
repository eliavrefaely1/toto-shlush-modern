import '/styles/globals.css';

export const metadata = {
  title: 'טוטו שלוש',
  description: 'בואו נביא את המכה! 💰',
};

export default function RootLayout({ children }) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <link rel="stylesheet" href="/styles/globals.css" />
      </head>
      <body className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        {children}
      </body>
    </html>
  );
}
