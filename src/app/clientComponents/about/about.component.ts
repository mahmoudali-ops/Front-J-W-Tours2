import { Meta, Title } from '@angular/platform-browser';
import { TranslatedPipe } from './../../core/pipes/translate.pipe';
import { Component, OnInit, inject, ElementRef, AfterViewInit, ViewChild } from '@angular/core';
import { Observable, interval, map, take, BehaviorSubject } from 'rxjs';
import { CommonModule } from '@angular/common';

interface Stat {
  icon: string;
  target: number;
  text: string;
  value$: BehaviorSubject<number>;
}

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [TranslatedPipe,CommonModule],
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css']
})
export class AboutComponent implements OnInit, AfterViewInit {

  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  stats: Stat[] = [];

  @ViewChild('statsSection') statsSection!: ElementRef;

  private counted = false; // flag لمنع إعادة العد

  ngOnInit(): void {
    // Meta & Title
    this.title.setTitle(
      'About J&WTour Travels | Trusted Travel Agency in Hurghada'
    );

    this.meta.updateTag({
      name: 'description',
      content:
        'J&WTour Travels is a professional travel agency based in Hurghada, Egypt, offering tours, excursions, desert safaris, and sea trips across Egypt with trusted local guides.'
    });

    this.meta.updateTag({
      name: 'keywords',
      content:
        'J&WTour Travels, Hurghada travel agency, Egypt tours, Hurghada excursions, Red Sea tours'
    });

    // Initialize stats with BehaviorSubject = 0
    this.stats = [
      { icon: 'fas fa-users', target: 500, text: 'ABOUTSTATSCLIENTS', value$: new BehaviorSubject<number>(0) },
      { icon: 'fas fa-map-marked-alt', target: 120, text: 'ABOUTSTATSTOURS', value$: new BehaviorSubject<number>(0) },
      { icon: 'fas fa-briefcase', target: 3, text: 'ABOUTSTATSEXPERIENCE', value$: new BehaviorSubject<number>(0) },
      { icon: 'fas fa-star', target: 4.9, text: 'ABOUTSTATSRATING', value$: new BehaviorSubject<number>(0) },
    ];
  }

  ngAfterViewInit(): void {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !this.counted) {
          this.startCounting();
          this.counted = true;
        }
      });
    }, { threshold: 0.3 }); // يبدأ العد عندما 30% من السكشن يظهر

    if (this.statsSection) {
      observer.observe(this.statsSection.nativeElement);
    }
  }

  private startCounting(): void {
    const duration = 3500; // مدة العد بالمللي
    const steps = 150;     // عدد خطوات التحديث
    const stepTime = duration / steps;
    
    this.stats.forEach(stat => {
      const increment = stat.target / steps;
      interval(stepTime).pipe(
        take(steps + 1),
        map(i => +(Math.min(i * increment, stat.target).toFixed(stat.target % 1 === 0 ? 0 : 1)))
      ).subscribe(val => stat.value$.next(val));
    });
  }

}