import { Router, Request, Response, NextFunction } from "express";
import { ObjectId } from "mongodb";
import { upload } from "../services/storage";
import { getBucket, getDb } from "../services/mongo";
import { Readable } from "stream";
import { HttpError } from "../types/errors";

const router = Router();

router.post(
  "/upload",
  upload.single("file"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        const error: HttpError = new Error("No file uploaded");
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
        .on("error", (err) => next(err))
        .on("finish", async () => {
          const fileId = uploadStream.id;
          await getDb().collection("imageMetadata").insertOne({
            fileId,
            filename: req.file!.originalname,
            contentType: req.file!.mimetype,
            size: req.file!.size,
            uploadDate: new Date(),
            title,
            description,
            tags: tags ? tags.split(",").map((t: string) => t.trim()) : [],
          });

          res.status(201).json({
            success: true,
            message: "File uploaded successfully",
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

router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const files = await getDb()
      .collection("images.files")
      .aggregate([
        {
          $lookup: {
            from: "imageMetadata",
            localField: "_id",
            foreignField: "fileId",
            as: "meta",
          },
        },
        { $unwind: { path: "$meta", preserveNullAndEmptyArrays: true } },
      ])
      .toArray();

    res.json({
      success: true,
      message: "Files retrieved successfully",
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

router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = new ObjectId(req.params.id);
    const fileDoc = await getDb()
      .collection("images.files")
      .findOne({ _id: id });
    if (!fileDoc) {
      const error: HttpError = new Error("File not found");
      error.status = 404;
      throw error;
    }

    res.set("Content-Type", fileDoc.contentType || "application/octet-stream");
    const downloadStream = getBucket().openDownloadStream(id);
    downloadStream.pipe(res).on("error", (err) => next(err));
  } catch (err) {
    next(err);
  }
});

router.delete(
  "/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = new ObjectId(req.params.id);
      await getBucket().delete(id);
      await getDb().collection("imageMetadata").deleteOne({ fileId: id });

      res.json({
        success: true,
        message: "File deleted successfully",
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
