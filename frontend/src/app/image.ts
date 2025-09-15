import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ImageService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Fetch all images
  getImages(): Observable<any[]> {
    return this.http.get<any>(this.baseUrl).pipe(
      map(res => res.data || res)  
    );
  }

  // Upload image
  uploadImage(formData: FormData): Observable<any> {
    return this.http.post(`${this.baseUrl}/upload`, formData);
  }

  // Delete image
  deleteImage(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }

  // Download image
  downloadImage(id: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${id}`, { responseType: 'blob' });
  }
}
