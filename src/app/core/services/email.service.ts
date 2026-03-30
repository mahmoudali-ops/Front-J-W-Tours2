import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../environments/environments';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EmailService {

  private readonly httpClient=inject(HttpClient);


   getAllBookingEmails(pageIndex: number, pageSize: number): Observable<any> {
    const params = {
      pageIndex: pageIndex,
      pageSize: pageSize
    };
  
    return this.httpClient.get(`${environment.BaseUrl}/api/Email`, { params });
  }

    getEmailById(id:number):Observable<any>{
      return this.httpClient.get(`${environment.BaseUrl}/api/Email/${id}`);
    }

   sendEmail(data:object){
    return this.httpClient.post(`${environment.BaseUrl}/api/Email/sendemail`,data);
   }

   DeleterEmailById(id:number):Observable<any>{
    return this.httpClient.delete(`${environment.BaseUrl}/api/Email/delete/${id}`);
  }
   
   


}
