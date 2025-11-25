import { Injectable } from '@angular/core';
import { BaseMaps } from './baseMaps';
import { ImageOptions } from '../features/map/models/zone';


export class SwitchMapService {
  imageBaseMap: ImageOptions[] = [
    {
      nom: 'google',
      print_id: 'google',
      id: 0,
      visible: false,
      urlImage: 'assets/img/google.png',
      source: new BaseMaps().getGoogleBaseMap(),
    },
    {
      nom: 'street',
      print_id: 'street',
      id: 1,
      visible: true,
      urlImage: 'assets/img/streets.png',
      source: new BaseMaps().getRasterMapTilerLayer(),
    }
  ];

  getImageBaseMap(): ImageOptions[] {
    return this.imageBaseMap;
  }
}