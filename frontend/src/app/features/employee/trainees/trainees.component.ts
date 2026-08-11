import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { EmployeeService } from '../../../core/services/employee.service';

@Component({
  selector: 'fit-trainees',
  templateUrl: './trainees.component.html',
  styleUrls: ['./trainees.component.css'],
})
export class TraineesComponent implements OnInit {
  trainees: any[] = [];
  search = '';
  loading = true;
  errorMessage = '';

  constructor(
    private employee: EmployeeService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.errorMessage = '';
    this.employee.trainees(this.search.trim() || undefined).subscribe({
      next: (res) => {
        this.trainees = res.trainees || [];
        this.loading = false;
      },
      error: (err: { message?: string }) => {
        this.errorMessage = err.message || 'Failed to load trainees';
        this.loading = false;
      },
    });
  }

  onSearch(): void {
    this.load();
  }

  openProfile(trainee: any): void {
    this.router.navigate(['/employee/trainees', trainee._id]);
  }
}
