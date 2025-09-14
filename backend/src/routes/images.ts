import { Router } from "express";
import { ObjectId } from "mongodb";
import { upload } from "../services/storage";
import { getBucket, getDb } from "../services/mongo";
import { Readable } from "stream";

const router = Router();

router.post("/upload", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      const error: any = new Error("No file uploaded");
      error.status = 400;
      throw error;
    }

    const bucket = getBucket();
    const readable = Readable.from(req.file.buffer);

    const uploadStream = bucket.openUploadStream(req.file.originalname, {
      contentType: req.file.mimetype,
      metadata: { originalName: req.file.originalname }
    });

    readable.pipe(uploadStream)
      .on("error", (err) => next(err))
      .on("finish", async () => {
        const fileId = uploadStream.id;
        await getDb().collection("imageMetadata").insertOne({
          fileId,
          filename: req.file!.originalname,
          contentType: req.file!.mimetype,
          size: req.file!.size,
          uploadDate: new Date()
        });

        res.status(201).json({
          success: true,
          message: "File uploaded successfully",
          data: {
            id: fileId,
            filename: req.file!.originalname,
            contentType: req.file!.mimetype
          }
        });
      });
  } catch (err) {
    next(err);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const files = await getDb().collection("images.files").find().toArray();
    res.json({
      success: true,
      message: "Files retrieved successfully",
      data: files.map((f) => ({
        id: f._id,
        filename: f.filename,
        length: f.length,
        contentType: f.contentType,
        uploadDate: f.uploadDate,
      }))
    });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const id = new ObjectId(req.params.id);
    const fileDoc = await getDb().collection("images.files").findOne({ _id: id });
    if (!fileDoc) {
      const error: any = new Error("File not found");
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

router.delete("/:id", async (req, res, next) => {
  try {
    const id = new ObjectId(req.params.id);
    await getBucket().delete(id);
    await getDb().collection("imageMetadata").deleteOne({ fileId: id });

    res.json({
      success: true,
      message: "File deleted successfully"
    });
  } catch (err) {
    next(err);
  }
});

export default router;
