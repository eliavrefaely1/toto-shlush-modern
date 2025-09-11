import './globals.css'

export const metadata = {
  title: 'טוטו החברים',
  description: 'המקום לזכות בגדול! 💰',
}

export default function RootLayout({ children }) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <style dangerouslySetInnerHTML={{
          __html: `
            .min-h-screen { min-height: 100vh; }
            .bg-gradient-to-br { background: linear-gradient(to bottom right, #f0fdf4, #ffffff, #f0fdf4); }
            .from-green-50 { --tw-gradient-from: #f0fdf4; }
            .via-white { --tw-gradient-via: #ffffff; }
            .to-green-100 { --tw-gradient-to: #dcfce7; }
            .relative { position: relative; }
            .overflow-x-hidden { overflow-x: hidden; }
            .absolute { position: absolute; }
            .inset-0 { top: 0; right: 0; bottom: 0; left: 0; }
            .z-10 { z-index: 10; }
            .bg-white { background-color: #ffffff; }
            .backdrop-blur-md { backdrop-filter: blur(12px); }
            .border-b { border-bottom-width: 1px; }
            .border-green-200 { border-color: #bbf7d0; }
            .shadow-lg { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); }
            .max-w-6xl { max-width: 72rem; }
            .mx-auto { margin-left: auto; margin-right: auto; }
            .px-4 { padding-left: 1rem; padding-right: 1rem; }
            .py-4 { padding-top: 1rem; padding-bottom: 1rem; }
            .flex { display: flex; }
            .items-center { align-items: center; }
            .justify-between { justify-content: space-between; }
            .gap-3 { gap: 0.75rem; }
            .w-12 { width: 3rem; }
            .h-12 { height: 3rem; }
            .bg-gradient-to-r { background: linear-gradient(to right, var(--tw-gradient-stops)); }
            .from-green-500 { --tw-gradient-from: #22c55e; }
            .to-green-600 { --tw-gradient-to: #16a34a; }
            .rounded-full { border-radius: 9999px; }
            .justify-center { justify-content: center; }
            .text-2xl { font-size: 1.5rem; line-height: 2rem; }
            .font-bold { font-weight: 700; }
            .text-green-800 { color: #166534; }
            .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
            .text-green-600 { color: #16a34a; }
            .gap-2 { gap: 0.5rem; }
            .btn { padding: 0.5rem 1rem; border-radius: 0.5rem; font-weight: 500; transition: all 0.2s; outline: none; border: none; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; text-decoration: none; }
            .btn-secondary { background-color: #e5e7eb; color: #374151; }
            .btn-secondary:hover { background-color: #d1d5db; }
            .btn-primary { background-color: #22c55e; color: white; }
            .btn-primary:hover { background-color: #16a34a; }
            .w-4 { width: 1rem; }
            .h-4 { height: 1rem; }
            .w-6 { width: 1.5rem; }
            .h-6 { height: 1.5rem; }
            .text-white { color: #ffffff; }
            .py-8 { padding-top: 2rem; padding-bottom: 2rem; }
            .bg-gradient-to-r { background: linear-gradient(to right, var(--tw-gradient-stops)); }
            .from-yellow-400 { --tw-gradient-from: #facc15; }
            .to-orange-500 { --tw-gradient-to: #f97316; }
            .p-6 { padding: 1.5rem; }
            .rounded-2xl { border-radius: 1rem; }
            .shadow-xl { box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); }
            .mb-8 { margin-bottom: 2rem; }
            .text-center { text-align: center; }
            .text-4xl { font-size: 2.25rem; line-height: 2.5rem; }
            .mb-3 { margin-bottom: 0.75rem; }
            .text-white { color: #ffffff; }
            .font-bold { font-weight: 700; }
            .text-xl { font-size: 1.25rem; line-height: 1.75rem; }
            .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
            .card { background-color: white; border-radius: 0.75rem; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06); overflow: hidden; }
            .card-header { padding: 1.5rem; border-bottom: 1px solid #e5e7eb; }
            .card-content { padding: 1.5rem; }
            .text-center { text-align: center; }
            .text-green-800 { color: #166534; }
            .flex { display: flex; }
            .items-center { align-items: center; }
            .justify-center { justify-content: center; }
            .gap-3 { gap: 0.75rem; }
            .w-8 { width: 2rem; }
            .h-8 { height: 2rem; }
            .bg-gradient-to-br { background: linear-gradient(to bottom right, var(--tw-gradient-stops)); }
            .from-yellow-400 { --tw-gradient-from: #facc15; }
            .via-yellow-500 { --tw-gradient-via: #eab308; }
            .to-orange-500 { --tw-gradient-to: #f97316; }
            .rounded-2xl { border-radius: 1rem; }
            .p-6 { padding: 1.5rem; }
            .text-white { color: #ffffff; }
            .text-6xl { font-size: 3.75rem; line-height: 1; }
            .font-bold { font-weight: 700; }
            .mb-2 { margin-bottom: 0.5rem; }
            .text-xl { font-size: 1.25rem; line-height: 1.75rem; }
            .opacity-90 { opacity: 0.9; }
            .justify-center { justify-content: center; }
            .gap-3 { gap: 0.75rem; }
            .mt-4 { margin-top: 1rem; }
            .text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
            .text-lg { font-size: 1.125rem; line-height: 1.75rem; }
            .font-semibold { font-weight: 600; }
            .grid { display: grid; }
            .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
            .md\\:grid-cols-2 { @media (min-width: 768px) { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
            .gap-6 { gap: 1.5rem; }
            .group { }
            .hover\\:shadow-xl:hover { box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); }
            .transition-all { transition-property: all; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
            .duration-300 { transition-duration: 300ms; }
            .group-hover\\:scale-105:hover { transform: scale(1.05); }
            .w-16 { width: 4rem; }
            .h-16 { height: 4rem; }
            .text-green-500 { color: #22c55e; }
            .mx-auto { margin-left: auto; margin-right: auto; }
            .mb-4 { margin-bottom: 1rem; }
            .text-2xl { font-size: 1.5rem; line-height: 2rem; }
            .font-bold { font-weight: 700; }
            .text-green-800 { color: #166534; }
            .mb-2 { margin-bottom: 0.5rem; }
            .text-gray-600 { color: #4b5563; }
            .mb-4 { margin-bottom: 1rem; }
            .w-full { width: 100%; }
            .text-lg { font-size: 1.125rem; line-height: 1.75rem; }
            .py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
            .text-yellow-500 { color: #eab308; }
            .bg-green-800 { background-color: #166534; }
            .text-white { color: #ffffff; }
            .py-6 { padding-top: 1.5rem; padding-bottom: 1.5rem; }
            .mt-16 { margin-top: 4rem; }
            .text-green-200 { color: #bbf7d0; }
            .text-lg { font-size: 1.125rem; line-height: 1.75rem; }
            .text-green-300 { color: #86efac; }
            .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
            .mt-2 { margin-top: 0.5rem; }
            @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
            @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-20px); } }
            .football-bg { background-image: url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23dcfce7' fill-opacity='0.3'%3E%3Cpath d='M20 20c0-11.046-8.954-20-20-20v40c11.046 0 20-8.954 20-20zM0 20c0 11.046 8.954 20 20 20V0C8.954 0 0 8.954 0 20z'/%3E%3C/g%3E%3C/svg%3E"); }
            .money-floating { position: fixed; font-size: 1.5rem; color: #f59e0b; opacity: 0.1; animation: float 6s ease-in-out infinite; pointer-events: none; z-index: 0; }
          `
        }} />
      </head>
      <body className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100">
        {children}
      </body>
    </html>
  )
}
