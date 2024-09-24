import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { marked, MarkedExtension } from 'marked';

@Component({
  selector: 'app-markdown-text',
  templateUrl: './markdown-view.component.html',
})
export class MarkdownViewComponent implements OnChanges {
  /**
   * rawMarkdown: defines the raw markdown text that can be inserted into this component.
   */
  @Input() rawMarkdown: string = '';

  public htmlText: string = '';

  constructor() {
    const renderer: MarkedExtension['renderer'] = {
      image(href: string | null, title: string | null, text: string): string {
        return `</p><p class="d-block-inline text-center markdown-paragraph">
            <img src="/assets/images/socinian/${href}" class="mt-4 img-fluid" alt="${text}" title="${title}" \>
          </span>
        </p><p class="markdown-paragraph">`;
      },
      link(href: string, title: string | null | undefined, text: string): string {
        return `<a href="${href}" target="blank">${text}</a>`;
      },
      heading(text: string, level: number, raw: string): string {
        const escapedText = text.toLowerCase().replace(/[^\w]+/g, '-');

        return `
            <h${level} id="${escapedText}}" class="markdown-heading">
              ${text}
            </h${level}>`;
      },
      paragraph(text: string) {
        return `<p class="markdown-paragraph">${text}</p>`;
      },
    };

    marked.use({ renderer });
  }

  public async ngOnChanges(changes: SimpleChanges): Promise<void> {
    if (changes['rawMarkdown']) {
      this.htmlText = await marked.parse(this.rawMarkdown);
    }
  }
}
