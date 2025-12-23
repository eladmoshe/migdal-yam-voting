import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div
      className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6"
      dir="rtl"
    >
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">הדף לא נמצא</h2>
        <p className="text-gray-600 mb-8">הדף שחיפשת אינו קיים</p>
        <Link
          to="/"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
        >
          חזרה לדף הבית
        </Link>
      </div>
    </div>
  );
}
