import { Component, HostListener, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent {
  readonly auth = inject(AuthService);

  isScrolled   = signal(false);
  menuOpen     = signal(false);
  dropdownOpen = signal(false);

  @HostListener('window:scroll')
  onScroll() { this.isScrolled.set(window.scrollY > 20); }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent) {
    if (!(e.target as Element).closest('.user-menu')) {
      this.dropdownOpen.set(false);
    }
  }

  toggleMenu()     { this.menuOpen.update(v => !v); }
  toggleDropdown() { this.dropdownOpen.update(v => !v); }
  closeMenu()      { this.menuOpen.set(false); }

  getInitials(): string {
    const name = this.auth.currentUser()?.fullName ?? '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  }

  logout() {
    this.auth.logout();
    this.dropdownOpen.set(false);
    this.menuOpen.set(false);
  }
}
