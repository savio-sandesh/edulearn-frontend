import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  private readonly authSvc = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly user = this.authSvc.currentUser;
  
  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  
  avatarFile: File | null = null;
  avatarPreview = signal<string | null>(null);

  updatingProfile = signal(false);
  updatingPassword = signal(false);

  ngOnInit(): void {
    const u = this.user();
    this.profileForm = this.fb.group({
      fullName: [u?.fullName ?? '', Validators.required],
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.avatarFile = file;
      const reader = new FileReader();
      reader.onload = (e) => this.avatarPreview.set(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  }

  saveProfile(): void {
    if (this.profileForm.invalid) return;
    
    this.updatingProfile.set(true);
    const { fullName } = this.profileForm.value;
    
    this.authSvc.updateProfile(fullName, this.avatarFile ?? undefined).subscribe({
      next: () => {
        this.toast.success('Profile updated successfully!');
        this.updatingProfile.set(false);
      },
      error: () => {
        this.toast.error('Failed to update profile.');
        this.updatingProfile.set(false);
      }
    });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) return;
    
    this.updatingPassword.set(true);
    this.authSvc.changePassword(this.passwordForm.value).subscribe({
      next: () => {
        this.toast.success('Password changed successfully!');
        this.passwordForm.reset();
        this.updatingPassword.set(false);
      },
      error: (err) => {
        this.toast.error(err.error?.message ?? 'Failed to change password.');
        this.updatingPassword.set(false);
      }
    });
  }

  logout(): void {
    this.authSvc.logout();
  }
}
