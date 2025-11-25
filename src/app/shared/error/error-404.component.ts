import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SharedModule } from '../shared.module';

@Component({
  selector: 'app-error-404',
  standalone: true,
  imports: [RouterLink, SharedModule],
  template: `
    <div
      class="bg-gradient-to-br from-gray-100 to-gray-200 min-h-screen flex items-center justify-center px-4"
    >
      <div class="text-center max-w-md">
        <h1 class="text-8xl font-extrabold text-gray-800 tracking-wide">
          {{ 'page404.title' | translate }}
        </h1>
        <p class="text-2xl font-semibold text-gray-700 mt-4">
          {{ 'page404.subtitle' | translate }}
        </p>
        <p class="text-gray-600 mt-2 mb-6">
          {{ 'page404.description' | translate }}
        </p>
        <a
          routerLink="/"
          class="inline-block px-6 py-3 bg-primary text-white rounded-full shadow-md hover:bg-primary/90 transition duration-300"
        >
          {{ 'page404.button' | translate }}
        </a>
      </div>
    </div>
  `,
})
export class Error404Component {}
