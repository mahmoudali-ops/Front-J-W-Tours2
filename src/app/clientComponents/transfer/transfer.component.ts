import { TranslatedPipe } from './../../core/pipes/translate.pipe';
import { Subscription, takeUntil } from 'rxjs';
import { Itransfer } from '../../core/interfaces/itransfer';
import { TransferService } from './../../core/services/transfer.service';
import { Component, inject, OnDestroy, OnInit, signal, WritableSignal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from "@angular/router";
import { TermtextPipe } from '../../core/pipes/termtext.pipe';
import { CommonModule } from '@angular/common';
import { ReloadableComponent } from '../reloadable/reloadable.component';
import { Meta, Title } from '@angular/platform-browser';

@Component({
  selector: 'app-transfer',
  standalone: true,
  imports: [RouterLink,TermtextPipe,CommonModule,TranslatedPipe],
  templateUrl: './transfer.component.html',
  styleUrl: './transfer.component.css'
})
export class TransferComponent extends ReloadableComponent  {

   private readonly TransferService=inject(TransferService);
   private readonly meta=inject(Meta);
   private readonly title=inject(Title);

    // AllTrasnferList:Itransfer[]=[];
    AllTrasnferList:WritableSignal<Itransfer[]>=signal([]);
    TrasnferSUbs:WritableSignal<Subscription|null>=signal(null);

    ngOnInit(): void {
    this.LoadData();
    this.onReload(() => this.LoadData());
    this.LoadDataSeo();

        
      }

      LoadDataSeo(){
        this.title.setTitle(
          'Hurghada Airport & Private Transfer | J&W Tour Travels'
        );
      
        this.meta.updateTag({
          name: 'description',
          content:
            'Book reliable airport and private transfer services in Hurghada with J&W Tour Travels. Safe, comfortable transfers from Hurghada Airport to hotels, resorts, and destinations across Egypt.'
        });
      
        this.meta.updateTag({
          name: 'keywords',
          content:
            'Hurghada airport transfer, Hurghada private transfer, Egypt transfer service, hotel transfer Hurghada, Red Sea airport pickup, J&W Tour Travels transfer'
        });
      };
    LoadData(){
      this.TransferService.getAllTransfers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.AllTrasnferList.set(res.data);
       
        },
        error: (err: HttpErrorResponse) => {
          console.log(err.message);
        }
      });

    };
      // ngOnDestroy(): void {
      //   if(this.TrasnferSUbs()){
      //     this.TrasnferSUbs()?.unsubscribe();
      //   }
      // }

}
