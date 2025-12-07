// Директива для подсветки элементов при наведении
import { Directive, ElementRef, HostListener, Input } from '@angular/core';

@Directive({
  selector: '[appHighlight]',
  standalone: true
})
export class HighlightDirective {
  @Input() appHighlight: string = 'yellow';
  @Input() highlightOpacity: string = '0.3';

  constructor(private el: ElementRef) { }

  @HostListener('mouseenter') onMouseEnter() {
    this.highlight(this.appHighlight, this.highlightOpacity);
  }

  @HostListener('mouseleave') onMouseLeave() {
    this.highlight('', '1');
  }

  private highlight(color: string, opacity: string) {
    if (color) {
      this.el.nativeElement.style.backgroundColor = color;
      this.el.nativeElement.style.opacity = opacity;
      this.el.nativeElement.style.transition = 'all 0.3s ease';
    } else {
      this.el.nativeElement.style.backgroundColor = '';
      this.el.nativeElement.style.opacity = '1';
    }
  }
}
