import { Component } from '@angular/core';

@Component({
  selector: 'fit-footer',
  standalone: false,
  template: `
    <footer class="fit-footer">
      <div class="fit-footer__top">
        <div class="fit-footer__brand">
          <a class="fit-footer__wordmark" href="/">FITL<span class="fit-footer__dot"></span>NK</a>
          <p class="fit-footer__tagline">FITLINK &middot; GYM &amp; COACH SUBSCRIPTIONS</p>
        </div>
      </div>
      <div class="fit-footer__bottom">
        <span class="fit-footer__copy">&copy; {{ year }} FitLink. All rights reserved.</span>
      </div>
    </footer>
  `,
  styles: [
    `
      .fit-footer {
        border-top: 1px solid var(--line);
        background: var(--paper-soft);
        padding: var(--space-6) clamp(1rem, 3vw, 2rem);
        margin-top: auto;
      }

      .fit-footer__top {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-5);
        max-width: 1440px;
        margin: 0 auto;
        width: 100%;
      }

      .fit-footer__wordmark {
        font-family: var(--font-display);
        font-size: var(--fs-xl);
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--ink);
        text-decoration: none;
      }

      .fit-footer__dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--signal);
        display: inline-block;
        margin: 0 2px;
      }

      .fit-footer__tagline {
        margin: var(--space-2) 0 0;
        font-family: var(--font-mono);
        font-size: var(--fs-xs);
        letter-spacing: 0.12em;
        color: var(--muted);
      }

      .fit-footer__bottom {
        max-width: 1440px;
        margin: var(--space-5) auto 0;
        width: 100%;
        padding-top: var(--space-4);
        border-top: 1px solid var(--line);
      }

      .fit-footer__copy {
        font-family: var(--font-mono);
        font-size: var(--fs-xs);
        color: var(--muted);
      }

      @media (max-width: 480px) {
        .fit-footer__top {
          flex-direction: column;
          align-items: flex-start;
        }
      }
    `,
  ],
})
export class FooterComponent {
  year = new Date().getFullYear();
}