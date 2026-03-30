import { Component, inject, OnDestroy, OnInit, signal, WritableSignal } from '@angular/core';
import { TransferService } from '../../core/services/transfer.service';
import { ItransferWithPrices } from '../../core/interfaces/itransfer';
import { Subscription, switchMap, takeUntil } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ReloadableComponent } from '../reloadable/reloadable.component';
import { ReloadService } from '../../core/services/reload.service';
import { TranslatedPipe } from '../../core/pipes/translate.pipe';
import { Meta, Title } from '@angular/platform-browser';

@Component({
  selector: 'app-transfers-detail',
  standalone: true,
  imports: [CommonModule,TranslatedPipe],
  templateUrl: './transfers-detail.component.html',
  styleUrl: './transfers-detail.component.css'
})
export class TransfersDetailComponent  extends ReloadableComponent   {

  // DetailedTransfer:ItransferWithPrices|null=null;
  DetailedTransfer = signal<ItransferWithPrices | null>(null);
  private readonly meta = inject(Meta);
  private readonly title = inject(Title);

  constructor(
    reloadService: ReloadService,
    private service: TransferService,
    private route: ActivatedRoute,
  ) {
    super(reloadService);
  }

  ngOnInit(): void {
    this.loadData();
    this.onReload(() => this.loadData());
  }

  private loadData(): void {
    this.route.paramMap
      .pipe(
        switchMap(params => {
          const slug = params.get('slug') ?? '';
  
          // 🔹 Fallback title (قبل ما الداتا ترجع)
          const formattedTitle = slug.replace(/-/g, ' ');
          this.title.setTitle(`${formattedTitle} | J&W Tour Travels`);
  
          return this.service.getDetaildedTransfers(slug);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (res: ItransferWithPrices) => {
  
          this.DetailedTransfer.set(res);
  
          /* ===============================
             🔥 Dynamic SEO Starts Here
          =============================== */
  
          // 🔹 Title
          this.title.setTitle(
            `${res.names} | ${res.destinationName} Transfers | J&W Tour Travels`
          );
  
          // 🔹 Clear old meta (SPA safe)
          this.meta.removeTag("name='description'");
          this.meta.removeTag("name='keywords'");
  
          // 🔹 Meta Description
          this.meta.updateTag({
            name: 'description',
            content:
              res.metaDescription ||
              `Book ${res.names} with J&W Tour Travels. Safe, comfortable, and reliable transfer services in ${res.destinationName}, Egypt.`
          });
  
          // 🔹 Meta Keywords
          this.meta.updateTag({
            name: 'keywords',
            content:
              res.metaKeyWords ||
              `${res.names}, ${res.destinationName} transfer, Egypt airport transfer, J&W Tour Travels`
          });
  
          // 🔹 Open Graph (Social + SEO)
          this.meta.updateTag({
            property: 'og:title',
            content: `${res.names} | J&W Tour Travels`
          });
  
          this.meta.updateTag({
            property: 'og:description',
            content: res.metaDescription
          });
  
          this.meta.updateTag({
            property: 'og:image',
            content: res.imageCover
          });
  
          this.meta.updateTag({
            property: 'og:type',
            content: 'article'
          });
  
          this.meta.updateTag({
            property: 'og:url',
            content: `https://toppickstravels.com/transfers/${res.slug}`
          });
  
          /* ===============================
             🔥 End Dynamic SEO
          =============================== */
        },
        error: err => console.error(err)
      });
  };
  


}
