import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function passwordMatchValidator(matchingControlName: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const group = control.parent;
    if (!group) {
      return null;
    }
    const other = group.get(matchingControlName);
    if (!other || !control.value || !other.value) {
      return null;
    }
    return control.value === other.value ? null : { passwordMismatch: true };
  };
}