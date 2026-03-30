import { CattourService } from './../../core/services/cattour.service';
import { ChangeDetectorRef, Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, HostListener, Inject, inject, OnDestroy, OnInit, PLATFORM_ID, signal, ViewChild, WritableSignal, AfterViewInit } from '@angular/core';
import { register } from 'swiper/element/bundle';
import { Router, RouterLink } from "@angular/router";
import { DestnatoinService } from '../../core/services/destnatoin.service';
import { IDestnation } from '../../core/interfaces/idestnation';
import { Subscription, takeUntil } from 'rxjs';
import { TourService } from '../../core/services/tour.service';
import { ITour } from '../../core/interfaces/itour';
import { HttpErrorResponse } from '@angular/common/http';
import { ICatTour } from '../../core/interfaces/icat-tour';
import { TermtextPipe } from '../../core/pipes/termtext.pipe';
import { CommonModule, isPlatformBrowser, NgClass } from '@angular/common';
import { ClientFooterComponent } from "../client-footer/client-footer.component";
import { ReloadableComponent } from '../reloadable/reloadable.component';
import { ReloadService } from '../../core/services/reload.service';
import { TranslatedPipe } from '../../core/pipes/translate.pipe';
import { Meta, Title } from '@angular/platform-browser';
import { SwiperCardsDirective } from './swiper-cards.directive';

register();

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, TranslatedPipe, ClientFooterComponent, CommonModule, SwiperCardsDirective], // أضف الـ directive هنا
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent extends ReloadableComponent implements OnDestroy, AfterViewInit { // أضف AfterViewInit

  isBrowser: boolean;

  private readonly destnationservice = inject(DestnatoinService);
  private readonly TourService = inject(TourService);
  private readonly CattourService = inject(CattourService);
  private readonly router = inject(Router);
  private readonly meta = inject(Meta);
  private readonly title = inject(Title);
  private readonly cdr = inject(ChangeDetectorRef); // أضف ChangeDetectorRef

  AllPopularToursList: WritableSignal<ITour[]> = signal([]);
  PopularDestanion: WritableSignal<IDestnation[]> = signal([]);
  AllPopularHurghadaCat: WritableSignal<ICatTour[]> = signal([]);

  private observer?: IntersectionObserver;
  private swiperInitialized = false; // متغير لتتبع تهيئة الـ swiper

  @ViewChild('aboutSection', { static: false }) aboutSection?: ElementRef<HTMLElement>;
  @ViewChild('subtitleText', { static: false }) subtitleTextRef?: ElementRef<HTMLParagraphElement>;
  @ViewChild('swiperContainer', { static: false }) swiperContainer?: ElementRef<any>; // إضافة ViewChild للـ swiper
  
  private animationInterval: any;

  constructor(ReloadService: ReloadService, @Inject(PLATFORM_ID) private platformId: object) {
    super(ReloadService);
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    this.LoadData();
    this.onReload(() => this.LoadData());
    this.LoadDataSeo();
  }

  LoadDataSeo() {
    this.meta.removeTag("name='description'");
    this.meta.removeTag("name='keywords'");

    this.title.setTitle('J&W Tour Travels | Hurghada Tours, Excursions & Egypt Travel Experiences');

    this.meta.updateTag({
      name: 'description',
      content: 'J&W Tour Travels is a trusted travel agency in Hurghada offering unforgettable tours, excursions, desert safaris, snorkeling trips, and private transfers across Egypt.'
    });

    this.meta.updateTag({
      name: 'keywords',
      content: 'Hurghada tours, Egypt excursions, Red Sea activities, Hurghada travel agency, desert safari Hurghada, snorkeling trips Egypt, Egypt day tours, J&W Tour Travels'
    });

    this.meta.updateTag({ property: 'og:title', content: 'J&W Tour Travels | Hurghada Tours & Egypt Excursions' });
    this.meta.updateTag({ property: 'og:description', content: 'Book the best tours, excursions, and Red Sea activities in Hurghada with J&W Tour Travels.' });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:url', content: 'https://J&W Tourtravels.com/' });
    this.meta.updateTag({ property: 'og:image', content: 'https://J&W Tourtravels.com/assets/images/toppicktravel-removebg-preview2.png' });
  }

  LoadData() {
    this.destnationservice.getAllDestnation()
      .pipe(takeUntil(this.destroy$))
      .subscribe({ 
        next: res => {
          this.PopularDestanion.set(res.data);
          // بعد تحميل البيانات، تأكد من تحديث الـ swiper
          this.reinitSwiperAfterDataLoad();
        }, 
        error: err => console.log(err.message) 
      });

    this.TourService.getAllTours()
      .pipe(takeUntil(this.destroy$))
      .subscribe({ 
        next: res => {
          this.AllPopularToursList.set(res.data);
          this.reinitSwiperAfterDataLoad();
        }, 
        error: err => console.log(err.message) 
      });

    this.CattourService.getAllCAtegorytours()
      .pipe(takeUntil(this.destroy$))
      .subscribe({ 
        next: res => {
          this.AllPopularHurghadaCat.set(res.data);
          this.reinitSwiperAfterDataLoad();
        }, 
        error: err => console.log(err.message) 
      });
  }

  // دالة مساعدة لإعادة تهيئة الـ swiper بعد تحميل البيانات
  private reinitSwiperAfterDataLoad() {
    if (!this.isBrowser) return;
    
    // تأكد أن جميع البيانات قد تم تحميلها
    if (this.AllPopularHurghadaCat().length > 0 && !this.swiperInitialized) {
      setTimeout(() => {
        this.initSwiper();
        this.swiperInitialized = true;
      }, 100);
    }
  }

  // دالة تهيئة الـ swiper يدوياً كحل احتياطي
  private initSwiper() {
    if (!this.swiperContainer?.nativeElement) return;
    
    const swiperEl = this.swiperContainer.nativeElement;
    
    // تأكد من وجود الـ slides
    if (swiperEl.children.length === 0) return;
    
    // إذا كان الـ swiper مهيأ بالفعل، قم بتحديثه
    if (swiperEl.swiper) {
      swiperEl.swiper.update();
      swiperEl.swiper.updateSlides();
      return;
    }
    
    // خيارات الـ swiper
    Object.assign(swiperEl, {
      effect: 'cards',
      grabCursor: true,
      loop: true,
      speed: 1200,
      autoplay: {
        delay: 3000,
        disableOnInteraction: false,
      },
      touchRatio: 1.2,
      cardsEffect: {
        rotate: 0,
        perSlideOffset: 18,
        slideShadows: false,
      },
      breakpoints: {
        0: { width: 280, height: 380 },
        576: { width: 380, height: 430 },
        768: { width: 460, height: 500 },
        992: { width: 520, height: 520 },
      },
    });
    
    // تهيئة الـ swiper
    swiperEl.initialize();
  }

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;

    // تهيئة تأثير about section
    const aboutEl = this.aboutSection?.nativeElement;
    if (aboutEl) {
      if ('IntersectionObserver' in window) {
        this.observer = new IntersectionObserver(
          (entries) => {
            entries.forEach(entry => {
              if (entry.isIntersecting) {
                aboutEl.classList.add('is-visible');
                this.observer?.disconnect();
              }
            });
          },
          { threshold: 0.2, rootMargin: '0px 0px -10% 0px' }
        );
        this.observer.observe(aboutEl);
      } else {
        aboutEl.classList.add('is-visible');
      }
    }

    // تهيئة الـ subtitle animation
    this.initSubtitleAnimation();

    // إذا كانت البيانات محملة مسبقاً، قم بتهيئة الـ swiper
    if (this.AllPopularHurghadaCat().length > 0) {
      setTimeout(() => {
        this.initSwiper();
        this.swiperInitialized = true;
      }, 100);
    }
  }

  private initSubtitleAnimation() {
    if (!this.subtitleTextRef?.nativeElement || !this.isBrowser) return;

    const element = this.subtitleTextRef.nativeElement;
    const text = element.textContent?.trim() || '';
    
    element.innerHTML = '';
    text.split('').forEach((char, index) => {
      const span = document.createElement('span');
      span.className = 'letter';
      span.textContent = char === ' ' ? '\u00A0' : char;
      span.style.animationDelay = `${index * 60}ms`;
      element.appendChild(span);
    });

    this.startLetterAnimationLoop();
  }

  private startLetterAnimationLoop() {
    if (!this.isBrowser) return;

    if (this.animationInterval) clearInterval(this.animationInterval);

    this.animationInterval = setInterval(() => {
      const subtitle = this.subtitleTextRef?.nativeElement;
      if (!subtitle) return;

      subtitle.classList.add('fade-out');

      setTimeout(() => {
        subtitle.classList.remove('fade-out');
        subtitle.offsetHeight; // reflow
      }, 500);

    }, 7000);
  }

  // داخل HomeComponent أو أي component اللي فيه trip description
  isExpanded = false;

  tripDescription: string = `Snorkeling with sea turtles in their natural habitat. 
Explore colorful coral reefs and fish. Relax on the sandy beach of Abu Dabbab. 
Perfect spot for underwater photos. Hotel pickup & drop-off. Air-conditioned transport. 
Professional guide. Snorkeling equipment. Lunch & soft drinks. Swimwear & towel. 
Sunglasses & sunscreen. Waterproof camera recommended.`;

  toggleDescription() {
    this.isExpanded = !this.isExpanded;
  }

  videoFallback = false;


}