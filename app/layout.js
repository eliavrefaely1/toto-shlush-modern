import './globals.css';
import Navbar from './components/Navbar.jsx';

export const metadata = {
  title: 'טוטו שלוש',
  description: 'בואו נביא את המכה! 💰',
};

export default function RootLayout({ children }) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <link
          rel="icon"
          href={`data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='46' fill='%231256eb'/><text x='50' y='58' font-size='44' text-anchor='middle' fill='white' font-family='Arial'>ט</text></svg>`}
        />
      </head>
      <body className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
