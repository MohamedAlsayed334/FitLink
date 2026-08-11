import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ToastService } from '../services/toast.service';
import { ApiError } from '../services/api.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private toast: ToastService) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        let status = error.status || 500;
        let message = 'Something went wrong. Please try again.';
        let errors: string[] | undefined;

        if (error.error && typeof error.error === 'object' && error.error.message) {
          message = error.error.message;
          errors = error.error.errors;
        } else if (error.error && typeof error.error === 'string' && error.error.trim()) {
          message = error.error;
        }

        if (status === 0) {
          status = 0;
          message = 'Cannot reach the server. Is the backend running?';
        }

        this.toast.error(message);
        return throwError(() => new ApiError(status, message, errors));
      }),
    );
  }
}