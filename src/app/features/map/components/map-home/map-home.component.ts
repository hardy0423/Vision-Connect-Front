import {
  Component,
  AfterViewInit,
  ViewChild,
  ChangeDetectorRef,
  OnInit,
  ElementRef,
  inject,
  OnDestroy,
} from '@angular/core';
import { environment } from '../../../../../environment/environment';
import { Feature, Map as MapOl, Overlay, View } from 'ol';
import { BaseMaps } from '../../../../shared/baseMaps';
import { fromLonLat, Projection, toLonLat } from 'ol/proj';
import TileLayer from 'ol/layer/Tile';
import { CommonModule } from '@angular/common';
import { DeviceStatusService } from '../../../device/services/status.service';
import {
  catchError,
  forkJoin,
  map,
  of,
  Subject,
  take,
  takeUntil,
  tap,
} from 'rxjs';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import { Icon, Style } from 'ol/style';
import { Point } from 'ol/geom';
import { DeviceService } from '../../../device/services/device.service';
import { ReportService } from '../../../report/services/rapport.service';
import BaseLayer from 'ol/layer/Base';
import { SwitchMapService } from '../../../../shared/switchMap';
import { ImageOptions } from '../../models/zone';
import { Device } from '../../../device/models/device';
import { TranslateModule } from '@ngx-translate/core';
import { defaults as defaultInteractions } from 'ol/interaction/defaults.js';
import { DragRotateAndZoom } from 'ol/interaction';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './map-home.component.html',
  styleUrl: './map-home.component.scss',
})
export class HomeComponent implements OnInit, OnDestroy {
  // ========= Injected services =========
  private devicePositionService = inject(DeviceStatusService);
  private deviceService = inject(DeviceService);
  private reportService = inject(ReportService);

  // ========= Map-related variables =========
  private map: MapOl;
  private vectorSource: VectorSource = new VectorSource();
  private markersLayer: VectorLayer = new VectorLayer({});
  private overlay!: Overlay;

  // ========= Coordinates =========
  public coordinates: { lat: number; lng: number } | null = null;

  // ========= View references =========
  @ViewChild('mapContainer') mapElement!: ElementRef<HTMLElement>;

  // Bind the map to a specific DOM element
  @ViewChild('mapContainer') set myDiv(myDiv: ElementRef) {
    this.map.setTarget(myDiv.nativeElement); // Bind the map to the DOM element
  }

  // ========= Environment and projection settings =========
  public API_KEY = environment.maptilerKey;
  private projCode = 'EPSG:3857';
  private myProjection = new Projection({
    code: this.projCode,
    units: 'm',
  });

  // ========= Base map configuration =========
  public imageBaseMap: ImageOptions[] = [];

  // ========= Device tracking variables =========
  private deviceMap: Map<string | undefined, Device> = new Map();
  private deviceMarkersList: Map<string, Feature> = new Map();
  private destroy$ = new Subject<void>();

  // ========= Display control =========
  public isFullscreen = false;
  public activeLayer: TileLayer<any>;

  constructor(private cdRef: ChangeDetectorRef) {
    this.imageBaseMap = new SwitchMapService().getImageBaseMap();
    this.activeLayer = this.imageBaseMap[0].source; // Set default base map

    // Initialize the marker layer
    this.vectorSource = new VectorSource();
    this.markersLayer = new VectorLayer({
      source: this.vectorSource,
      zIndex: Infinity,
    });

    // Initialize the map
    this.map = new MapOl({
      layers: [this.activeLayer, this.markersLayer],
      view: new View({
        center: fromLonLat([2.6648, 46.7592]),
        projection: this.myProjection,
        zoom: 5,
        maxZoom: 22,
        minZoom: 3,
      }),
      controls: [],
      interactions: defaultInteractions().extend([new DragRotateAndZoom()]),
    });
  }

  // Cleanup subscriptions when the component is destroyed
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Switch the base map and retain non-base layers such as markers.
   * @param baseMap The new base map to display.
   */
  switchBaseMap(baseMap: ImageOptions): void {
    const nonTileLayers: BaseLayer[] = [];
    this.map
      .getLayers()
      .getArray()
      .slice()
      .forEach((layer) => {
        if (!(layer instanceof TileLayer)) {
          nonTileLayers.push(layer);
        }
        this.map.removeLayer(layer);
      });

    this.map.addLayer(baseMap.source); // Add the new base map layer
    nonTileLayers.forEach((layer) => this.map.addLayer(layer)); // Re-add non-base layers

    this.activeLayer = baseMap.source;

    this.imageBaseMap.forEach((map) => {
      map.visible = map === baseMap;
    });

    this.cdRef.detectChanges(); // Trigger change detection for UI update
  }

  /**
   * Initialize map overlays and fetch device positions.
   */
  ngOnInit(): void {
    // Create and add a popup overlay to the map
    const popupElement = document.getElementById('popup')!;
    this.overlay = new Overlay({
      element: popupElement,
      positioning: 'bottom-center',
      stopEvent: true,
      offset: [0,-17],
    });
    this.map.addOverlay(this.overlay);

    this.devicePositionService
      .getStatusUpdates()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          const device = this.deviceMap.get(data.device_id);
          if (data.position && device) {
            this.updateMarker(
              data.device_id,
              data.position.lat,
              data.position.lng,
              device.name,
              data.speed,
              data.companyName,
              data.position.status,
              data.car_name,
              data.address
            );
          }
        },
        error: (error) =>
          console.error('Error receiving device status:', error),
      });

    this.deviceService
      .getDevicesForAuthenticatedUser()
      .pipe(
        tap((devices) => {
          this.updateDeviceMap(devices);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();

    this.map.on('click', (event) => {
      const clickedFeature = this.map.forEachFeatureAtPixel(
        event.pixel,
        (feature) => {
          return feature;
        }
      );
      if (clickedFeature && clickedFeature.get('deviceId')) {
        const coordinates = (
          clickedFeature.getGeometry() as Point
        ).getCoordinates();
        const deviceName = clickedFeature.get('deviceName');

        const popupContent = this.overlay.getElement();

        if (popupContent) {
          const speed = clickedFeature.get('speed') || '';
          const companyName = clickedFeature.get('companyName') || '';
          const carName = clickedFeature.get('carName') || '';
          const coordinates = clickedFeature.get('position') || '';
          const adress = clickedFeature.get('address') || '';

          popupContent.innerHTML = `

        <div style="text-align: left; padding-left: 4px;">
            <p><span style="color: blue;">Entreprise :</span> ${companyName}</p>
            <p><span style="color: blue;">Appareil :</span> ${deviceName}</p>
            <p><span style="color: blue;">Véhicule :</span> ${carName}</p>
            <p><span style="color: blue;">Vitesse :</span> ${speed} km/h</p>
            <p><span style="color: blue;">Adresse :</span> ${adress}</p>
            <p><span style="color: blue;">Position :</span> 
              ${coordinates[0].toFixed(2)}, ${coordinates[1].toFixed(2)}
            </p>
          </div>
          `;
        }
        this.overlay.setPosition(coordinates);

        const lonLat = toLonLat(coordinates);
        this.coordinates = {
          lat: lonLat[1],
          lng: lonLat[0],
        };

        this.map.getView().animate({
          center: coordinates,
          zoom: 17,
          duration: 1000,
        });
      } else {
        this.overlay.setPosition(undefined);
      }
    });
  }

  /**
   * Update the internal map of devices and add markers for devices that are offline.
   * @param devices List of devices for the user.
   */
  private updateDeviceMap(devices: Device[]): void {
    this.deviceMap.clear();
    let dateNow = new Date().toISOString().split('T')[0];
    devices.forEach((device) => {
      this.reportService
        .getDevicePosition(device.uid!, (dateNow = ''))
        .subscribe((position) => {
          this.updateMarker(
            device.uid!,
            position.lat,
            position.lng,
            position.name,
            '0',
            device.company_manager.name,
            position.status,
            device.car_name,
            position.city
          );
        });

      this.deviceMap.set(device.uid, device);
    });
  }

  /**
   * Add or update a marker for a device on the map.
   * @param deviceId The unique identifier for the device.
   * @param lat Latitude of the device.
   * @param lng Longitude of the device.
   * @param name Optional name of the device.
   */
  updateMarker(
    deviceId: string,
    lat: number,
    lng: number,
    name?: string,
    speed: string = '0',
    companyName: string = '',
    status: string = 'Off',
    carName: string = '',
    address: string = ''
  ): void {
    const coordinates = fromLonLat([lng, lat]);
    let marker = this.deviceMarkersList.get(deviceId);
    const outerColor = status === 'On' ? '#00FF00' : '#FF0000';
    const innerColor = status === 'On' ? '#00CC00' : '#CC0000';
    const position  = toLonLat(coordinates);
    const svgIcon = `
  <svg width="36px" height="36px" viewBox="0 0 36.00 36.00" version="1.1" 
       xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <g id="SVGRepo_iconCarrier">
      <g stroke-width="0.36" fill="none" fill-rule="evenodd">
        <g transform="translate(-125.000000, -643.000000)">
          <g transform="translate(37.000000, 169.000000)">
            <g transform="translate(78.000000, 468.000000)">
              <g transform="translate(10.000000, 6.000000)">
                <path d="M14,0 C21.732,0 28,5.641 28,12.6 C28,23.963 14,36 14,36 C14,36 0,24.064 0,12.6 C0,5.641 6.268,0 14,0 Z" 
                      fill="${outerColor}"></path>
                <circle cx="14" cy="14" r="7" fill="${innerColor}" fill-rule="nonzero"></circle>
              </g>
            </g>
          </g>
        </g>
      </g>
    </g>
  </svg>`;

    const svgDataUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
      svgIcon
    )}`;

    const iconStyle = new Style({
      image: new Icon({
        anchor: [0.5, 1],
        anchorXUnits: 'fraction',
        anchorYUnits: 'fraction',
        src: svgDataUri,
        scale: 0.9,
        crossOrigin: 'anonymous',
      }),
    });

    if (marker) {
      const geometry = marker.getGeometry() as Point;
      geometry.setCoordinates(coordinates);
      marker.setStyle(iconStyle);
      marker.set('speed', speed);
      marker.set('companyName', companyName);
      marker.set('carName', carName);
      marker.set('address', address);
      marker.set('position', position);
    } else {
      marker = new Feature({
        geometry: new Point(coordinates),
      });

      marker.setStyle(iconStyle);
      marker.set('deviceId', deviceId);
      marker.set('speed', speed);
      marker.set('companyName', companyName);
      marker.set('carName', carName);
      marker.set('address', address);

      marker.set('position', position);
      marker.set(
        'deviceName',
        name || this.deviceMap.get(deviceId)?.name || ''
      );
      this.vectorSource.addFeature(marker);
      this.deviceMarkersList.set(deviceId, marker);
    }
  }
}
