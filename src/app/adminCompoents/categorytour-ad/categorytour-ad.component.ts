import { Subscription } from 'rxjs';
import { ICatTour } from '../../core/interfaces/icat-tour';
import { CattourService } from './../../core/services/cattour.service';
import { Component, inject, OnDestroy, OnInit, signal, WritableSignal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from "@angular/router";
import Swal from 'sweetalert2';
import { FormsModule } from '@angular/forms';
import { SearchPipe } from '../../core/pipes/search.pipe';


@Component({
  selector: 'app-categorytour-ad',
  standalone: true,
  imports: [RouterLink,FormsModule],
  templateUrl: './categorytour-ad.component.html',
  styleUrl: './categorytour-ad.component.css'
})
export class CategorytourAdComponent implements OnInit,OnDestroy {
  searchTerm:string='';

  private readonly catTourService=inject(CattourService);

  AllCAtegortTourList:WritableSignal<ICatTour[]>=signal([]);
  catTourSUbs:WritableSignal<Subscription|null>=signal(null);

  ngOnInit(): void {
    this.catTourSUbs.set (this.catTourService.getAllAdminCAtegorytours().subscribe({
        next:(res)=>{
          this.AllCAtegortTourList.set(res.data);

        },
        error:(err)=>{
          console.log(err);
        }
      }));
    }
    
    ngOnDestroy(): void {
      if(this.catTourSUbs()){
        this.catTourSUbs()?.unsubscribe(); // الغاء الاشتراك
      }
    }

   deleteCatTour(id: number) {
         Swal.fire({
           title: 'Are you sure?',
           text: "You won't be able to revert this!",
           icon: 'warning',
           showCancelButton: true,
           confirmButtonColor: '#DD6B55',
           cancelButtonColor: '#3085d6',
           confirmButtonText: 'Yes, delete it!'
         }).then((result) => {
           if (result.isConfirmed) {
             // هنا نعمل الحذف من API
             this.catTourService.deleteCatTour(id).subscribe({
               next: () => {
                 Swal.fire(
                   'Deleted!',
                   'Destination has been deleted.',
                   'success'
                 );
                 // لو عندك جدول أو قائمة رحلات، اعمل تحديث للقائمة
                 this.AllCAtegortTourList.set(this.AllCAtegortTourList().filter(d=>d.id!=id)); // مثال
               },
               error: () => {
                 Swal.fire(
                   'Error!',
                   'There was a problem deleting the destination.',
                   'error'
                 );
               }
             });
           }
         });
       }
}
