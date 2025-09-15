import { ObjectId } from 'mongodb';

export interface ImageFile {
  _id: ObjectId;
  filename: string;
  length: number;
  contentType?: string;
  uploadDate: Date;
}

export interface ImageMetadata {
  _id?: ObjectId;
  fileId: ObjectId;
  filename: string;
  contentType: string;
  size: number;
  uploadDate: Date;
  title?: string;
  description?: string;
  tags: string[];
}

export interface ImageWithMetadata extends ImageFile {
  meta?: ImageMetadata;
}
