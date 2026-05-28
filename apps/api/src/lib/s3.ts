import multer from 'multer';

// Whitelist extensions
const ALLOWED_EXTENSIONS = ['mp4', 'mov', 'pdf', 'docx'];

export const upload = multer({
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const ext = file.originalname.split('.').pop()?.toLowerCase();
    if (ext && ALLOWED_EXTENSIONS.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Định dạng tệp không được hỗ trợ! Chỉ cho phép: ${ALLOWED_EXTENSIONS.join(', ')}`));
    }
  }
});

export function generatePresignedUrl(filename: string, filetype: string) {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Error('Tệp không hợp lệ!');
  }
  
  // Return mock S3 presigned URL for preview purposes
  const s3BucketUrl = process.env.AWS_S3_BUCKET 
    ? `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com` 
    : 'https://edupath-mock-s3.s3.amazonaws.com';
  
  return {
    uploadUrl: `${s3BucketUrl}/uploads/${Date.now()}_${filename}?presigned=true`,
    fileUrl: `${s3BucketUrl}/uploads/${Date.now()}_${filename}`
  };
}
