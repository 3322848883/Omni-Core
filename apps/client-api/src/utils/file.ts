import * as fs from 'fs';
import * as path from 'path';
import crypto from 'crypto';
import config from '@/config';

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
const AVATAR_DIR = path.join(UPLOAD_DIR, 'avatars');

export const ensureDirExists = (dirPath: string): void => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

export const saveBase64Image = async (
  base64Data: string,
  filename: string,
  subDir?: string
): Promise<string> => {
  const dir = subDir ? path.join(UPLOAD_DIR, subDir) : AVATAR_DIR;
  ensureDirExists(dir);

  const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, '');
  const imageBuffer = Buffer.from(base64Image, 'base64');

  const filePath = path.join(dir, filename);
  fs.writeFileSync(filePath, imageBuffer);

  const relativePath = subDir ? `/uploads/${subDir}/${filename}` : `/uploads/avatars/${filename}`;
  return relativePath;
};

export const deleteFile = (filePath: string): boolean => {
  try {
    const absolutePath = path.join(process.cwd(), filePath);
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
      return true;
    }
    return false;
  } catch {
    return false;
  }
};

export const generateSecureFilename = (userId: string, extension: string = 'png'): string => {
  const timestamp = Date.now();
  const random = crypto.randomBytes(8).toString('hex');
  return `${userId}_${timestamp}_${random}.${extension}`;
};

export const isValidBase64Image = (base64Data: string): boolean => {
  const base64Regex = /^data:image\/\w+;base64,/;
  if (!base64Regex.test(base64Data)) {
    return false;
  }

  try {
    const base64Image = base64Data.replace(base64Regex, '');
    const buffer = Buffer.from(base64Image, 'base64');
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    return buffer.length > 0 && buffer.length <= 5 * 1024 * 1024;
  } catch {
    return false;
  }
};

export const getImageExtension = (mimeType: string): string => {
  const mimeToExt: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
  };
  return mimeToExt[mimeType] || 'png';
};

export const getFileUrl = (relativePath: string): string => {
  const baseUrl = process.env.API_BASE_URL || `http://localhost:${config.port}`;
  return `${baseUrl}${relativePath}`;
};
