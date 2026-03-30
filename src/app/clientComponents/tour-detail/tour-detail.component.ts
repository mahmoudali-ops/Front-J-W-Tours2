import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  Inject,
  inject,
  OnInit,
  PLATFORM_ID,
  signal,
  WritableSignal
} from '@angular/core';

import { isPlatformBrowser, CommonModule, NgClass } from "@angular/common";
import { ActivatedRoute } from '@angular/router';
import { switchMap, takeUntil } from 'rxjs';

import { TourService } from '../../core/services/tour.service';
import { EmailService } from '../../core/services/email.service';
import { ReloadService } from '../../core/services/reload.service';

import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Meta, Title } from '@angular/platform-browser';

import { IDetailedTour } from '../../core/interfaces/itour';
import { ReloadableComponent } from '../reloadable/reloadable.component';

import { SafeUrlPipe } from '../../core/pipes/safe-url.pipe';
import { TranslatedPipe } from '../../core/pipes/translate.pipe';

import { register } from 'swiper/element/bundle';

register();

@Component({
  selector: 'app-tour-detail',
  standalone: true,
  imports: [ReactiveFormsModule, NgClass, SafeUrlPipe, TranslatedPipe, CommonModule],
  templateUrl: './tour-detail.component.html',
  styleUrl: './tour-detail.component.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class TOurDetailComponent extends ReloadableComponent implements OnInit {

  private isBrowser: boolean;

  DetailedTour: WritableSignal<IDetailedTour | null> = signal(null);
  currentCarouselIndex = signal(0);

  private readonly TourService = inject(TourService);
  private readonly emailService = inject(EmailService);
  private readonly activeRoute = inject(ActivatedRoute);
  private readonly titleService = inject(Title);
  private readonly fb = inject(FormBuilder);
  private readonly toasterService = inject(ToastrService);
  private readonly metaService = inject(Meta);

  private hasAnimated = false;

  constructor(
    ReloadService: ReloadService,
    @Inject(PLATFORM_ID) private platformId: object
  ) {
    super(ReloadService);
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  BookingForm: FormGroup = this.fb.group({
    FullName: ['', [Validators.required, Validators.minLength(3)]],
    EmailAddress: ['', [Validators.required, Validators.email]],
    Message: ['', Validators.required],
    BookingDate: ['', Validators.required],
    AdultsNumber: [1, Validators.required],
    ChildernNumber: [0, Validators.required],
    HotelName: [''],
    RoomNumber: [1],
    FK_TourId: [''],
    FullTourName: ['']
  });

  ngOnInit(): void {
    this.loadData();
    this.onReload(() => this.loadData());
  }

  ngAfterViewInit(): void {

    if (!this.isBrowser) return;

    setTimeout(() => {
      const swiperEl = document.querySelector('.tourSwiper') as any;

      if (swiperEl?.swiper) {
        swiperEl.swiper.update();
        swiperEl.swiper.slideToLoop(0, 0);
        swiperEl.swiper.autoplay.start();
      } else if (swiperEl) {
        swiperEl.initialize();
      }
    }, 300);

    this.waitForDataAndAnimatePrice();
  }

  private loadData(): void {
    this.activeRoute.paramMap
      .pipe(
        switchMap(params => {
          const slug = params.get('slug') ?? '';
          this.titleService.setTitle(`${slug.replace(/-/g, ' ')} | J&T Tour`);
          return this.TourService.getDetaildedTOur(slug);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (res: IDetailedTour) => {
          this.DetailedTour.set(res);

          this.titleService.setTitle(`${res.titles} | ${res.destinationName}`);

          this.metaService.updateTag({
            name: 'description',
            content: res.metaDescription
          });
        }
      });
  }

  private waitForDataAndAnimatePrice(): void {

    if (!this.isBrowser) return;

    const interval = setInterval(() => {
      const price = this.DetailedTour()?.price;

      if (price && price > 0) {
        clearInterval(interval);
        this.startPriceAnimation(price);
      }
    }, 100);

    setTimeout(() => {
      clearInterval(interval);
      const fallbackPrice = this.DetailedTour()?.price || 0;
      this.startPriceAnimation(fallbackPrice);
    }, 5000);
  }

  private startPriceAnimation(finalValue: number): void {

    if (!this.isBrowser) return;
    if (this.hasAnimated) return;

    const header = document.querySelector('.lux-header') as HTMLElement;
    const priceEl = document.getElementById('priceValue');

    if (!header || !priceEl) return;

    const observer = new IntersectionObserver(entries => {

      if (entries[0].isIntersecting && !this.hasAnimated) {

        this.hasAnimated = true;
        header.classList.add('show');

        let current = 0;
        const duration = 2200;
        const start = performance.now();

        const animate = (time: number) => {
          const progress = Math.min((time - start) / duration, 1);
          const ease = progress * progress * (3 - 2 * progress);

          current = Math.floor(ease * finalValue);
          priceEl.innerHTML = `£ ${current}`;

          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            priceEl.innerHTML = `£ ${finalValue}`;
            priceEl.classList.add('pulse-once');
          }
        };

        requestAnimationFrame(animate);
        observer.disconnect();
      }
    });

    observer.observe(header);
  }

  FormSubmited(): void {
    this.BookingForm.patchValue({
      FK_TourId: this.DetailedTour()?.id,
      FullTourName: this.DetailedTour()?.titles
    });

    if (this.BookingForm.valid) {
      this.emailService.sendEmail(this.BookingForm.value).subscribe({
        next: () => {
          this.toasterService.success('Booking sent successfully');
          this.BookingForm.reset();
        },
        error: () => {
          this.toasterService.error('Error sending booking');
        }
      });
    }
  }

  splitHighlightText(text: string): { title: string; description: string } {
    const parts = text?.split(' - ') || [];
    return {
      title: parts[0] || '',
      description: parts[1] || ''
    };
  }
  
  splitItemText(text: string): { title: string; description: string } {
    const parts = text?.split(' - ') || [];
    return {
      title: parts[0] || '',
      description: parts[1] || ''
    };
  }
}