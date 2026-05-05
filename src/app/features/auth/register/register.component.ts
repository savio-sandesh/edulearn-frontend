import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { UserRole } from '../../../core/models';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  private readonly auth   = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb     = inject(FormBuilder);
  private readonly toast  = inject(ToastService);

  loading      = signal(false);
  showPassword = signal(false);

  form = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8), this.passwordStrength]],
    role:     ['STUDENT' as UserRole, Validators.required],
  });

  get fullName() { return this.form.get('fullName')!; }
  get email()    { return this.form.get('email')!; }
  get password() { return this.form.get('password')!; }
  get role()     { return this.form.get('role')!; }

  private passwordStrength(ctrl: AbstractControl): ValidationErrors | null {
    const v = ctrl.value as string;
    if (!v) return null;
    const hasUpper = /[A-Z]/.test(v);
    const hasDigit = /\d/.test(v);
    return hasUpper && hasDigit ? null : { strength: true };
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);

    this.auth.register({
      fullName: this.fullName.value!,
      email:    this.email.value!,
      password: this.password.value!,
      role:     this.role.value as UserRole,
    }).subscribe({
      next: () => {
        // Auto-login after register
        this.auth.login({ email: this.email.value!, password: this.password.value! }).subscribe({
          next: () => {
            this.toast.success('Account created! Welcome to EduLearn 🎉');
            let returnUrl = '/dashboard';
            const role = this.auth.userRole();
            if (role === 'INSTRUCTOR') returnUrl = '/instructor';
            else if (role === 'ADMIN') returnUrl = '/admin';
            
            this.router.navigateByUrl(returnUrl).then(navigated => {
               if(!navigated) this.loading.set(false);
            });
          },
          error: () => {
            this.toast.success('Account created! Please sign in.');
            this.router.navigate(['/login']).then(navigated => {
               if(!navigated) this.loading.set(false);
            });
          },
        });
      },
      error: (err) => {
        this.toast.error(err.error?.message ?? 'Registration failed. Please try again.');
        this.loading.set(false);
      },
    });
  }
}
