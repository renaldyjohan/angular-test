export interface ImageFile {
  id: string;
  filename: string;
  length: number;
  contentType: string;
  uploadDate: string;
  title?: string;
  description?: string;
  tags?: string[];
}

export interface ApiResponse<T> {
  success: boolean;
  code: number;
  message: string;
  data: T;
}
