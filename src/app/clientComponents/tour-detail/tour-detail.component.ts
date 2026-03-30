import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, OnDestroy, OnInit, signal, WritableSignal } from '@angular/core';
import { IDetailedTour } from '../../core/interfaces/itour';
import { Subscription, switchMap, takeUntil } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { TourService } from '../../core/services/tour.service';
import { HttpErrorResponse } from '@angular/common/http';
import { EmailService } from '../../core/services/email.service';
import { FormBuilder, FormGroup, Validators,ReactiveFormsModule } from '@angular/forms';
import { CommonModule, NgClass } from "@angular/common";
import { ToastrService } from 'ngx-toastr';
import { SafeUrlPipe } from '../../core/pipes/safe-url.pipe';
import { DomSanitizer, Meta, Title } from '@angular/platform-browser';
import { ReloadableComponent } from '../reloadable/reloadable.component';
import { TranslatedPipe } from '../../core/pipes/translate.pipe';
import { register } from 'swiper/element/bundle';

register();

@Component({
  selector: 'app-tour-detail',
  standalone: true,
  imports: [ReactiveFormsModule, NgClass,SafeUrlPipe,TranslatedPipe,CommonModule],
  templateUrl: './tour-detail.component.html',
    schemas: [CUSTOM_ELEMENTS_SCHEMA],   // ← ← المهم هنا
  
  styleUrl: './tour-detail.component.css'
})
export class TOurDetailComponent  extends ReloadableComponent  {


  DetailedTour: WritableSignal<IDetailedTour | null> = signal(null);
  // TourSubs: WritableSignal<Subscription | null> = signal(null);
  currentCarouselIndex = signal(0);

  private readonly TourService = inject(TourService);
  private readonly emailService = inject(EmailService);
  private readonly activeRoute = inject(ActivatedRoute);
  private readonly titleService = inject(Title);
  private readonly fb = inject(FormBuilder);
  private readonly toasterService = inject(ToastrService);
  private readonly metaService = inject(Meta);


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

  private loadData(): void {
    this.activeRoute.paramMap
      .pipe(
        switchMap(params => {
          const slug = params.get('slug') ?? '';
  
          // Fallback title (لو لسه الداتا مجتش)
          const formattedTitle = slug.replace(/-/g, ' ');
          this.titleService.setTitle(`${formattedTitle} | J&T Tour | Hurghada Tours, Excursions & Egypt Travel Adventures`);
  
          return this.TourService.getDetaildedTOur(slug);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (res: IDetailedTour) => {
          this.DetailedTour.set(res);
          console.log("Detailed Tour Data:", res);  
  
          /* ===============================
             🔥 Dynamic SEO Starts Here
          =============================== */
  
          // 🔹 Title
          this.titleService.setTitle(
            `${res.titles} | ${res.destinationName} Tours | J&T Tour | Hurghada Tours, Excursions & Egypt Travel Adventures`
          );
  
          // 🔹 Clear old meta (important for SPA)
          this.metaService.removeTag("name='description'");
          this.metaService.removeTag("name='keywords'");
  
          // 🔹 Meta Description
          this.metaService.updateTag({
            name: 'description',
            content:
              res.metaDescription ||
              `Book ${res.titles} with J&T Tour | Hurghada Tours, Excursions & Egypt Travel Adventures. Enjoy unforgettable tours and excursions in ${res.destinationName}, Egypt.`
          });
  
          // 🔹 Meta Keywords
          this.metaService.updateTag({
            name: 'keywords',
            content:
              res.metaKeyWords ||
              `${res.titles}, ${res.destinationName} tours, Egypt excursions, J&T Tour | Hurghada Tours, Excursions & Egypt Travel Adventures`
          });
  
          // 🔹 Open Graph (SEO + Social)
          this.metaService.updateTag({
            property: 'og:title',
            content: `${res.titles} | J&T Tour | Hurghada Tours, Excursions & Egypt Travel Adventures`
          });
  
          this.metaService.updateTag({
            property: 'og:description',
            content: res.metaDescription
          });
  
          this.metaService.updateTag({
            property: 'og:image',
            content: res.imageCover
          });
  
          this.metaService.updateTag({
            property: 'og:type',
            content: 'article'
          });
  
          this.metaService.updateTag({
            property: 'og:url',
            content: `https://J&W Tourtravels.com/tours/${res.slug}`
          });
  
          /* ===============================
             🔥 End Dynamic SEO
          =============================== */
        },
        error: (err: any) => console.error(err)
      });
  }
  
//      ngOnDestroy(): void {
//       if(this.TourSubs()){
//         this.TourSubs()?.unsubscribe();
//       }
// }
  // دالة للمساعدة في تقسيم النص للـ highlights
  splitHighlightText(text: string): { title: string, description: string } {
    const parts = text.split(' - ');
    return {
      title: parts[0] || '',
      description: parts[1] || ''
    };
  }

  // دالة للمساعدة في تقسيم النص للـ included/not included items
  splitItemText(text: string): { title: string, description: string } {
    const parts = text.split(' - ');
    return {
      title: parts[0] || '',
      description: parts[1] || ''
    };
  }
  // دوال الـ Carousel
  nextCarouselImage() {
    const tour = this.DetailedTour();
    if (tour && tour.tourImgs.length > 0) {
      this.currentCarouselIndex.set(
        (this.currentCarouselIndex() + 1) % tour.tourImgs.length
      );
    }
  }

  prevCarouselImage() {
    const tour = this.DetailedTour();
    if (tour && tour.tourImgs.length > 0) {
      this.currentCarouselIndex.set(
        (this.currentCarouselIndex() - 1 + tour.tourImgs.length) % tour.tourImgs.length
      );
    }
  }

  goToCarouselImage(index: number) {
    this.currentCarouselIndex.set(index);
  }

  // دوال الفورم
  onSubmitBooking(formData: any) {
    console.log('Booking submitted:', formData);
    // هنا سيتم إرسال البيانات للـ API
    alert('Thank you for your booking! We will contact you soon.');
  }



  FormSubmited():void{

    this.BookingForm.patchValue({
      FK_TourId:this.DetailedTour()?.id,
      FullTourName:this.DetailedTour()?.titles
    });


    if(this.BookingForm.valid){
      console.log(this.BookingForm.value);
      this.emailService.sendEmail(this.BookingForm.value).subscribe({
        next:(res)=>{
          console.log(res);
          this.toasterService.success('Your booking request has been sent successfully.', 'Booking Sent');
          this.BookingForm.reset();
        },
        error:(err:HttpErrorResponse)=>{
          console.log(err.message);
          this.toasterService.error('There was an error sending your booking request. Please try again later.', 'Booking Error');
        }
      });
    }else{
      this.toasterService.error('Please fill all required fields correctly.', 'Form Error');
    }
  }
  getLettersWithTransformation(title: string): any[] {
    if (!title) return [];
    const letters = title.split('');
    const n = letters.length;
    const totalAngle = 60; // in degrees, you can adjust
    const radius = 100; // in pixels, adjust as needed
    const startAngle = -totalAngle / 2;
    const angleStep = n > 1 ? totalAngle / (n - 1) : 0;
    return letters.map((letter, index) => {
      const angle = startAngle + index * angleStep;
      return {
        letter: letter,
        transform: `rotate(${angle}deg) translateY(${-radius}px) rotate(${-angle}deg)`
      };
    });
  }

  ngAfterViewInit(): void {
    // 1. الكود الخاص بتشغيل السلايدر (Swiper) كما هو
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
  
    // 2. ننتظر حتى تتحميل البيانات ثم نبدأ حركة السعر (مرة واحدة فقط)
    this.waitForDataAndAnimatePrice();
  }
  
  // متغير للتأكد من أن الحركة اشتغلت مرة واحدة فقط
  private hasAnimated = false;
  
  // دالة جديدة للانتظار حتى وصول السعر من السيرفر
  private waitForDataAndAnimatePrice(): void {
    // نفحص كل 100 مللي ثانية إذا كان السعر قد وصل
    const interval = setInterval(() => {
      const price = this.DetailedTour()?.price;
      
      // إذا وجدنا سعر (أكبر من صفر) نبدأ الحركة
      if (price && price > 0) {
        clearInterval(interval); // نوقف الفحص
        this.startPriceAnimation(price); // نبدأ حركة الأرقام
      }
    }, 100);
  
    // إذا مر 5 ثواني ولم تصل البيانات، نوقف الفحص لتجنب استهلاك الموارد
    setTimeout(() => {
      clearInterval(interval);
      // نحاول مرة أخيرة باستخدام أي قيمة موجودة (أو صفر)
      const fallbackPrice = this.DetailedTour()?.price || 0;
      this.startPriceAnimation(fallbackPrice);
    }, 5000);
  }
  
  // دالة مسؤولة عن حركة ظهور السعر (مرة واحدة فقط)
  private startPriceAnimation(finalValue: number): void {
    // إذا كانت الحركة اشتغلت قبل كده، نخرج من الدالة ولا نعمل شيء
    if (this.hasAnimated) {
      return;
    }
  
    const header = document.querySelector('.lux-header') as HTMLElement;
    const priceEl = document.getElementById('priceValue');
  
    if (!header || !priceEl) return;
  
    const observer = new IntersectionObserver(entries => {
      // إذا كان العنصر ظاهر في الشاشة ولم تبدأ الحركة بعد
      if (entries[0].isIntersecting && !this.hasAnimated) {
        // نمنع الحركة من الاشتغال مرة أخرى
        this.hasAnimated = true;
        
        header.classList.add('show');
  
        let current = 0;
        const duration = 2200; // مدة الحركة
        const start = performance.now();
  
        const animate = (time: number) => {
          const progress = Math.min((time - start) / duration, 1);
          const ease = progress * progress * (3 - 2 * progress); // تأثير حركة سلس
  
          current = Math.floor(ease * finalValue);
  
          // تحديث السعر في الواجهة
          priceEl.innerHTML = `£ ${current}`;
  
          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            // التأكد من ظهور السعر النهائي
            priceEl.innerHTML = `£ ${finalValue}`;
            priceEl.classList.add('pulse-once');
          }
        };
  
        requestAnimationFrame(animate);
        observer.disconnect(); // نوقف المراقبة بعد التنفيذ
      }
    });
  
    observer.observe(header);
  }

  

}
