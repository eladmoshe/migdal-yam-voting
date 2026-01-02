import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createApartment } from '../api';
import { supabase } from '../../config/supabase';

// Mock the supabase module
vi.mock('../../config/supabase', () => ({
  supabase: {
    rpc: vi.fn(),
  },
}));

const mockRpc = vi.mocked(supabase.rpc);

// Helper to create properly typed mock responses
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createMockResponse = (data: any, error: any = null) => ({
  data,
  error: error ? { ...error, details: '', hint: '', name: 'PostgrestError' } : null,
  count: null,
  status: error ? 400 : 200,
  statusText: error ? 'Bad Request' : 'OK',
} as any); // eslint-disable-line @typescript-eslint/no-explicit-any

describe('createApartment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('successful apartment creation', () => {
    it('should create apartment and return response with PIN', async () => {
      const mockResponse = {
        apartment_id: 'apt-123',
        apartment_number: '42',
        owner_name: 'משה לוי',
        phone_number_1: null,
        owner_name_1: null,
        phone_number_2: null,
        owner_name_2: null,
        pin: '123456',
      };

      mockRpc.mockResolvedValue(createMockResponse(mockResponse));

      const result = await createApartment('42', 'משה לוי');

      expect(mockRpc).toHaveBeenCalledWith('create_apartment', {
        p_apartment_number: '42',
        p_owner_name: 'משה לוי',
        p_phone_number_1: null,
        p_owner_name_1: null,
        p_phone_number_2: null,
        p_owner_name_2: null,
      });

      expect(result).toEqual({
        success: true,
        data: {
          apartmentId: 'apt-123',
          apartmentNumber: '42',
          ownerName: 'משה לוי',
          phoneNumber1: null,
          ownerName1: null,
          phoneNumber2: null,
          ownerName2: null,
          pin: '123456',
        },
      });
    });

    it('should handle apartment numbers with letters', async () => {
      const mockResponse = {
        apartment_id: 'apt-456',
        apartment_number: '10A',
        owner_name: 'דוד כהן',
        phone_number_1: null,
        owner_name_1: null,
        phone_number_2: null,
        owner_name_2: null,
        pin: '654321',
      };

      mockRpc.mockResolvedValue(createMockResponse(mockResponse));

      const result = await createApartment('10A', 'דוד כהן');

      expect(result).toEqual({
        success: true,
        data: {
          apartmentId: 'apt-456',
          apartmentNumber: '10A',
          ownerName: 'דוד כהן',
          phoneNumber1: null,
          ownerName1: null,
          phoneNumber2: null,
          ownerName2: null,
          pin: '654321',
        },
      });
    });
  });

  describe('error handling', () => {
    it('should return error when apartment number already exists', async () => {
      mockRpc.mockResolvedValue(createMockResponse(null, {
        message: 'Apartment number already exists',
        code: '23505', // PostgreSQL unique violation
      }));

      const result = await createApartment('42', 'משה לוי');

      expect(result).toEqual({
        success: false,
        error: 'מספר דירה זה כבר קיים במערכת',
      });
    });

    it('should return error when apartment number is empty', async () => {
      mockRpc.mockResolvedValue(createMockResponse(null, {
        message: 'Apartment number is required',
        code: 'P0001', // PostgreSQL raise exception
      }));

      const result = await createApartment('', 'משה לוי');

      expect(result).toEqual({
        success: false,
        error: 'מספר דירה הוא שדה חובה',
      });
    });

    it('should return error when owner name is empty', async () => {
      mockRpc.mockResolvedValue(createMockResponse(null, {
        message: 'Owner name is required',
        code: 'P0001',
      }));

      const result = await createApartment('42', '');

      expect(result).toEqual({
        success: false,
        error: 'שם בעל הדירה הוא שדה חובה',
      });
    });

    it('should return error when user is not authenticated', async () => {
      mockRpc.mockResolvedValue(createMockResponse(null, {
        message: 'Authentication required',
        code: 'P0001',
      }));

      const result = await createApartment('42', 'משה לוי');

      expect(result).toEqual({
        success: false,
        error: 'נדרשת הזדהות כמנהל',
      });
    });

    it('should return error when user is not admin', async () => {
      mockRpc.mockResolvedValue(createMockResponse(null, {
        message: 'Admin privileges required',
        code: 'P0001',
      }));

      const result = await createApartment('42', 'משה לוי');

      expect(result).toEqual({
        success: false,
        error: 'נדרשות הרשאות מנהל',
      });
    });

    it('should return generic error for unknown errors', async () => {
      mockRpc.mockResolvedValue(createMockResponse(null, {
        message: 'Some unexpected error',
        code: 'UNKNOWN',
      }));

      const result = await createApartment('42', 'משה לוי');

      expect(result).toEqual({
        success: false,
        error: 'אירעה שגיאה ביצירת הדירה',
      });
    });

    it('should handle network errors', async () => {
      mockRpc.mockResolvedValue(createMockResponse(null, {
        message: 'Network error',
        code: 'NETWORK_ERROR',
      }));

      const result = await createApartment('42', 'משה לוי');

      expect(result).toEqual({
        success: false,
        error: 'אירעה שגיאה ביצירת הדירה',
      });
    });
  });

  describe('input validation', () => {
    it('should trim whitespace from apartment number', async () => {
      const mockResponse = {
        apartment_id: 'apt-123',
        apartment_number: '42',
        owner_name: 'משה לוי',
        phone_number_1: null,
        owner_name_1: null,
        phone_number_2: null,
        owner_name_2: null,
        pin: '123456',
      };

      mockRpc.mockResolvedValue(createMockResponse(mockResponse));

      await createApartment('  42  ', 'משה לוי');

      expect(mockRpc).toHaveBeenCalledWith('create_apartment', {
        p_apartment_number: '42',
        p_owner_name: 'משה לוי',
        p_phone_number_1: null,
        p_owner_name_1: null,
        p_phone_number_2: null,
        p_owner_name_2: null,
      });
    });

    it('should trim whitespace from owner name', async () => {
      const mockResponse = {
        apartment_id: 'apt-123',
        apartment_number: '42',
        owner_name: 'משה לוי',
        phone_number_1: null,
        owner_name_1: null,
        phone_number_2: null,
        owner_name_2: null,
        pin: '123456',
      };

      mockRpc.mockResolvedValue(createMockResponse(mockResponse));

      await createApartment('42', '  משה לוי  ');

      expect(mockRpc).toHaveBeenCalledWith('create_apartment', {
        p_apartment_number: '42',
        p_owner_name: 'משה לוי',
        p_phone_number_1: null,
        p_owner_name_1: null,
        p_phone_number_2: null,
        p_owner_name_2: null,
      });
    });
  });
});
