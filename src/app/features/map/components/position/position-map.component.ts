import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {
  Map,
  NavigationControl,
  Marker,
  AttributionControl,
  FullscreenControl,
} from 'maplibre-gl';
import { environment } from '../../../../../environment/environment';
@Component({
  selector: 'app-position-map',
  standalone: true,
  imports: [],
  templateUrl: `./position-map.component.html`,
  styleUrls: ['./position-map.component.scss'],
})
export class PositionMapComponent implements OnInit, AfterViewInit, OnDestroy {
  // ========= Propriétés liées à la carte =========
  public map: Map | undefined;
  public marker: Marker | undefined;
  private readonly MAPTILER_KEY = environment.maptilerKey;
  public baseMapView: Map | undefined;

  // ========= Coordonnées de la souris =========
  public mousseCoordinates: { x: number; y: number; toText: () => string } = {
    x: 0,
    y: 0,
    toText: function () {
      if (this.x != null && this.y != null) {
        return this.x.toFixed(6) + ',' + this.y.toFixed(6);
      }
      return '';
    },
  };

  // ========= Attribution =========
  public attributionControl = new AttributionControl({
    compact: false,
    customAttribution: this.mousseCoordinates.toText(),
  });

  // ========= Entrées et références de la vue =========
  @Input() public markerCoords: { lat: number; lng: number } | null = null;
  @ViewChild('map_position') private mapContainer!: ElementRef<HTMLElement>;
  @ViewChild('coordinates') private coordinates!: ElementRef<HTMLPreElement>;

  // ========= Variables supplémentaires =========
  public basemapChange!: string;
  public sharedValue!: string;

  constructor() {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['markerCoords'] && this.map) {
      this.updateMapMarker();
    }
  }

  ngAfterViewInit() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          this.initializeMap(longitude, latitude);
        },
        (error) => {
          console.error('Erreur de géolocalisation :', error);
          this.initializeMap(139.753, 35.6844);
        }
      );
    } else {
      this.initializeMap(139.753, 35.6844);
    }
  }

  ngOnInit(): void {}

  ngOnDestroy() {
    this.map?.remove();
    this.marker?.remove();
  }

  private initializeMap(lng: number, lat: number) {
    this.map = new Map({
      container: this.mapContainer.nativeElement,
      style: `https://api.maptiler.com/maps/openstreetmap/style.json?key=${this.MAPTILER_KEY}`,
      center: [lng, lat],
      zoom: 2,
      attributionControl: false,
    });

    this.map.on('load', () => {
      const layers = this.map?.getStyle().layers;
      let labelLayerId;

      if (layers) {
        for (let i = 0; i < layers.length; i++) {
          const layer = layers[i];
          if (
            layer.type === 'symbol' &&
            layer.layout &&
            'text-field' in layer.layout
          ) {
            labelLayerId = layer.id;
            break;
          }
        }
      }
    });

    this.map?.addControl(new NavigationControl({}), 'top-right');
    this.map?.addControl(new FullscreenControl());

    if (this.markerCoords) {
      this.updateMapMarker();
    }
  }

  private updateMapMarker() {
    if (this.map && this.markerCoords) {
      if (this.marker) {
        this.marker.setLngLat([this.markerCoords.lng, this.markerCoords.lat]);
      } else {
        this.marker = new Marker({ color: '#FF0000' })
          .setLngLat([this.markerCoords.lng, this.markerCoords.lat])
          .addTo(this.map);
      }
      this.updateCoordinates(this.markerCoords);

      this.map.flyTo({
        center: [this.markerCoords.lng, this.markerCoords.lat],
        zoom: 15.5,
        essential: true,
      });
    } else {
      this.removeMapMarker();
    }
  }
  private removeMapMarker() {
    if (this.marker) {
      this.marker.remove();
      this.marker = undefined;
    }
  }
  private updateCoordinates(lngLat: { lng: number; lat: number }) {
    this.coordinates.nativeElement.style.display = 'block';
    this.coordinates.nativeElement.innerHTML = `Longitude: ${lngLat.lng}<br />Latitude: ${lngLat.lat}`;
  }
}
