import { CattourService } from './../../core/services/cattour.service';
import {  ChangeDetectorRef, Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, HostListener, Inject, inject, OnDestroy, OnInit, PLATFORM_ID, signal, ViewChild, WritableSignal } from '@angular/core';
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

register();

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, TranslatedPipe, ClientFooterComponent,CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],   // ← ← المهم هنا

  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent  extends ReloadableComponent {
  
 constructor(
    ReloadService:ReloadService,
    @Inject(PLATFORM_ID) private platformId: object
  ) {
      super(ReloadService);
    }

    
  isBrowser = isPlatformBrowser(this.platformId);

  private readonly destnationservice=inject(DestnatoinService);
  private readonly TourService=inject(TourService);
  private readonly CattourService=inject(CattourService)
  private readonly router=inject(Router);
  private readonly meta=inject(Meta);
  private readonly title=inject(Title);


  AllPopularToursList:WritableSignal<ITour[]>=signal([]);  
  TourSUbs:WritableSignal<Subscription|null>=signal(null);

  PopularDestanion:WritableSignal<IDestnation[]>=signal([]);
  destnationSUbs:WritableSignal<Subscription|null>=signal(null);

  AllPopularHurghadaCat:WritableSignal<ICatTour[]>=signal([]);  
  HurghdadaCatSbss:WritableSignal<Subscription|null>=signal(null);
  ngOnInit(): void {
    this.LoadData();
    this.onReload(() => this.LoadData());
    this.LoadDataSeo();
   
   }

   LoadDataSeo(){
    this.meta.removeTag("name='description'");
    this.meta.removeTag("name='keywords'");
  
    // 🔹 Title (Brand + Location + Service)
    this.title.setTitle(
      'J&W Tour Travels | Hurghada Tours, Excursions & Egypt Travel Experiences'
    );
  
    // 🔹 Meta Description (Conversion + SEO)
    this.meta.updateTag({
      name: 'description',
      content:
        'J&W Tour Travels is a trusted travel agency in Hurghada offering unforgettable tours, excursions, desert safaris, snorkeling trips, and private transfers across Egypt. Book your perfect holiday experience today.'
    });
  
    // 🔹 Keywords (Strong but not spammy)
    this.meta.updateTag({
      name: 'keywords',
      content:
        'Hurghada tours, Egypt excursions, Red Sea activities, Hurghada travel agency, desert safari Hurghada, snorkeling trips Egypt, Egypt day tours, J&W Tour Travels'
    });
  
    // 🔹 Open Graph (Social + SEO Boost)
    this.meta.updateTag({ property: 'og:title', content: 'J&W Tour Travels | Hurghada Tours & Egypt Excursions' });
    this.meta.updateTag({ property: 'og:description', content: 'Book the best tours, excursions, and Red Sea activities in Hurghada with J&W Tour Travels. Trusted local travel experts.' });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:url', content: 'https://J&W Tourtravels.com/' });
    this.meta.updateTag({ property: 'og:image', content: 'https://J&W Tourtravels.com/assets/images/toppicktravel-removebg-preview2.png' });
   };
   LoadData() {
    this.destnationservice.getAllDestnation()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => this.PopularDestanion.set(res.data),
        error: err => console.log(err.message)
      });
  
    this.TourService.getAllTours()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => this.AllPopularToursList.set(res.data),
        error: err => console.log(err.message)
      });
  
    this.CattourService.getAllCAtegorytours()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => this.AllPopularHurghadaCat.set(res.data),
        error: err => console.log(err.message)
      });
  }
  ;
  get HurghadaTours() {
    return this.AllPopularToursList().filter(t => 
      t.destinationName?.toLowerCase() === 'hurghada'
    );
  }
  @ViewChild('swiper', { static: false }) swiperEl!: ElementRef;

  @ViewChild('heroVideo') heroVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild('aboutSection', { static: false }) aboutSection?: ElementRef<HTMLElement>;
  @ViewChild('subtitleText', { static: false }) subtitleTextRef?: ElementRef<HTMLParagraphElement>;
videoFallback = false;

  private animationInterval: any;

  private initSubtitleAnimation() {
    if (!this.subtitleTextRef?.nativeElement || !isPlatformBrowser(this.platformId)) {
      return;
    }

    const element = this.subtitleTextRef.nativeElement;
    const text = element.textContent?.trim() || '';
    
    // Clear existing content and create letter spans
    element.innerHTML = '';
    text.split('').forEach((char: string, index: number) => {
      const span = document.createElement('span');
      span.className = 'letter';
      span.textContent = char === ' ' ? '\u00A0' : char; // Non-breaking space for spaces
      span.style.animationDelay = `${index * 60}ms`; // 60ms stagger
      element.appendChild(span);
    });

    // Start continuous animation loop
    this.startLetterAnimationLoop();
  }

  private startLetterAnimationLoop() {
    if (this.animationInterval) {
      clearInterval(this.animationInterval);
    }

    this.animationInterval = setInterval(() => {
      const subtitle = this.subtitleTextRef?.nativeElement;
      if (!subtitle) return;

      // Fade out
      subtitle.classList.add('fade-out');
      
      setTimeout(() => {
        subtitle.classList.remove('fade-out');
        // Trigger reflow to restart animations
        subtitle.offsetHeight;
      }, 500);
      
    }, 7000); // Loop every 7 seconds
  }

  private observer?: IntersectionObserver;

  ngAfterViewInit(): void {
    const aboutEl = this.aboutSection?.nativeElement;
  
    if (!aboutEl) return;
  
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              aboutEl.classList.add('is-visible');
              this.observer?.disconnect();
            }
          });
        },
        {
          threshold: 0.2,
          rootMargin: '0px 0px -10% 0px'
        }
      );
  
      this.observer.observe(aboutEl);
    } else {
      // fallback للمتصفحات القديمة
      aboutEl.classList.add('is-visible');
    }
  }
  

  trips = [
    {
      image: '../../../assets/images/abo1.jpeg'
    },
    {
      image: '../../../assets/images/abo2.jpeg'
    },
    {
      image: '../../../assets/images/abo3.jpeg'
    },
    {
      image: '../../../assets/images/abo4.jpeg'
    },
    {
      image: '../../../assets/images/abo5.jpeg'
    }
  ];

  isExpanded = false;

  tripDescription: string = `Snorkeling with sea turtles in their natural habitat. 
Explore colorful coral reefs and fish. Relax on the sandy beach of Abu Dabbab. 
Perfect spot for underwater photos. Hotel pickup & drop-off. Air-conditioned transport. 
Professional guide. Snorkeling equipment. Lunch & soft drinks. Swimwear & towel. 
Sunglasses & sunscreen. Waterproof camera recommended.`;

  toggleDescription() {
    this.isExpanded = !this.isExpanded;
  }

}