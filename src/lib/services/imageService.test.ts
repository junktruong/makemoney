import { describe, it, expect } from 'vitest';
import { validateImageFile } from './imageService';

describe('imageService', () => {
  describe('validateImageFile', () => {
    it('accepts valid image types', () => {
      const mockJpeg = new File(['dummy'], 'photo.jpg', { type: 'image/jpeg' });
      const mockPng = new File(['dummy'], 'photo.png', { type: 'image/png' });
      const mockWebp = new File(['dummy'], 'photo.webp', { type: 'image/webp' });

      expect(validateImageFile(mockJpeg).valid).toBe(true);
      expect(validateImageFile(mockPng).valid).toBe(true);
      expect(validateImageFile(mockWebp).valid).toBe(true);
    });

    it('rejects invalid file formats', () => {
      const mockPdf = new File(['dummy'], 'doc.pdf', { type: 'application/pdf' });
      const mockExe = new File(['dummy'], 'app.exe', { type: 'application/x-msdownload' });

      expect(validateImageFile(mockPdf).valid).toBe(false);
      expect(validateImageFile(mockExe).valid).toBe(false);
    });

    it('rejects files exceeding size limit', () => {
      const bigBuffer = new Uint8Array(11 * 1024 * 1024); // 11MB
      const mockBig = new File([bigBuffer], 'big.jpg', { type: 'image/jpeg' });

      const result = validateImageFile(mockBig, 10 * 1024 * 1024);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('10MB');
    });
  });
});

