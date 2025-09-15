import { Component } from '@angular/core';
import { ImageGalleryComponent } from './components/image-gallery/image-gallery.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ImageGalleryComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'Angular Image Gallery';
}
