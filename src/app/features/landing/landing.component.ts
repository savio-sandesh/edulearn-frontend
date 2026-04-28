import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
@Component({ selector: 'app-landing', standalone: true, imports: [RouterLink],
  template: `<div class="stub"><h1>🏠 Landing Page</h1><p>Phase 3 — Coming soon</p><a routerLink="/courses" class="btn-primary">Browse Courses</a></div>`,
  styles: [`.stub{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:80vh;gap:16px;text-align:center} h1{font-size:2rem} p{color:#94a3b8}`]
})
export class LandingComponent {}
