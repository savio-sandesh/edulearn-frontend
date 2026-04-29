import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly auth    = inject(AuthService);
  private readonly router  = inject(Router);
  private readonly route   = inject(ActivatedRoute);
  private readonly fb      = inject(FormBuilder);
  private readonly toast   = inject(ToastService);

  loading      = signal(false);
  showPassword = signal(false);

  form = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  get email()    { return this.form.get('email')!; }
  get password() { return this.form.get('password')!; }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);

    this.auth.login({ email: this.email.value!, password: this.password.value! }).subscribe({
      next: () => {
        this.toast.success('Welcome back! 🎉');
        let returnUrl = this.route.snapshot.queryParams['returnUrl'];
        if (!returnUrl || returnUrl === '/') {
          const role = this.auth.userRole();
          if (role === 'INSTRUCTOR') returnUrl = '/instructor';
          else if (role === 'ADMIN') returnUrl = '/admin';
          else returnUrl = '/dashboard';
        }
        this.router.navigateByUrl(returnUrl);
      },
      error: (err) => {
        this.toast.error(err.error?.message ?? 'Invalid email or password.');
        this.loading.set(false);
      },
    });
  }
}
