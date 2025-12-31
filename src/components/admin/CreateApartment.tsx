import { useState } from 'react';
import { Link } from 'react-router-dom';
import { createApartment } from '../../lib/api';
import { PINDisplayModal } from './PINDisplayModal';
import type { CreateApartmentResponse } from '../../types';

export function CreateApartment() {
  const [apartmentNumber, setApartmentNumber] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phoneNumber1, setPhoneNumber1] = useState('');
  const [ownerName1, setOwnerName1] = useState('');
  const [phoneNumber2, setPhoneNumber2] = useState('');
  const [ownerName2, setOwnerName2] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdApartment, setCreatedApartment] = useState<CreateApartmentResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await createApartment(
        apartmentNumber,
        ownerName,
        phoneNumber1 || undefined,
        ownerName1 || undefined,
        phoneNumber2 || undefined,
        ownerName2 || undefined
      );

      if (result.success) {
        setCreatedApartment(result.data);
      } else {
        setError(result.error);
      }
    } catch {
      setError('אירעה שגיאה ביצירת הדירה. אנא נסו שוב.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleModalClose = () => {
    // Clear form after modal closes
    setCreatedApartment(null);
    setApartmentNumber('');
    setOwnerName('');
    setPhoneNumber1('');
    setOwnerName1('');
    setPhoneNumber2('');
    setOwnerName2('');
  };

  const isFormValid = apartmentNumber.trim() !== '' && ownerName.trim() !== '';

  return (
    <>
      <div className="min-h-screen" dir="rtl">
        {/* Header */}
        <header className="header-modern sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <Link
              to="/admin/apartments"
              className="text-gray-500 hover:text-blue-600 text-sm inline-flex items-center gap-1 mb-2 transition-colors"
            >
              <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              חזרה לניהול דירות
            </Link>
            <h1 className="text-2xl font-bold text-gray-800">יצירת דירה חדשה</h1>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-6 py-8">
          <form onSubmit={handleSubmit} className="card p-6">
            <div className="space-y-6">
              {/* Apartment Number */}
              <div>
                <label
                  htmlFor="apartmentNumber"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  מספר דירה
                </label>
                <input
                  type="text"
                  id="apartmentNumber"
                  value={apartmentNumber}
                  onChange={(e) => setApartmentNumber(e.target.value)}
                  className="w-full text-lg p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                  placeholder="לדוגמה: 42 או 10A"
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Owner Name */}
              <div>
                <label
                  htmlFor="ownerName"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  שם בעל הדירה
                </label>
                <input
                  type="text"
                  id="ownerName"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full text-lg p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                  placeholder="לדוגמה: משה לוי"
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Phone Numbers Section */}
              <div className="border-t border-gray-100 pt-6">
                <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  פרטי התקשרות להעברת PIN (אופציונלי)
                </h3>

                {/* Phone 1 */}
                <div className="mb-4 bg-gray-50 p-4 rounded-xl">
                  <label className="block text-sm font-medium text-gray-600 mb-3">
                    איש קשר 1
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="tel"
                      value={phoneNumber1}
                      onChange={(e) => setPhoneNumber1(e.target.value)}
                      className="text-base p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                      placeholder="מספר טלפון"
                      disabled={isLoading}
                    />
                    <input
                      type="text"
                      value={ownerName1}
                      onChange={(e) => setOwnerName1(e.target.value)}
                      className="text-base p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                      placeholder="שם איש הקשר"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Phone 2 */}
                <div className="bg-gray-50 p-4 rounded-xl">
                  <label className="block text-sm font-medium text-gray-600 mb-3">
                    איש קשר 2
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="tel"
                      value={phoneNumber2}
                      onChange={(e) => setPhoneNumber2(e.target.value)}
                      className="text-base p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                      placeholder="מספר טלפון"
                      disabled={isLoading}
                    />
                    <input
                      type="text"
                      value={ownerName2}
                      onChange={(e) => setOwnerName2(e.target.value)}
                      className="text-base p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                      placeholder="שם איש הקשר"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>

              {/* Info Box */}
              <div className="info-box">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-1">חשוב!</p>
                    <p>
                      לאחר יצירת הדירה יוצג קוד PIN חד-פעמי. יש להעתיק או להדפיס את הקוד לפני סגירת החלון.
                      לא ניתן לראות את הקוד שוב!
                    </p>
                  </div>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl flex items-center gap-3">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!isFormValid || isLoading}
                className="w-full btn btn-primary py-3.5 disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    יוצר דירה...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    צור דירה
                  </div>
                )}
              </button>
            </div>
          </form>
        </main>
      </div>

      {/* PIN Display Modal */}
      {createdApartment && (
        <PINDisplayModal
          isOpen={true}
          apartmentNumber={createdApartment.apartmentNumber}
          ownerName={createdApartment.ownerName}
          pin={createdApartment.pin}
          phoneNumber1={createdApartment.phoneNumber1}
          ownerName1={createdApartment.ownerName1}
          phoneNumber2={createdApartment.phoneNumber2}
          ownerName2={createdApartment.ownerName2}
          onClose={handleModalClose}
        />
      )}
    </>
  );
}
