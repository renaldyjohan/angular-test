import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImageService } from '../../image';
import { ImageFile } from '../../models/image.model';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-image-gallery',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './image-gallery.component.html',
  styleUrls: ['./image-gallery.component.scss'],
})
export class ImageGalleryComponent implements OnInit {
  images: ImageFile[] = [];
  selectedFile?: File;
  apiUrl = environment.apiUrl;
  loading = false;
  toastMessage: string | null = null;
  toastType: 'success' | 'error' = 'success';
  selectedImage: { src: string; filename: string } | null = null;

  private showToast(message: string, type: 'success' | 'error' = 'success') {
    this.toastMessage = message;
    this.toastType = type;
    setTimeout(() => (this.toastMessage = null), 3000); 
  }

  constructor(private imageService: ImageService) {}

  ngOnInit(): void {
    this.loadImages();
  }

  loadImages() {
    this.imageService.getImages().subscribe((data) => {
      this.images = data;
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  upload() {
    if (!this.selectedFile) return;

    const formData = new FormData();
    formData.append('file', this.selectedFile);

    this.loading = true;
    this.imageService.uploadImage(formData).subscribe({
      next: () => {
        this.showToast('Image uploaded successfully', 'success');
        this.loadImages();
        this.selectedFile = undefined;
      },
      error: () => this.showToast('Upload failed', 'error'),
      complete: () => (this.loading = false),
    });
  }

  delete(id: string) {
    this.loading = true;
    this.imageService.deleteImage(id).subscribe({
      next: () => {
        this.showToast('Image deleted 🗑️', 'success');
        this.images = this.images.filter((img) => img.id !== id);
      },
      error: () => this.showToast('Delete failed', 'error'),
      complete: () => (this.loading = false),
    });
  }

  download(id: string, filename: string) {
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
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  openPreview(img: any) {
    this.selectedImage = {
      src: this.apiUrl + '/' + img.id,
      filename: img.filename,
    };
  }

  closePreview() {
    this.selectedImage = null;
  }
}
