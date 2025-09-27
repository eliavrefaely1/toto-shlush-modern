'use client';

const HomeFooter = () => {
  return (
    <footer className="bg-gradient-to-r from-blue-800 to-blue-900 text-white py-8 mt-16">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <p className="text-blue-200 text-sm mt-3">טוטו שלוש! כל הזכויות שמורות © {new Date().getFullYear()}</p>
        <div className="flex justify-center gap-4 mt-4 text-2xl">
          <span>⚽</span>
          <span>🏆</span>
          <span>💰</span>
          <span>🎯</span>
        </div>
        <p className="text-blue-200 text-sm mt-3">תיהנו ובהצלחה!</p>
      </div>
    </footer>
  );
};

export default HomeFooter;
