import { Component, input } from '@angular/core';

@Component({
  selector: 'app-loader',
  standalone: true,
  template: `
    @if (visible()) {
      <div class="loader-overlay" [class.inline]="inline()">
        <div class="spinner"></div>
        @if (label()) { <p class="loader-label">{{ label() }}</p> }
      </div>
    }
  `,
  styles: [`
    .loader-overlay {
      position: fixed; inset: 0; z-index: 8888;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 16px;
      background: rgba(8,8,16,0.7);
      backdrop-filter: blur(4px);
      animation: fadeIn 0.2s ease;
    }
    .loader-overlay.inline {
      position: relative; inset: unset;
      background: transparent; backdrop-filter: none;
      padding: 40px;
    }
    .spinner {
      width: 44px; height: 44px;
      border: 3px solid rgba(124,58,237,0.2);
      border-top-color: #7c3aed;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    .loader-label { color: #94a3b8; font-size: 0.875rem; }
  `]
})
export class LoaderComponent {
  visible = input<boolean>(true);
  inline  = input<boolean>(false);
  label   = input<string>('');
}
