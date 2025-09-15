import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../environments/environment';
import { ApiResponse, ImageFile } from './models/image.model';

@Injectable({
  providedIn: 'root',
})
export class ImageService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getImages(): Observable<ImageFile[]> {
    return this.http.get<ApiResponse<ImageFile[]>>(this.baseUrl).pipe(map((res) => res.data));
  }

  uploadImage(formData: FormData): Observable<ApiResponse<ImageFile>> {
    return this.http.post<ApiResponse<ImageFile>>(`${this.baseUrl}/upload`, formData);
  }

  deleteImage(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.baseUrl}/${id}`);
  }

  downloadImage(id: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${id}`, { responseType: 'blob' });
  }
}
