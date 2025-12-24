import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllApartments, deleteApartment, updateApartmentOwner, resetApartmentPin } from '../../lib/api';
import { PINDisplayModal } from './PINDisplayModal';
import type { Apartment, CreateApartmentResponse } from '../../types';

export function ApartmentManagement() {
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete confirmation state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Reset PIN state
  const [resetResult, setResetResult] = useState<CreateApartmentResponse | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  const loadApartments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAllApartments();
      setApartments(data);
    } catch {
      setError('שגיאה בטעינת הנתונים');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadApartments();
  }, []);

  const handleStartEdit = (apartment: Apartment) => {
    setEditingId(apartment.id);
    setEditingName(apartment.ownerName);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleSaveEdit = async (apartmentId: string) => {
    if (!editingName.trim()) {
      return;
    }

    setIsUpdating(true);
    try {
      const result = await updateApartmentOwner(apartmentId, editingName);

      if (result.success) {
        // Update local state
        setApartments(apartments.map(apt =>
          apt.id === apartmentId ? result.data : apt
        ));
        setEditingId(null);
        setEditingName('');
      } else {
        setError(result.error);
      }
    } catch {
      setError('אירעה שגיאה בעדכון השם');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteClick = (apartmentId: string) => {
    setDeletingId(apartmentId);
  };

  const handleCancelDelete = () => {
    setDeletingId(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;

    setIsDeleting(true);
    try {
      const result = await deleteApartment(deletingId);

      if (result.success) {
        // Remove from local state
        setApartments(apartments.filter(apt => apt.id !== deletingId));
        setDeletingId(null);

        // Show success message if votes were deleted
        if (result.deletedVotesCount > 0) {
          alert(`הדירה נמחקה בהצלחה. נמחקו ${result.deletedVotesCount} הצבעות.`);
        }
      } else {
        setError(result.error);
      }
    } catch {
      setError('אירעה שגיאה במחיקת הדירה');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResetPIN = async (apartmentNumber: string) => {
    setIsResetting(true);
    setError(null);

    try {
      const result = await resetApartmentPin(apartmentNumber);

      if (result.success) {
        setResetResult(result.data);
      } else {
        setError(result.error);
      }
    } catch {
      setError('אירעה שגיאה באיפוס הקוד');
    } finally {
      setIsResetting(false);
    }
  };

  const handlePINModalClose = () => {
    setResetResult(null);
  };

  const apartmentToDelete = apartments.find(apt => apt.id === deletingId);

  return (
    <>
      <div className="min-h-screen bg-gray-100" dir="rtl">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <Link to="/admin" className="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-block">
              ← חזרה לרשימה
            </Link>
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-800">ניהול דירות</h1>
              <Link
                to="/admin/apartments/new"
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                דירה חדשה
              </Link>
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 py-8">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
              <button
                onClick={() => setError(null)}
                className="mr-4 text-red-900 hover:text-red-950 font-semibold"
              >
                ✕
              </button>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-12">
              <div className="w-8 h-8 mx-auto border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}

          {/* Apartments Table */}
          {!isLoading && (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-600">
                      מספר דירה
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-600">
                      שם בעל הדירה
                    </th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-600">
                      פעולות
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {apartments.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                        אין דירות במערכת
                      </td>
                    </tr>
                  ) : (
                    apartments.map((apartment) => (
                      <tr key={apartment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-800 text-lg">
                            {apartment.number}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {editingId === apartment.id ? (
                            <input
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              className="w-full text-lg p-2 border border-blue-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                              disabled={isUpdating}
                              autoFocus
                            />
                          ) : (
                            <div className="text-gray-800">{apartment.ownerName}</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {editingId === apartment.id ? (
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => handleSaveEdit(apartment.id)}
                                disabled={isUpdating || !editingName.trim()}
                                className="text-green-600 hover:text-green-800 text-sm font-medium disabled:text-gray-400"
                              >
                                {isUpdating ? 'שומר...' : 'שמור'}
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                disabled={isUpdating}
                                className="text-gray-600 hover:text-gray-800 text-sm font-medium disabled:text-gray-400"
                              >
                                ביטול
                              </button>
                            </div>
                          ) : (
                            <div className="flex justify-center gap-3">
                              <button
                                onClick={() => handleStartEdit(apartment)}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                title="עריכת שם"
                              >
                                ✏️ שם
                              </button>
                              <button
                                onClick={() => handleResetPIN(apartment.number)}
                                disabled={isResetting}
                                className="text-orange-600 hover:text-orange-800 text-sm font-medium disabled:text-gray-400"
                                title="איפוס PIN"
                              >
                                🔑 PIN
                              </button>
                              <button
                                onClick={() => handleDeleteClick(apartment.id)}
                                className="text-red-600 hover:text-red-800 text-sm font-medium"
                                title="מחיקת דירה"
                              >
                                🗑️ מחק
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Info Box */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
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
                <p className="font-semibold mb-1">מידע חשוב:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>שם</strong> - עריכת שם בעל הדירה</li>
                  <li><strong>PIN</strong> - יצירת קוד חדש (הקוד הישן יפסיק לעבוד)</li>
                  <li><strong>מחק</strong> - מחיקת דירה (גם כל ההצבעות שלה!)</li>
                </ul>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Delete Confirmation Modal */}
      {deletingId && apartmentToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir="rtl">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">אישור מחיקה</h3>
                <p className="text-gray-700 mb-2">
                  האם אתה בטוח שברצונך למחוק את הדירה:
                </p>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3">
                  <p className="font-semibold text-lg">דירה {apartmentToDelete.number}</p>
                  <p className="text-gray-600">{apartmentToDelete.ownerName}</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-800 text-sm font-semibold">⚠️ אזהרה!</p>
                  <p className="text-red-700 text-sm">
                    פעולה זו תמחק גם את כל ההצבעות של הדירה ולא ניתן לבטלה!
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg disabled:bg-gray-400"
              >
                {isDeleting ? 'מוחק...' : 'כן, מחק'}
              </button>
              <button
                onClick={handleCancelDelete}
                disabled={isDeleting}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-4 rounded-lg disabled:bg-gray-100"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PIN Display Modal */}
      {resetResult && (
        <PINDisplayModal
          isOpen={true}
          apartmentNumber={resetResult.apartmentNumber}
          ownerName={resetResult.ownerName}
          pin={resetResult.pin}
          onClose={handlePINModalClose}
          isReset={true}
        />
      )}
    </>
  );
}
