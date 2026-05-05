import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  template: `
    <footer class="footer">
      <div class="footer-inner">
        <div class="footer-brand">
          <a routerLink="/" class="brand-row" style="text-decoration: none;">
            <div class="brand-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.7 2.805a.75.75 0 0 1 .6 0A60.65 60.65 0 0 1 22.83 8.72a.75.75 0 0 1-.231 1.337 49.95 49.95 0 0 0-9.902 3.912l-.003.002-.34.18a.75.75 0 0 1-.707 0A50.01 50.01 0 0 0 7.5 12.174v-.224c0-.131.067-.248.172-.311a54.614 54.614 0 0 1 4.653-2.52.75.75 0 0 0-.65-1.352 56.13 56.13 0 0 0-4.78 2.589 1.858 1.858 0 0 0-.859 1.228 49.8 49.8 0 0 0-4.634-1.527.75.75 0 0 1-.231-1.337A60.653 60.653 0 0 1 11.7 2.805Z" />
                <path d="M13.06 15.473a48.45 48.45 0 0 1 7.666-3.282c.134 1.414.22 2.843.255 4.285a.75.75 0 0 1-.46.71 47.878 47.878 0 0 0-8.105 4.342.75.75 0 0 1-.832 0 47.877 47.877 0 0 0-8.104-4.342.75.75 0 0 1-.461-.71c.035-1.442.121-2.87.255-4.286A48.4 48.4 0 0 1 6 13.18v1.27a1.5 1.5 0 0 0-.14 2.508c-.09.38-.222.753-.397 1.11.452.213.901.434 1.346.661a6.73 6.73 0 0 0 .551-1.608 1.5 1.5 0 0 0 .14-2.67v-.645a48.549 48.549 0 0 1 3.44 1.668 2.25 2.25 0 0 0 2.12 0Z" />
              </svg>
            </div>
            <span class="brand-name">Edu<span>Learn</span></span>
          </a>
          <p class="brand-desc">Empowering learners worldwide with high-quality, expert-led courses across technology, design, and business.</p>
        </div>
        <div class="footer-links">
          <div class="link-group">
            <h4>Platform</h4>
            <a routerLink="/courses">Browse Courses</a>
            <a routerLink="/register">Become a Student</a>
            <a routerLink="/register">Become an Instructor</a>
          </div>
          <div class="link-group">
            <h4>Account</h4>
            <a routerLink="/login">Sign In</a>
            <a routerLink="/dashboard">Dashboard</a>
            <a routerLink="/profile">Profile</a>
          </div>
          <div class="link-group">
            <h4>Support</h4>
            <a href="#">Help Center</a>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
          </div>
        </div>
      </div>
      <div class="footer-bottom">
        <p>© {{ year }} EduLearn. All rights reserved.</p>
        <p class="built">Built with Angular 21 &amp; .NET</p>
      </div>
    </footer>
  `,
  styles: [`
    .footer {
      background: #0c0c1a; border-top: 1px solid rgba(255,255,255,0.07);
      padding: 56px 24px 24px;
    }
    .footer-inner {
      max-width: 1200px; margin: 0 auto;
      display: grid; grid-template-columns: 1.5fr 2fr; gap: 64px;
      @media (max-width: 768px) { grid-template-columns: 1fr; gap: 40px; }
    }
    .brand-row { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
    .brand-icon {
      width: 32px; height: 32px; border-radius: 8px;
      background: linear-gradient(135deg,#7c3aed,#5b21b6);
      display: flex; align-items: center; justify-content: center;
      svg { width: 16px; height: 16px; color: #fff; }
    }
    .brand-name {
      font-family: 'Plus Jakarta Sans',sans-serif; font-weight: 800; font-size: 1.4rem; letter-spacing: -0.02em; color: #f8fafc;
      span { color: #a78bfa; }
    }
    .brand-desc { font-size: 0.875rem; color: #64748b; line-height: 1.7; max-width: 280px; }
    .footer-links { display: grid; grid-template-columns: repeat(3,1fr); gap: 32px;
      @media (max-width: 480px) { grid-template-columns: repeat(2,1fr); } }
    .link-group {
      display: flex; flex-direction: column; gap: 10px;
      h4 { font-size: 0.78rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px; }
      a  { font-size: 0.875rem; color: #94a3b8; transition: color 0.2s;
           &:hover { color: #e2e8f0; } }
    }
    .footer-bottom {
      max-width: 1200px; margin: 40px auto 0; padding-top: 20px;
      border-top: 1px solid rgba(255,255,255,0.05);
      display: flex; justify-content: space-between; align-items: center; gap: 12px;
      flex-wrap: wrap;
      p { font-size: 0.8rem; color: #475569; }
      .built { color: #334155; }
    }
  `]
})
export class FooterComponent {
  readonly year = new Date().getFullYear();
}
