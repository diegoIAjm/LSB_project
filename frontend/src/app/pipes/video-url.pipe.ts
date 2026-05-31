// src/app/pipes/video-url.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'videoUrl',
  standalone: true
})
export class VideoUrlPipe implements PipeTransform {
  transform(value: string): string {
    if (!value) return '';
    if (value.startsWith('http')) return value;
    if (value.startsWith('/')) return `http://127.0.0.1:8000${value}`;
    return `http://127.0.0.1:8000/${value}`;
  }
}