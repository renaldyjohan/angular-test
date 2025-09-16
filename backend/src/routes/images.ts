import { Router, Request, Response, NextFunction } from 'express';
import { ObjectId } from 'mongodb';
import { upload } from '../services/storage';
import { getBucket, getDb } from '../services/mongo';
import { Readable } from 'stream';
import { HttpError } from '../types/errors';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Images
 *   description: Image upload, retrieval, download and deletion
 */

/**
 * @swagger
 * /images/upload:
 *   post:
 *     summary: Upload an image file
 *     tags: [Images]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: The image file to upload
 *               title:
 *                 type: string
 *                 description: Title of the image
 *               description:
 *                 type: string
 *                 description: Description of the image
 *               tags:
 *                 type: string
 *                 description: Comma-separated tags
 *           example:
 *             title: "Holiday photo"
 *             description: "Taken in Bali"
 *             tags: "travel, beach"
 *     responses:
 *       201:
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "File uploaded successfully"
 *               data:
 *                 id: "64f8b13c2f1e3c00123abc45"
 *                 filename: "photo.png"
 *                 title: "Holiday photo"
 *                 description: "Taken in Bali"
 *                 tags: ["travel", "beach"]
 *       400:
 *         description: No file uploaded
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "No file uploaded"
 */
router.post(
  '/upload',
  upload.single('file'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        const error: HttpError = new Error('No file uploaded');
        error.status = 400;
        throw error;
      }

      const { title, description, tags } = req.body;
      const bucket = getBucket();
      const readable = Readable.from(req.file.buffer);

      const uploadStream = bucket.openUploadStream(req.file.originalname, {
        contentType: req.file.mimetype,
        metadata: { originalName: req.file.originalname },
      });

      readable
        .pipe(uploadStream)
        .on('error', (err) => next(err))
        .on('finish', async () => {
          const fileId = uploadStream.id;
          await getDb()
            .collection('imageMetadata')
            .insertOne({
              fileId,
              filename: req.file!.originalname,
              contentType: req.file!.mimetype,
              size: req.file!.size,
              uploadDate: new Date(),
              title,
              description,
              tags: tags ? tags.split(',').map((t: string) => t.trim()) : [],
            });

          res.status(201).json({
            success: true,
            message: 'File uploaded successfully',
            data: {
              id: fileId,
              filename: req.file!.originalname,
              title,
              description,
              tags,
            },
          });
        });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @swagger
 * /images:
 *   get:
 *     summary: Get all images with metadata
 *     tags: [Images]
 *     responses:
 *       200:
 *         description: A list of images with metadata
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Files retrieved successfully"
 *               data:
 *                 - id: "64f8b13c2f1e3c00123abc45"
 *                   filename: "photo.png"
 *                   length: 204800
 *                   contentType: "image/png"
 *                   uploadDate: "2025-09-16T10:15:00.000Z"
 *                   title: "Holiday photo"
 *                   description: "Taken in Bali"
 *                   tags: ["travel", "beach"]
 *                 - id: "64f8b13c2f1e3c00123def67"
 *                   filename: "document.jpg"
 *                   length: 102400
 *                   contentType: "image/jpeg"
 *                   uploadDate: "2025-09-15T09:00:00.000Z"
 *                   title: "Meeting notes"
 *                   description: "Whiteboard photo"
 *                   tags: ["work", "notes"]
 */
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const files = await getDb()
      .collection('images.files')
      .aggregate([
        {
          $lookup: {
            from: 'imageMetadata',
            localField: '_id',
            foreignField: 'fileId',
            as: 'meta',
          },
        },
        { $unwind: { path: '$meta', preserveNullAndEmptyArrays: true } },
      ])
      .toArray();

    res.json({
      success: true,
      message: 'Files retrieved successfully',
      data: files.map((f) => ({
        id: f._id,
        filename: f.filename,
        length: f.length,
        contentType: f.contentType,
        uploadDate: f.uploadDate,
        title: f.meta?.title,
        description: f.meta?.description,
        tags: f.meta?.tags,
      })),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /images/{id}:
 *   get:
 *     summary: Download an image by ID
 *     tags: [Images]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the image
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Image file stream (binary data)
 *       404:
 *         description: File not found
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "File not found"
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = new ObjectId(req.params.id);
    const fileDoc = await getDb()
      .collection('images.files')
      .findOne({ _id: id });
    if (!fileDoc) {
      const error: HttpError = new Error('File not found');
      error.status = 404;
      throw error;
    }

    res.set('Content-Type', fileDoc.contentType || 'application/octet-stream');
    const downloadStream = getBucket().openDownloadStream(id);
    downloadStream.pipe(res).on('error', (err) => next(err));
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /images/{id}:
 *   delete:
 *     summary: Delete an image by ID
 *     tags: [Images]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the image
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Image deleted successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "File deleted successfully"
 *       404:
 *         description: File not found
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "File not found"
 */
router.delete(
  '/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = new ObjectId(req.params.id);
      await getBucket().delete(id);
      await getDb().collection('imageMetadata').deleteOne({ fileId: id });

      res.json({
        success: true,
        message: 'File deleted successfully',
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
