/**
 * Test phone number formatting for WhatsApp
 * Israeli local format -> International format
 */

describe('Phone number formatting for WhatsApp', () => {
  // This is the logic from PINDisplayModal.handleWhatsAppShare
  function formatPhoneForWhatsApp(phoneNumber: string): string {
    let cleanPhone = phoneNumber.replace(/\D/g, '');

    // Convert Israeli local format to international format
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '972' + cleanPhone.substring(1);
    } else if (!cleanPhone.startsWith('972')) {
      cleanPhone = '972' + cleanPhone;
    }

    return cleanPhone;
  }

  it('should convert local format with leading 0', () => {
    expect(formatPhoneForWhatsApp('0547744004')).toBe('972547744004');
  });

  it('should handle local format with dashes', () => {
    expect(formatPhoneForWhatsApp('054-7744004')).toBe('972547744004');
  });

  it('should handle local format with spaces', () => {
    expect(formatPhoneForWhatsApp('054 774 4004')).toBe('972547744004');
  });

  it('should keep international format as is', () => {
    expect(formatPhoneForWhatsApp('972547744004')).toBe('972547744004');
  });

  it('should handle international format with +', () => {
    expect(formatPhoneForWhatsApp('+972547744004')).toBe('972547744004');
  });

  it('should handle number without leading 0 (add 972)', () => {
    expect(formatPhoneForWhatsApp('547744004')).toBe('972547744004');
  });

  it('should handle mixed formatting', () => {
    expect(formatPhoneForWhatsApp('+972-54-7744004')).toBe('972547744004');
  });
});
