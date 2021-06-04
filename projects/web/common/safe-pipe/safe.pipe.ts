import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';


@Pipe({
  name: 'safe'
})
export class SafePipe implements PipeTransform {

  constructor(
    private sanitizer: DomSanitizer
  ) { }

  transform(value: string, type: 'html'|'url'|'resourceUrl'|'style'|'script') {
    switch (type) {

      case 'html':
        return this.sanitizer.bypassSecurityTrustHtml(value);

      case 'url':
        return this.sanitizer.bypassSecurityTrustUrl(value);

      case 'resourceUrl':
        return this.sanitizer.bypassSecurityTrustResourceUrl(value);

      case 'style':
        return this.sanitizer.bypassSecurityTrustStyle(value);

      case 'script':
        return this.sanitizer.bypassSecurityTrustScript(value);

      default:
        return value;
    }
  }
  
}
