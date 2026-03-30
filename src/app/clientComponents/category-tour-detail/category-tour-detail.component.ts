import { ReloadService } from './../../core/services/reload.service';
import { Component, inject, signal, WritableSignal,PLATFORM_ID, Inject  } from '@angular/core';
import { IdetailedCattour } from '../../core/interfaces/icat-tour';
import { Subscription, switchMap, takeUntil } from 'rxjs';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CattourService } from '../../core/services/cattour.service';
import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ReloadableComponent } from '../reloadable/reloadable.component';
import { TranslatedPipe } from '../../core/pipes/translate.pipe';
import { Meta, Title } from '@angular/platform-browser';

@Component({
  selector: 'app-category-tour-detail',
  standalone: true,
  imports: [RouterLink,TranslatedPipe,CommonModule],
  templateUrl: './category-tour-detail.component.html',
  styleUrl: './category-tour-detail.component.css'
})
export class CategoryTourDetailComponent  extends ReloadableComponent {

  constructor(@Inject(PLATFORM_ID) private platformId: Object,ReloadService:ReloadService) {
    super(ReloadService);
  }

    DetailedCategoryTour:WritableSignal<IdetailedCattour|null>=signal(null);
    CategorySubs:WritableSignal<Subscription|null>=signal(null);
  
  
    private readonly categoryService=inject(CattourService);
    private readonly activeRouete=inject(ActivatedRoute);
     private readonly titleService=inject(Title);
     private readonly metaService = inject(Meta);

  
  
    ngOnInit(): void {
      this.LoadData();
      this.onReload(() => this.LoadData());
    }
  
    LoadData() {

      if (isPlatformBrowser(this.platformId)) {
        document.body.classList.add('category-open');
      }
    
      this.activeRouete.paramMap
        .pipe(
          switchMap(params => {
            const slug = params.get('slug') ?? '';
    
            // Fallback title (قبل ما الداتا ترجع)
            const formattedTitle = slug.replace(/-/g, ' ');
            this.titleService.setTitle(`${formattedTitle} | J&WTour Travels`);
    
            return this.categoryService.getDetaildedCategorTour(slug);
          }),
          takeUntil(this.destroy$)
        )
        .subscribe({
          next: (res: IdetailedCattour) => {
    
            this.DetailedCategoryTour.set(res);
    
            /* ===============================
               🔥 Dynamic SEO Starts Here
            =============================== */
    
            // 🔹 Title
            this.titleService.setTitle(
              `${res.titles} | Hurghada Tours | J&WTour Travels`
            );
    
            // 🔹 Remove old meta (important in SPA)
            this.metaService.removeTag("name='description'");
            this.metaService.removeTag("name='keywords'");
    
            // 🔹 Meta Description
            this.metaService.updateTag({
              name: 'description',
              content:
                res.metaDescription ||
                `Explore ${res.titles} with J&WTour Travels. Discover the best tours and excursions in Hurghada and across Egypt.`
            });
    
            // 🔹 Meta Keywords
            this.metaService.updateTag({
              name: 'keywords',
              content:
                res.metaKeyWords ||
                `${res.titles}, Hurghada tours, Egypt excursions, J&WTour Travels`
            });
    
            // 🔹 Open Graph (Social + SEO)
            this.metaService.updateTag({
              property: 'og:title',
              content: `${res.titles} | J&WTour Travels`
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
              content: 'website'
            });
    
            this.metaService.updateTag({
              property: 'og:url',
              content: `https://J&WTourtravels.com/categories/${res.slug}`
            });
    
            /* ===============================
               🔥 End Dynamic SEO
            =============================== */
          },
          error: (err: HttpErrorResponse) => {
            console.log(err.message);
          }
        });
    };
    
    // ngOnDestroy(): void {
    //   if (isPlatformBrowser(this.platformId)) {
    //     document.body.classList.remove('category-open');
    //   }
    //   if(this.CategorySubs()){
    //     this.CategorySubs()?.unsubscribe();
    //   }
    // }

}
