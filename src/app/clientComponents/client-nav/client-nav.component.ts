import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LanguageService } from '../../core/services/language.service';
import { TranslatedPipe } from '../../core/pipes/translate.pipe';
import { TranslationService } from '../../core/services/translation.service';

@Component({
  selector: 'app-client-nav',
  standalone: true,
  imports: [RouterLink,RouterLinkActive,TranslatedPipe],
  templateUrl: './client-nav.component.html',
  styleUrl: './client-nav.component.css'
})
export class ClientNavComponent implements OnInit {
  isBrowser = typeof window !== 'undefined';

  isScrolled = false;
  isOffcanvasOpen = false;
  activeDropdown: string | null = null;

  @ViewChild('offcanvasPanel') offcanvasPanel?: ElementRef<HTMLElement>;
  @ViewChild('offcanvasCloseBtn') offcanvasCloseBtn?: ElementRef<HTMLButtonElement>;

  private lastActiveEl: HTMLElement | null = null;
  private scrollY = 0;

  constructor(
    private langService: LanguageService,
    private translationService: TranslationService
  ) {}

  ngOnInit(): void {
    this.onWindowScroll();
  }

  // Scroll
  @HostListener('window:scroll')
  onWindowScroll(): void {
    if (!this.isBrowser) return;

    const scrollPosition =
      window.pageYOffset || document.documentElement.scrollTop || 0;

    this.isScrolled = scrollPosition > 50;
  }

  // Toggle Offcanvas
  toggleOffcanvas(): void {
    this.isOffcanvasOpen = !this.isOffcanvasOpen;

    if (this.isOffcanvasOpen) {
      this.openOffcanvasSideEffects();
    } else {
      this.closeOffcanvasSideEffects();
      this.activeDropdown = null;
    }
  }

  closeOffcanvas(): void {
    this.isOffcanvasOpen = false;
    this.closeOffcanvasSideEffects();
    this.activeDropdown = null;
  }

  private openOffcanvasSideEffects(): void {
    if (!this.isBrowser) return;

    this.lastActiveEl = document.activeElement as HTMLElement | null;
    this.scrollY = window.scrollY || document.documentElement.scrollTop || 0;

    // iOS-friendly scroll lock (avoid layout thrash / freezing)
    document.body.style.position = 'fixed';
    document.body.style.top = `-${this.scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    queueMicrotask(() => {
      this.offcanvasCloseBtn?.nativeElement?.focus?.();
    });
  }

  private closeOffcanvasSideEffects(): void {
    if (!this.isBrowser) return;

    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.width = '';
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';

    window.scrollTo(0, this.scrollY);
    this.lastActiveEl?.focus?.();
    this.lastActiveEl = null;
  }

  // Dropdown
  toggleDropdown(event: Event, dropdownName: string): void {
    event.preventDefault();
    event.stopPropagation();

    this.activeDropdown =
      this.activeDropdown === dropdownName ? null : dropdownName;
  }

  // ESC
  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.isOffcanvasOpen) {
      this.closeOffcanvas();
    }
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (!this.isOffcanvasOpen) return;
    if (event.key !== 'Tab') return;

    const root = this.offcanvasPanel?.nativeElement;
    if (!root) return;

    const focusables = Array.from(
      root.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => !el.hasAttribute('disabled') && el.tabIndex !== -1 && el.offsetParent !== null);

    if (focusables.length === 0) {
      event.preventDefault();
      return;
    }

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement as HTMLElement | null;

    if (event.shiftKey) {
      if (!active || active === first || !root.contains(active)) {
        event.preventDefault();
        last.focus();
      }
    } else {
      if (!active || active === last || !root.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    }
  }

  // Language
  changeLang(lang: 'en' | 'de' | 'nl'|'ro'|'fr'): void {
    this.langService.setLanguage(lang);
    this.translationService.setLang(lang);
  }
}