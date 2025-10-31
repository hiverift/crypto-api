import * as multer from 'multer';
import * as path from 'path';
import { Request } from 'express';

// Configure storage and file filter
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb: Function) => {
    cb(null, 'public/uploads/'); // Save to 'uploads' folder
  },
  filename: (req: Request, file: Express.Multer.File, cb: Function) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
  },
});

// File filter to allow only image types (jpg, jpeg, png)
const fileFilter = (req: Request, file: Express.Multer.File, cb: Function) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error('Only jpg, jpeg, and png files are allowed!'), false);
  }
  cb(null, true);
};

// Define multer options (this is what FilesInterceptor expects)
const multerOptions: multer.Options = {
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
};

export { multerOptions };
