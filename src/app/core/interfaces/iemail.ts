export interface IEmail {
    id: number
    fullName: string
    emailAddress: string
    message: string
    createdAt: string
    bookingDate: string
    fK_TourId: number
    fullTourName: string
    childernNumber:number
    adultNumber:number
    hotelName:string
    roomNumber:number
  }
  