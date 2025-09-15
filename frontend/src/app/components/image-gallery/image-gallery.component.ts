import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ImageService } from '../../image';
import { ImageFile } from '../../models/image.model';
import { environment } from '../../../environments/environment';

type ToastType = 'success' | 'error';

@Component({
  selector: 'app-image-gallery',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './image-gallery.component.html',
  styleUrls: ['./image-gallery.component.scss'],
})
export class ImageGalleryComponent implements OnInit {
  images: ImageFile[] = [];
  apiUrl = environment.apiUrl;
  loading = false;
  toastMessage: string | null = null;
  toastType: ToastType = 'success';
  selectedImage: {
    src: string;
    filename: string;
    length: number;
    uploadDate: string;
    title?: string;
    description?: string;
    tags: string[];
  } | null = null;
  showUpload = false;
  selectedFile: File | null = null;
  isDragging = false;
  previewUrl: string | null = null;

  formData = { title: '', description: '', tags: '' };

  constructor(private imageService: ImageService) {}

  ngOnInit(): void {
    this.loadImages();
  }

  openUpload(): void {
    this.showUpload = true;
  }

  closeUpload(): void {
    this.showUpload = false;
    this.resetUploadState();
  }

  cancelSelectedFile(): void {
    this.selectedFile = null;
    this.previewUrl = null;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.setSelectedFile(input.files[0]);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
    if (event.dataTransfer?.files.length) {
      this.setSelectedFile(event.dataTransfer.files[0]);
    }
  }

  private setSelectedFile(file: File): void {
    this.selectedFile = file;
    this.generatePreview(file);
  }

  private generatePreview(file: File): void {
    const reader = new FileReader();
    reader.onload = () => (this.previewUrl = reader.result as string);
    reader.readAsDataURL(file);
  }

  upload(): void {
    if (!this.selectedFile) return;
    this.loading = true;

    const data = new FormData();
    data.append('file', this.selectedFile);
    data.append('title', this.formData.title.trim());
    data.append('description', this.formData.description.trim());
    data.append('tags', this.formData.tags.trim());

    this.imageService.uploadImage(data).subscribe({
      next: () => {
        this.loading = false;
        this.showToast('Upload successful!', 'success');
        this.closeUpload();
        this.loadImages();
      },
      error: () => {
        this.loading = false;
        this.showToast('Upload failed', 'error');
      },
    });
  }

  private resetUploadState(): void {
    this.selectedFile = null;
    this.previewUrl = null;
    this.formData = { title: '', description: '', tags: '' };
  }

  private showToast(message: string, type: ToastType): void {
    this.toastMessage = message;
    this.toastType = type;
    setTimeout(() => (this.toastMessage = null), 3000);
  }

  loadImages(): void {
    this.imageService.getImages().subscribe((data: ImageFile[]) => {
      this.images = data;
    });
  }

  delete(id: string): void {
    this.loading = true;
    this.imageService.deleteImage(id).subscribe({
      next: () => {
        this.images = this.images.filter((img) => img.id !== id);
        this.showToast('Image deleted 🗑️', 'success');
      },
      error: () => this.showToast('Delete failed', 'error'),
      complete: () => (this.loading = false),
    });
  }

  download(id: string, filename: string): void {
    this.imageService.downloadImage(id).subscribe((blob: Blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  openPreview(img: ImageFile): void {
    this.selectedImage = {
      src: `${this.apiUrl}/${img.id}`,
      tags: img.tags ?? [],
      ...img,
    };
  }

  closePreview(): void {
    this.selectedImage = null;
  }
}
