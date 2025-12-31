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
      <div className="min-h-screen" dir="rtl">
        {/* Header */}
        <header className="header-modern sticky top-0 z-10">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <Link
              to="/admin"
              className="text-gray-500 hover:text-blue-600 text-sm inline-flex items-center gap-1 mb-2 transition-colors"
            >
              <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              חזרה לרשימה
            </Link>
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-800">ניהול דירות</h1>
              <Link
                to="/admin/apartments/new"
                className="btn btn-secondary"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                דירה חדשה
              </Link>
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-6 py-8">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-600 hover:text-red-800 font-semibold p-1 hover:bg-red-100 rounded transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-16">
              <div className="spinner mx-auto"></div>
              <p className="text-gray-500 mt-4">טוען נתונים...</p>
            </div>
          )}

          {/* Apartments Table */}
          {!isLoading && (
            <div className="card overflow-hidden">
              <table className="w-full table-modern">
                <thead>
                  <tr>
                    <th className="text-right">מספר דירה</th>
                    <th className="text-right">שם בעל הדירה</th>
                    <th className="text-center">פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {apartments.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-center py-12">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <p className="text-gray-500">אין דירות במערכת</p>
                        <p className="text-sm text-gray-400 mt-1">הוסף את הדירה הראשונה</p>
                      </td>
                    </tr>
                  ) : (
                    apartments.map((apartment) => (
                      <tr key={apartment.id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                              {apartment.number}
                            </div>
                            <span className="font-medium text-gray-800">דירה {apartment.number}</span>
                          </div>
                        </td>
                        <td>
                          {editingId === apartment.id ? (
                            <input
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              className="w-full text-base p-2.5 border-2 border-blue-400 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-blue-50"
                              disabled={isUpdating}
                              autoFocus
                            />
                          ) : (
                            <span className="text-gray-700">{apartment.ownerName}</span>
                          )}
                        </td>
                        <td>
                          {editingId === apartment.id ? (
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => handleSaveEdit(apartment.id)}
                                disabled={isUpdating || !editingName.trim()}
                                className="btn btn-success py-1.5 px-3 text-sm disabled:opacity-50"
                              >
                                {isUpdating ? 'שומר...' : 'שמור'}
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                disabled={isUpdating}
                                className="text-gray-600 hover:text-gray-800 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                              >
                                ביטול
                              </button>
                            </div>
                          ) : (
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => handleStartEdit(apartment)}
                                className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                                title="עריכת שם"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                שם
                              </button>
                              <button
                                onClick={() => handleResetPIN(apartment.number)}
                                disabled={isResetting}
                                className="inline-flex items-center gap-1.5 text-amber-600 hover:text-amber-800 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-amber-50 transition-colors disabled:opacity-50"
                                title="איפוס PIN"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                </svg>
                                PIN
                              </button>
                              <button
                                onClick={() => handleDeleteClick(apartment.id)}
                                className="inline-flex items-center gap-1.5 text-red-600 hover:text-red-800 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                                title="מחיקת דירה"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                מחק
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
          {!isLoading && apartments.length > 0 && (
            <div className="info-box mt-6">
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
                  <p className="font-semibold mb-2">מידע חשוב:</p>
                  <ul className="space-y-1.5">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                      <strong>שם</strong> - עריכת שם בעל הדירה
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                      <strong>PIN</strong> - יצירת קוד חדש (הקוד הישן יפסיק לעבוד)
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                      <strong>מחק</strong> - מחיקת דירה (גם כל ההצבעות שלה!)
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Delete Confirmation Modal */}
      {deletingId && apartmentToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" dir="rtl">
          <div className="card p-6 max-w-md w-full animate-in fade-in zoom-in duration-200">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
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
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-800 mb-2">אישור מחיקה</h3>
                <p className="text-gray-600 mb-3">
                  האם אתה בטוח שברצונך למחוק את הדירה?
                </p>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center text-white font-bold text-sm">
                      {apartmentToDelete.number}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">דירה {apartmentToDelete.number}</p>
                      <p className="text-sm text-gray-500">{apartmentToDelete.ownerName}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-red-700 text-sm">
                      פעולה זו תמחק גם את כל ההצבעות של הדירה ולא ניתן לבטלה!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 btn btn-danger py-3 disabled:opacity-50"
              >
                {isDeleting ? 'מוחק...' : 'כן, מחק'}
              </button>
              <button
                onClick={handleCancelDelete}
                disabled={isDeleting}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
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
