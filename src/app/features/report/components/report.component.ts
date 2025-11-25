// Angular core imports
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  inject,
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatDrawer } from '@angular/material/sidenav';
import { TranslateService } from '@ngx-translate/core';

// OpenLayers imports
import { Collection, Feature, Map, Overlay, View } from 'ol';
import { Layer, Vector } from 'ol/layer';
import LayerGroup from 'ol/layer/Group';
import VectorLayer from 'ol/layer/Vector';
import { fromLonLat, Projection, toLonLat } from 'ol/proj';
import { Source } from 'ol/source';
import VectorSource from 'ol/source/Vector';
import { Fill, Stroke, Style, Icon } from 'ol/style';
import { Draw, Modify, Select } from 'ol/interaction';
import { Geometry, LineString, Polygon } from 'ol/geom';
import { getArea } from 'ol/sphere';
import LayerRenderer from 'ol/renderer/Layer';
import Point from 'ol/geom/Point.js';

// RxJS imports
import {
  BehaviorSubject,
  catchError,
  EMPTY,
  filter,
  Observable,
  of,
  ReplaySubject,
  Subject,
  Subscription,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs';

// Application specific imports
import { ImageOptions, IntervetionZoneList } from '../../map/models/zone';
import { BaseMaps } from '../../../shared/baseMaps';
import { MapService } from '../../map/services/map.service';
import { DeviceService } from '../../device/services/device.service';
import { SharedModule } from '../../../shared/shared.module';
import { MatDialog } from '@angular/material/dialog';
import { RapportTableComponent } from './trajectory/trajectory.component';
import { TilesTrajectoryService } from '../services/tiles-trajectory.service';
import { ActivatedRoute, NavigationStart, Router } from '@angular/router';
import { Location, MatchedPoint, ModalData } from '../models/rapport.model';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TilesInterventionZoneService } from '../../map/services/tiles-zone.service';
import { ReportService } from '../services/rapport.service';
import { DeviceStatusService } from '../../device/services/status.service';
import {
  Device,
  DeviceResponse,
  DeviceStatus,
} from '../../device/models/device';
import { SwitchMapService } from '../../../shared/switchMap';
import TileLayer from 'ol/layer/Tile';
import BaseLayer from 'ol/layer/Base';
import { ToastService } from 'angular-toastify';
import { boundingExtent, getCenter } from 'ol/extent';

@Component({
  selector: 'app-rapport',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './report.component.html',
  styleUrl: './report.component.scss',
})
export class RapportComponent implements OnInit, AfterViewInit {
  // ========== Injected Services ==========
  private readonly mapService = inject(MapService);
  private readonly deviceService = inject(DeviceService);
  private readonly translate = inject(TranslateService);
  private readonly cdRef = inject(ChangeDetectorRef);
  private readonly dialog = inject(MatDialog);
  private readonly route = inject(ActivatedRoute);
  private readonly tilesTrajectoryService = inject(TilesTrajectoryService);
  private readonly fb = inject(FormBuilder);
  private readonly reportService = inject(ReportService);
  private readonly devicePositionService = inject(DeviceStatusService);
  private readonly _toastService = inject(ToastService);

  // ========== ViewChild Elements ==========
  @ViewChild('drawerRef', { static: false }) public drawer!: MatDrawer;
  @ViewChild('ol_map_report') public mapElement!: ElementRef<HTMLElement>;
  @ViewChild('ol_map_report')
  set myDiv(el: ElementRef) {
    this.map.setTarget(el.nativeElement);
  }

  // ========== Map Core ==========
  public map!: Map;
  public mapReview?: Map;
  public projCode = 'EPSG:3857';
  public myProjection = new Projection({ code: this.projCode, units: 'm' });

  // ========== Base Layers and Vector Layers ==========
  public vectorSource = new VectorSource();
  public polygonLayer = new VectorLayer();
  public chooseLayer = new VectorLayer();
  public vectorLayer = new VectorLayer({
    source: this.vectorSource,
    style: new Style({
      stroke: new Stroke({ color: 'red', width: 1.5 }),
    }),
  });

  private readonly _trajectorySourceLine = new VectorSource();
  private readonly _trajectoryLayerLine = new VectorLayer({
    source: this._trajectorySourceLine,
    style: new Style({
      stroke: new Stroke({ color: '#ef381e', width: 5 }),
    }),
  });

  private readonly vectorSourceMarker = new VectorSource();
  private readonly vectorSourceMarkerEnd = new VectorSource();

  private readonly markersLayer = new VectorLayer({
    source: this.vectorSourceMarker,
    style: new Style({
      image: new Icon({
        anchor: [0.5, 1],
        src: 'assets/img/location.png',
        scale: 0.09,
      }),
    }),
    zIndex: Infinity,
  });

  private readonly markersEndLayer = new VectorLayer({
    source: this.vectorSourceMarkerEnd,
    style: new Style({
      image: new Icon({
        anchor: [0.5, 1],
        src: 'assets/img/pin_end.png',
        scale: 0.09,
      }),
    }),
    zIndex: Infinity,
  });

  public vectorTileReady!: Layer<Source, LayerRenderer<any>>;
  public vectorTileNotReady!: Layer<Source, LayerRenderer<any>>;
  public vectorIgnGroup!: LayerGroup;

  public vectorTileZoneReady!: Layer<Source, LayerRenderer<any>>;
  public vectorTileZoneNotReady!: Layer<Source, LayerRenderer<any>>;
  public vectorZoneGroup!: LayerGroup;

  // ========== Drawing Tools ==========
  public draw: Draw | null = null;
  public modify: Modify | null = null;

  // ========== Features & Markers ==========
  public iconFeature = new Feature({
    geometry: new Point([0, 0]),
    name: 'Null Island',
    population: 4000,
    rainfall: 500,
  });

  public iconStyle = new Style({
    image: new Icon({
      anchor: [0.5, 46],
      anchorXUnits: 'fraction',
      anchorYUnits: 'pixels',
      src: 'data/icon.png',
    }),
  });

  public markerSource = new VectorSource();
  public markerLayer = new VectorLayer();
  public popup = new Overlay({});

  private markerFeature: Feature | null = null;
  private markerEndFeature: Feature | null = null;
  private previousPosition: { lat: number; lng: number } | null = null;

  public hoverMarker: Feature | null = null;
  public markerPosition: number[] | null = null;
  public coordinates: { lat: number; lng: number } | null = null;

  // ========== Report Form ==========
  public reportFormGroup?: FormGroup;

  // ========== State & Flags ==========
  public loading = true;
  public showLoading = false;
  public isEmptyMap = true;
  public isPolygonDrawn = false;
  public isFeatureSelected = false;
  public isSelectedZone = false;
  public saveZoneSuccess = false;
  public showEditButton?: boolean;
  public showInterventionZone = false;

  // ========== Data & Configuration ==========
  public selectedDeviceId!: string;
  public selectedRow: any;
  public feature: any;
  public deviceIdValueSelected = '';
  public dateValueSelected = '';
  public idCompany: string | null = null;
  public interventionZoneValueSelected = '';
  public PROFESSIONAL = 'Professional';
  public devicePosition?: Location;

  public activeLayer!: TileLayer<any>;
  public imageBaseMap: ImageOptions[] = [];

  // ========== Trajectory Segments ==========
  private _trajectorySegments: [number, number][][] = [];
  private _currentSegment: [number, number][] = [];

  // ========== Observables & Subjects ==========
  private readonly destroy$ = new Subject<void>();
  public destroyed$ = new ReplaySubject<boolean>(1);
  public editionMode$ = new BehaviorSubject<boolean>(false);
  public dataSource$ = new BehaviorSubject<any>(new MatTableDataSource([]));
  public listDevice$!: Observable<DeviceResponse>;

  // ========== Other ==========
  private routeSubscription!: Subscription;
  public viewReportDetail!: () => void;
  public selectedData?: ModalData;
  public matchedPoint!: MatchedPoint;

  public maxDistance = 50000;
  public maxArea = 50000;

  constructor(private router: Router) {
    this.imageBaseMap = new SwitchMapService().getImageBaseMap();
    this.activeLayer = this.imageBaseMap[0].source;

    this.iconFeature.setStyle(this.iconStyle);

    this.map = new Map({
      layers: [this.activeLayer, this.markersLayer, this.markersEndLayer],
      view: new View({
        center: fromLonLat([2.6648, 46.7592]),
        projection: this.myProjection,
        zoom: 7,
        maxZoom: 22,
        minZoom: 3,
      }),
      controls: [],
    });

    this.feature = new Feature();

    const reportTable: Subject<void> = new Subject<void>();
    this.viewReportDetail = () => {
      reportTable.next();
    };

    reportTable
      .pipe(
        takeUntil(this.destroyed$),
        switchMap(() => {
          this.dialog.closeAll();
          return this.openReportTableDialog().afterClosed();
        }),
        filter((response) => !!response),
        tap(() => (this.loading = true)),
        tap((response) => this.handleReportTableResponse(response))
      )
      .subscribe();

    this.routeSubscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.dialog.closeAll();
      }
    });
  }

  ngOnInit(): void {
    this.reportFormGroup = this.fb.group({
      selectedDevice: ['', [Validators.required]],
    });

    this.route.paramMap.pipe(takeUntil(this.destroyed$)).subscribe((params) => {
      this.idCompany = params.get('uid');

      if (this.idCompany) {
        this.deviceService.getCompaniesById(this.idCompany).subscribe({
          next: (device) => {
            if (!device) {
              this.router.navigate(['/not-found']);
            }
          },
          error: () => {
            this.router.navigate(['/not-found']);
          },
        });
      }
    });
  }

  private openReportTableDialog() {
    return this.dialog.open(RapportTableComponent, {
      data: {
        idCompany: this.idCompany,
        device: this.deviceIdValueSelected,
        date: this.dateValueSelected,
        showZone: this.showInterventionZone,
        zoneId: this.interventionZoneValueSelected,
      },
      panelClass: [
        'dialogWithNoPadding',
        'animate__animated',
        'animate__slideInRight',
      ],
      position: { top: '59px', bottom: '0px', right: '0px' },
      width: '20vw',
      maxHeight: '90vh',
      height: 'auto',
      disableClose: false,
      hasBackdrop: false,
    });
  }

  private handleReportTableResponse(response: any) {
    this.selectedData = response;
    if (!this.selectedData?.device) return;
    this.deviceIdValueSelected = this.selectedData.device;
    this.dateValueSelected = this.selectedData.date;
    this.showInterventionZone = this.selectedData.showZone;
    this.interventionZoneValueSelected = this.selectedData.zoneId;

    this.handleDeviceTrajectoryAndPosition();

    this.handleInterventionZone();

    this.getTrajectoryVehicleRealTime(
      this.deviceIdValueSelected,
      this.dateValueSelected
    );
  }

  private handleDeviceTrajectoryAndPosition() {
    this.deviceTrajectory(this.deviceIdValueSelected, this.dateValueSelected);
    this.getDevicePosition(this.deviceIdValueSelected, this.dateValueSelected);
  }

  private handleInterventionZone() {
    if (this.showInterventionZone) {
      this.showInterventioZoneLayers(this.interventionZoneValueSelected);
    } else {
      this.clearInterventionZoneLayers();
    }
  }

  private clearInterventionZoneLayers() {
    if (this.vectorZoneGroup) {
      this.vectorZoneGroup.getLayers().clear();
      this.map.removeLayer(this.vectorZoneGroup);
      this.vectorZoneGroup = new LayerGroup({});
      this.map.addLayer(this.vectorZoneGroup);
    }
  }

  /**
   * after view init
   */
  ngAfterViewInit() {
    this.map.updateSize();
    this.cdRef.detectChanges();
    document.getElementById('plus')?.addEventListener('click', () => {
      const view = this.map.getView();
      const currentZoom = view.getZoom();
      if (currentZoom !== undefined) {
        view.animate({ zoom: currentZoom + 1, duration: 500 });
      }
    });
    document.getElementById('moins')?.addEventListener('click', () => {
      const view = this.map.getView();
      const currentZoom = view.getZoom();
      if (currentZoom !== undefined && currentZoom > view.getMinZoom()) {
        view.animate({ zoom: currentZoom - 1, duration: 500 });
      }
    });

    const popupElement = document.getElementById('popup');
    if (popupElement) {
      this.popup = new Overlay({
        element: popupElement,
        positioning: 'bottom-center',
      });
      this.map.addOverlay(this.popup);
    } else {
      console.error('Element with id "popup" not found.');
    }

    this.map.on('click', (event) => {
      const clickedFeature = this.map.forEachFeatureAtPixel(
        event.pixel,
        (feature) => {
          return feature; // Return the feature if it's found at the pixel location
        }
      );

      if (clickedFeature) {
        const extent = clickedFeature.getGeometry()?.getExtent();
        if (extent) {
          const centerX = (extent[0] + extent[2]) / 2;
          const centerY = (extent[1] + extent[3]) / 2;
          this.map.getView().animate({
            center: [centerX, centerY],
            zoom: 17,
            duration: 1000,
          });
        }
      }
      const coordinates = event.coordinate;
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
    });

    this.map.on('pointermove', (e) => {
      const hoveredFeature = this.map.forEachFeatureAtPixel(
        e.pixel,
        (feature) => {
          return feature; // Return the feature if it's found at the pixel location
        }
      );
      if (hoveredFeature && hoveredFeature.get('properties_data')) {
        const propertiesData = hoveredFeature.get('properties_data');
        if (propertiesData) {
          try {
            // Parse the properties data from the feature
            const properties = JSON.parse(propertiesData);
            const points = properties.trajectory;

            // Get the coordinates of the point being hovered over
            const closestPoint = this.map.getCoordinateFromPixel(e.pixel);
            const closestPointLonLat = toLonLat(closestPoint);

            // Find the matched point closest to the hovered coordinates
            this.matchedPoint = points.find((point: any) => {
              return (
                Math.abs(point.location.lat - closestPointLonLat[1]) < 0.00005 &&
                Math.abs(point.location.lng - closestPointLonLat[0]) < 0.00007
              );
            });

            if (this.matchedPoint) {
              this.markerPosition = fromLonLat([
                this.matchedPoint.location.lng,
                this.matchedPoint.location.lat,
              ]);

              if (!this.popup) {
                const popupElement = document.getElementById('popup');

                if (popupElement) {
                  this.popup = new Overlay({
                    element: popupElement,
                    positioning: 'bottom-center', // Position the popup below the marker
                  });
                  this.map.addOverlay(this.popup); // Add the popup overlay to the map
                } else {
                  console.error('Element with id "popup" not found.');
                }
              }

              this.popup.setPosition(this.markerPosition);

              const content = this.generatePopupContent(this.matchedPoint);
              const popupContent = this.popup.getElement();

              if (popupContent) {
                popupContent.innerHTML = content;
              }
            }
          } catch (error) {
            console.error('Error decoding JSON:', error);
          }
        }
      } else {
        // If no feature is hovered over, hide the popup
        if (this.popup) {
          // Hide the popup by setting its position to undefined
          this.popup.setPosition(undefined);
          this.markerPosition = null;
        }
      }
    });
  }

  /**
   * destroy instance
   */
  ngOnDestroy(): void {
    this.destroyed$.next(true);
    this.destroyed$.complete();
  }

  /**
   * remove layer and reset buttons
   */
  resetInit() {
    if (this.polygonLayer) {
      this.map.removeLayer(this.polygonLayer);
      this.editionMode$.next(false);
      this.isEmptyMap = true;
      this.isPolygonDrawn = false;
    }
    if (this.chooseLayer) {
      this.map.removeLayer(this.chooseLayer);
    }
  }

  /**
   * Get translated column headers
   */
  getTranslatedColumn(column: string): string {
    const translation = this.translate.instant(
      `boundary.columns.${column.toLowerCase()}`
    );
    return translation !== `boundary.columns.${column.toLowerCase()}`
      ? translation
      : column;
  }

  /**
   * Check if boundary length exceeds maxDistance
   */
  checkBoundaryLength(coords: any): boolean {
    const startPoint = coords[0];
    const endPoint = coords[coords.length - 1];
    return true;
  }

  /**
   * Convert degree to radian
   * @param deg
   */
  degToRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  // Polygon area check function
  checkPolygonArea(coords: any[]): boolean {
    const polygon = new Polygon([coords]);
    const area = getArea(polygon);
    return area <= this.maxArea;
  }

  formatArea(area: number): string {
    if (area >= 1000000) {
      return (area / 1000000).toFixed(2) + ' km²';
    } else {
      return (area / 10000).toFixed(2) + ' hectares';
    }
  }

  ngOnChanges(changes: SimpleChanges): void {}

  private deviceTrajectory(deviceId: string, date: string): void {
    this.vectorTileReady = this.tilesTrajectoryService.getTrajectoryLayer(
      true,
      10,
      0.4,
      deviceId,
      date
    );

    this.vectorTileNotReady = this.tilesTrajectoryService.getTrajectoryLayer(
      false,
      10,
      0.7,
      deviceId,
      date
    );

    const layersCollection = new Collection([
      this.vectorTileNotReady,
      this.vectorTileReady,
    ]);

    if (this.vectorIgnGroup) {
      this.vectorIgnGroup.setLayers(layersCollection);
    } else {
      // If vectorIgnGroup doesn't exist, create it and add to the map
      this.vectorIgnGroup = new LayerGroup({
        layers: [this.vectorTileNotReady, this.vectorTileReady],
        minZoom: 0,
      });
      this.mapService.setVectorGroupData(this.vectorIgnGroup);
      this.vectorIgnGroup.setZIndex(1);
      this.map.addLayer(this.vectorIgnGroup); // Add the layer group to the existing map
    }
  }

  private showInterventioZoneLayers(deviceId: string): void {
    // Re-create the vector tile layers with updated interventionZoneIdValue
    this.getViewInterventionZone(deviceId);
    this.vectorTileZoneReady =
      new TilesInterventionZoneService().getInterventionZoneLayer(
        true,
        4,
        0.4,
        deviceId
      );

    this.vectorTileZoneNotReady =
      new TilesInterventionZoneService().getInterventionZoneLayer(
        false,
        3,
        0.7,
        deviceId
      );

    const layersCollection = new Collection([
      this.vectorTileZoneNotReady,
      this.vectorTileZoneReady,
    ]);

    if (this.vectorZoneGroup) {
      this.vectorZoneGroup.setLayers(layersCollection);
    } else {
      // If vectorIgnGroup doesn't exist, create it and add to the map
      this.vectorZoneGroup = new LayerGroup({
        layers: [this.vectorTileZoneNotReady, this.vectorTileZoneReady],
        minZoom: 0,
      });
      this.mapService.setVectorGroupData(this.vectorZoneGroup);
      this.vectorZoneGroup.setZIndex(0);
      this.map.addLayer(this.vectorZoneGroup); // Add the layer group to the existing map
    }
  }

  /**
   *
   * Function to generate the HTML content for the popup
   */
  generatePopupContent(matchedPoint: any): string {
    return `
      <div class="bg-white text-black rounded-lg shadow-lg p-4 max-w-xs">
        <h4 class="text-xl font-semibold mb-2">${this.translate.instant(
          'report.coordinates'
        )}</h4>
        <p class="text-sm mb-2"><span class="font-semibold">${this.translate.instant(
          'report.latitude'
        )}</span> ${matchedPoint.location.lat}</p>
        <p class="text-sm mb-2"><span class="font-semibold">${this.translate.instant(
          'report.longitude'
        )}</span> ${matchedPoint.location.lng}</p>
        <p class="text-sm mb-2"><span class="font-semibold">${this.translate.instant(
          'report.speed'
        )}</span> ${matchedPoint.speed} km/h</p>
        <span class="font-semibold">
          ${this.translate.instant('report.date')}
        </span>
        ${new Date(matchedPoint.timestamp).toLocaleString()}
      </p>

        <img src="assets/img/location.png" alt="Marker Icon" class="w-5 h-5 absolute left-0 right-0 bottom-0 mx-auto my-auto" />
      </div>
    `;
  }

  getListeDevices(idCompany: string) {
    this.listDevice$ = this.deviceService.getListDevices(idCompany);
  }

  getDevicePosition(idDevice: string, dateTrajectory: string): void {
    const today = new Date().toISOString().split('T')[0];

    this.reportService
      .getDevicePosition(idDevice, dateTrajectory)
      .pipe(
        catchError((err) => {
          if (dateTrajectory === today) {
            return this.reportService.getDevicePosition(idDevice, '').pipe(
              catchError(() => {
                // pas de trajet précédent non plus
                this._toastService.info(
                  this.translate.instant('report.noPastTrajectory')
                );
                return of(null);
              })
            );
          }
          return of(null);
        })
      )
      .subscribe({
        next: (data: Location | null) => {
          if (data) {
            this.devicePosition = data;
            this.previousPosition = null;
            this.addMarker(this.devicePosition.lat, this.devicePosition.lng);

            this.map.getView().animate({
              center: fromLonLat([
                this.devicePosition.lng,
                this.devicePosition.lat,
              ]),
              zoom: 17,
              duration: 1000,
            });
          } else if (dateTrajectory !== today) {
            this._toastService.info(
              this.translate.instant('report.noTrajectory')
            );
          }
        },
        error: () => {
          this._toastService.info(
            this.translate.instant('report.noTrajectory')
          );
        },
      });
  }

  addMarker(lat: number, lng: number): void {
    if (
      this.previousPosition &&
      this.previousPosition.lat === lat &&
      this.previousPosition.lng === lng
    ) {
      return;
    }

    if (this.markerFeature) {
      this.vectorSourceMarker.removeFeature(this.markerFeature);
      this.markerFeature = null;
    }

    this.markerFeature = new Feature({
      geometry: new Point(fromLonLat([lng, lat])),
    });

    this.vectorSourceMarker.addFeature(this.markerFeature);

    this.previousPosition = { lat, lng };
  }

  addEndMarker(lat: number, lng: number): void {
    if (
      this.previousPosition &&
      this.previousPosition.lat === lat &&
      this.previousPosition.lng === lng
    ) {
      return;
    }

    if (this.markerEndFeature) {
      this.vectorSourceMarkerEnd.removeFeature(this.markerEndFeature);
      this.markerEndFeature = null;
    }

    this.markerEndFeature = new Feature({
      geometry: new Point(fromLonLat([lng, lat])),
    });

    this.vectorSourceMarkerEnd.addFeature(this.markerEndFeature);

    this.previousPosition = { lat, lng };

    this.map.getView().animate({
      center: fromLonLat([lng, lat]),
      zoom: 17,
      duration: 1000,
    });
  }

  getTrajectoryVehicleRealTime(
    deviceIdValueSelected: string,
    dateValueSelecteds: string
  ) {
    this.devicePositionService
      .getStatusUpdates()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          const device = data.device_id === deviceIdValueSelected;
          const today = new Date().toISOString().split('T')[0];
          if (data.position?.lat && data.position?.lng && device) {
            this.addMarker(data.position.lat, data.position.lng);
            this.updateTrajectoryLine(data);
          }
        },
        error: (error) =>
          console.error('Error receiving device status:', error),
      });

    if (!this.map.getLayers().getArray().includes(this._trajectoryLayerLine)) {
      this.map.addLayer(this._trajectoryLayerLine);
    }
  }

  private updateTrajectoryLine(devicePosition: DeviceStatus) {
    if (!devicePosition.position) return;

    const newCoord: [number, number] = [
      devicePosition.position.lng,
      devicePosition.position.lat,
    ];

    if (devicePosition.position.device_mode === this.PROFESSIONAL) {
      this._currentSegment.push(newCoord);
    } else {
      if (this._currentSegment.length > 1) {
        this._trajectorySegments.push([...this._currentSegment]);
      }
      this._currentSegment = [];
    }

    this.renderTrajectory();
  }

  private renderTrajectory() {
    this._trajectorySourceLine.clear();

    const addSegmentToSource = (segment: [number, number][]) => {
      const lineGeometry = new LineString(
        segment.map((coord) => fromLonLat(coord))
      );
      const feature = new Feature(lineGeometry);
      this._trajectorySourceLine.addFeature(feature);
    };

    this._trajectorySegments.forEach(addSegmentToSource);

    if (this._currentSegment.length > 1) {
      addSegmentToSource(this._currentSegment);
    }
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

    this.map.addLayer(baseMap.source);
    nonTileLayers.forEach((layer) => this.map.addLayer(layer));

    this.activeLayer = baseMap.source;

    this.imageBaseMap.forEach((map) => {
      map.visible = map === baseMap;
    });

    this.cdRef.detectChanges();
  }

  getViewInterventionZone(interventionZoneValueSelected: string): void {
    this.deviceService
      .getIntervetionZoneById(interventionZoneValueSelected)
      .pipe(
        catchError((error) => {
          console.error('Error fetching intervention zone details:', error);
          return EMPTY;
        })
      )
      .subscribe({
        next: (data) => {
          this.zoomToInterventionZone(data);
        },
      });
  }

  zoomToInterventionZone(zone: any) {
    if (!zone || !zone.geom || zone.geom.type !== 'Polygon') {
      console.error('Invalid zone data');
      return;
    }
    const coordinates = zone.geom.coordinates[0];
    const extent = boundingExtent(coordinates);
    const center = getCenter(extent);
    this.map.getView().animate({
      center: center,
      zoom: 9,
      duration: 1000,
    });
  }
}
