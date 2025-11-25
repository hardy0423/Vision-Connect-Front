import { MatDrawer } from '@angular/material/sidenav';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { TranslateService } from '@ngx-translate/core';
import GeoJSON from 'ol/format/GeoJSON';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Polygon } from 'ol/geom';
import { Collection, Feature, Map, MapBrowserEvent, View } from 'ol';
import { Projection, fromLonLat, toLonLat } from 'ol/proj';
import { Fill, Stroke, Style } from 'ol/style';
import { Draw, Modify, Select } from 'ol/interaction';
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  inject,
  Inject,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {
  BehaviorSubject,
  EMPTY,
  ReplaySubject,
  Subject,
  catchError,
  fromEventPattern,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs';
// assembly table show
import LayerGroup from 'ol/layer/Group';
import { TilesInterventionZoneService } from '../../services/tiles-zone.service';
import { MapService } from '../../services/map.service';
import { BaseMaps } from '../../../../shared/baseMaps';
import { getArea } from 'ol/sphere';
import { IntervetionZoneList, ZoneData } from '../../models/zone';
import { Layer } from 'ol/layer';
import { Source } from 'ol/source';
import LayerRenderer from 'ol/renderer/Layer';
import { ConfirmationComponent } from '../../../../shared/confirmation/confirmation.component';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { DeviceInterfaceOutput } from '../../../device/models/device';
import { ButtonComponent } from '../../../../shared/atoms/button/button/button.component';
import { SharedModule } from '../../../../shared/shared.module';
import { ToastService } from 'angular-toastify';

@Component({
  selector: 'draw-zone-map',
  standalone: true,
  templateUrl: './draw-zone.component.html',
  styleUrls: ['./draw-zone.component.scss'],
  imports: [SharedModule],
})
export class ZoneMapComponent implements OnChanges {
  // ----------- INPUTS -----------
  @Input() markerCoords: { lat: number; lng: number } | null = null;
  @Input() selectedInterventionZoneId!: string;
  @Input() namezone: string = '';

  // ----------- OUTPUTS -----------
  @Output() drawZoneEvent = new EventEmitter<boolean>();
  @Output() errorNameZone = new EventEmitter<boolean>();
  @Output() deselectZone = new EventEmitter<boolean>();
  @Output() deleteZoneEvent = new EventEmitter<boolean>();
  @Output() saveZoneEvent = new EventEmitter<boolean>();
  @Output() mapEmitted = new EventEmitter<Map>();
  @Output() featureChanged = new EventEmitter<any>();

  // ----------- CALLBACKS -----------
  onDrawLineInstance: () => void;
  onCleanMapInstance: () => void;
  onSubmitInstance: () => void;

  // ----------- MAP VARIABLES -----------
  map!: Map;
  mapReview?: Map;
  vectorSource = new VectorSource();
  polygonLayer = new VectorLayer();
  chooseLayer = new VectorLayer();
  vectorLayer = new VectorLayer({
    source: this.vectorSource,
    style: new Style({
      stroke: new Stroke({
        color: 'red',
        width: 1.5,
      }),
    }),
  });
  vectorTileClassifiedReady!: Layer<Source, LayerRenderer<any>>;
  vectorTileClassifiedNotReady!: Layer<Source, LayerRenderer<any>>;
  vectorIgnGroup!: LayerGroup;

  // ----------- MAP CONFIGURATION -----------
  projCode = 'EPSG:3857';
  myProjection = new Projection({
    code: this.projCode,
    units: 'm',
  });
  maxDistance: number = 50000;
  maxArea = 50000; // en m²

  // ----------- FLAGS (booleans) -----------
  showLoading: boolean = false;
  isEmptyMap: boolean = true;
  isPolygonDrawn: boolean = false;
  isFeatureSelected: boolean = false;
  isSelectedZone: boolean = false;
  saveZoneSuccess: boolean = false;
  showEditButton?: boolean;

  // ----------- DATA VARIABLES -----------
  feature: any;
  selectedRow: any;
  interventionZoneIdValue: string = '';

  // ----------- OBSERVABLES -----------
  private zoneDetailsSubject = new BehaviorSubject<IntervetionZoneList | null>(
    null
  );
  editionMode$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  dataSource$: BehaviorSubject<any> = new BehaviorSubject<any>(
    new MatTableDataSource([])
  );
  destroyed$: ReplaySubject<boolean> = new ReplaySubject(1);

  // ----------- DRAWING VARIABLES -----------
  draw: Draw | null = null;
  modify: Modify | null = null;
  coordinatesDraw: { lat: number; lng: number } | null = null;

  // ----------- VIEWCHILD ELEMENTS -----------
  @ViewChild('drawerRef', { static: false }) drawer!: MatDrawer;
  @ViewChild('ol_map') mapElement!: ElementRef<HTMLElement>;
  @ViewChild('ol_map') set myDiv(myDiv: ElementRef) {
    this.map.setTarget(myDiv.nativeElement); // Lier la carte à l'élément du DOM
  }

  // ----------- SERVICES -----------
  private mapService = inject(MapService);
  private _toastService = inject(ToastService);
  private translate = inject(TranslateService);

  /**
   * Constructor
   * @param dialog MatDialog
   * @param cdRef ChangeDetectorRef
   * @param authService AuthService
   * @param mapService MapService
   * @param store StoreService
   * @param translate TranslateService
   * @param notifierService NotifierService
   */
  constructor(
    public dialog: MatDialog,
    private cdRef: ChangeDetectorRef,
    private matIconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      device: DeviceInterfaceOutput;
      isAdd: boolean;
      idCompany: string;
    }
  ) {
    this.showEditButton = data.isAdd;
    this.matIconRegistry.addSvgIcon(
      'custom_polygon',
      this.domSanitizer.bypassSecurityTrustResourceUrl('assets/svg/polygon.svg')
    );

    this.map = new Map({
      layers: [new BaseMaps().getGoogleBaseMap()],
      view: new View({
        center: fromLonLat([2.6648, 46.7592]),
        projection: this.myProjection,
        zoom: 7,
        maxZoom: 22,
      }),
      controls: [],
    });

    this.map.on('loadstart', () => {
      this.map.getTargetElement().classList.add('spinner');
    });

    this.map.on('loadend', () => {
      this.map.getTargetElement().classList.remove('spinner');
    });

    this.feature = new Feature();

    const onDrawPolygon: ReplaySubject<void> = new ReplaySubject<void>(1);
    this.onDrawLineInstance = () => {
      onDrawPolygon.next();
    };

    const onCleanMap: ReplaySubject<void> = new ReplaySubject<void>(1);
    this.onCleanMapInstance = () => {
      onCleanMap.next();
    };

    const onAdd: Subject<void> = new Subject<void>();
    this.onSubmitInstance = () => {
      onAdd.next();
    };

    onAdd
      .pipe(
        takeUntil(this.destroyed$),
        switchMap(() => {
          let data: ZoneData = this.feature;
          if (this.namezone?.trim()) {
            data.properties.nameZone = this.namezone;
            this.errorNameZone.emit(false);
            return this.mapService.addGeographicBarrier(data).pipe(
              catchError((error) => {
                if (error.status == 400) {
                  this._toastService.error(
                    this.translate.instant('map.error_creating_map')
                  );
                }
                return EMPTY;
              }),
              tap(() => {
                this.updateLayers();
                this.saveZoneEvent.emit(true);
                this.saveZoneSuccess = true;
                this.map.getView().animate({
                  zoom: 7,
                  duration: 1000,
                });
                this._toastService.success(
                  this.translate.instant('map.success_creating_map')
                );
              })
            );
          } else {
            this.errorNameZone.emit(true);
            return EMPTY;
          }
        })
      )
      .subscribe();

    onDrawPolygon
      .pipe(
        takeUntil(this.destroyed$),
        tap(() => {
          this.cdRef.detectChanges();
          this.editionMode$.next(true);

          const source = this.vectorLayer.getSource();
          if (source) {
            this.draw = new Draw({
              source: source,
              type: 'Polygon',
            });
            this.modify = new Modify({
              source: source,
            });

            this.map.addInteraction(this.draw);
            this.map.addInteraction(this.modify);
          }
          if (this.draw) {
            this.draw.on('drawend', (event) => {
              this.isEmptyMap = false;
              this.isPolygonDrawn = true;
              this.draw!.setActive(false);
              this.mapReview = this.map;
              this.mapEmitted.emit(this.mapReview); //si draw not

              const modifiedPolygone = event.feature.getGeometry() as Polygon;

              let transformedFeature = new Feature({
                geometry: modifiedPolygone.transform('EPSG:3857', 'EPSG:4326'),
              });
              let geometry = transformedFeature.getGeometry() as Polygon;

              // const coords = geometry.getCoordinates();
              // let validLength = this.checkBoundaryLength(coords);
              // if (!validLength) {
              //   this.notifierService.notify(
              //     'error',
              //     this.translate.instant("map.errors.too_long_boundary")
              //   );
              // }

              this.feature = {
                type: 'Feature',
                geometry: {
                  type: 'Polygon',
                  coordinates: geometry.getCoordinates(),
                },
                properties: {
                  Name: 'Liaison',
                },
              };
              const polygonSource = new VectorSource({
                features: new GeoJSON().readFeatures(this.feature, {
                  featureProjection: 'EPSG:3857',
                }),
              });
              this.displayPolygon(
                polygonSource,
                'rgba(97, 127, 246, 0.8)',
                true
              );
              this.editionMode$.next(true);
              this.modify = new Modify({
                source: polygonSource,
              });
              this.map.addInteraction(this.modify);
              if (this.modify) {
                this.modify.setActive(true);
              }
              this.modify.setActive(true);

              this.getUpdatingPolygon('Liaison');
              this.drawZoneEvent.emit(true);
              this.featureChanged.emit(this.feature);
            });
            this.draw.setActive(true);
          }
          if (this.modify) {
            this.modify.setActive(true);
          }
        })
      )
      .subscribe();

    onCleanMap
      .pipe(
        takeUntil(this.destroyed$),
        tap(() => {
          this.cdRef.detectChanges();
          this.resetInit();
          if (this.draw) {
            this.draw.setActive(false);
            this.vectorLayer.getSource()?.clear();
          }
          if (this.modify) {
            this.modify.setActive(false);
          }
          this.drawZoneEvent.emit(false);
          this.map.getView().animate({
            center: fromLonLat([2.6648, 46.7592]),
            zoom: 7,
            duration: 1000,
          });
        })
      )
      .subscribe();
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

    this.map.on('click', (event) => {
      const coordinates = event.coordinate;
      const lonLat = toLonLat(coordinates);
      this.coordinatesDraw = {
        lat: lonLat[1],
        lng: lonLat[0],
      };

      this.map.getView().animate({
        center: coordinates,
        zoom: 10,
        duration: 1000,
      });
    });
  }

  /**
   * Get instance after updating Polygon from map
   */
  getUpdatingPolygon(name: string = 'Liaison') {
    if (this.modify) {
      this.modify.setActive(true);
      this.modify?.on('modifyend', (event) => {
        // Événement déclenché à la fin de la modification de la ligne
        const modifiedPolygon = event.features
          .getArray()[0]
          .getGeometry() as Polygon;
        let transformedFeature = new Feature({
          geometry: modifiedPolygon.transform('EPSG:3857', 'EPSG:4326'),
        });
        let geometry = transformedFeature.getGeometry() as Polygon;
        let coordinates = geometry.getCoordinates();

        // let coords = coordinates.length > 1 ? coordinates : coordinates[0];
        // let validLength = this.checkPolygonArea(coords);
        // if (!validLength) {
        //   this.notifierService.notify(
        //     'error',
        //     this.translate.instant("map.errors.too_long_boundary")
        //   );
        // }

        this.feature = {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: coordinates,
          },
          properties: {
            Name: name,
          },
        };
        if (this.drawer) {
          this.drawer.close();
        }

        this.isEmptyMap = false;
        this.editionMode$.next(true);
        const polygonSource = new VectorSource({
          features: new GeoJSON().readFeatures(this.feature, {
            featureProjection: 'EPSG:3857',
          }),
        });
        if (polygonSource) {
          this.displayPolygon(polygonSource, 'rgba(97, 127, 246, 0.8)', true);
          this.modify = new Modify({
            source: polygonSource,
          });
          this.map.addInteraction(this.modify);
          if (this.modify) {
            this.modify.setActive(true);
            this.getUpdatingPolygon(name);
          }
        }
      });
    }
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
   * display the Polygon
   * @param source VectorSource
   * @param color string
   * @param generalLayer boolean
   */
  displayPolygon(source: VectorSource, color: string, generalLayer: boolean) {
    const lineStyle = new Style({
      fill: new Fill({
        color: 'rgba(215, 199, 207, 0.8)',
      }),
      stroke: new Stroke({
        color: color,
        width: 2,
      }),
    });
    if (generalLayer) {
      this.polygonLayer = new VectorLayer({
        source: source,
        style: lineStyle,
      });
      this.polygonLayer.setZIndex(9999);
      this.map.addLayer(this.polygonLayer);
    } else {
      this.chooseLayer = new VectorLayer({
        source: source,
        style: lineStyle,
      });
      this.chooseLayer.setZIndex(9999);
      this.map.addLayer(this.chooseLayer);
    }
    this.map.getView().fit(source.getExtent(), {
      padding: [50, 50, 50, 50],
      maxZoom: 16,
      duration: 500,
    });
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
    const distance = this.calculateDistance(startPoint, endPoint);
    if (distance > this.maxDistance) {
      return false;
    }
    return true;
  }

  /**
   * Calculer la distance en mètres entre deux coordonnées géographiques
   * @param coord1 number
   * @param coord2 number
   * @returns number
   */
  calculateDistance(coord1: number[], coord2: number[]): number {
    const lon1 = coord1[0];
    const lat1 = coord1[1];
    const lon2 = coord2[0];
    const lat2 = coord2[1];

    const R = 6371; // Rayon de la Terre en kilomètres
    const dLat = this.degToRad(lat2 - lat1);
    const dLon = this.degToRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.degToRad(lat1)) *
        Math.cos(this.degToRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c * 1000; // Convertir en mètres
    return d;
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

  deletePolygone(idZone: string) {
    let data = {
      title: this.translate.instant('map.title_suppression'),
      content: this.translate.instant('map.delete_zone'),
      yes: this.translate.instant('map.confirmation'),
      no: this.translate.instant('map.refus'),
    };

    const dialogRef = this.dialog.open(ConfirmationComponent, {
      disableClose: true,
      autoFocus: true,
      data: data,
    });

    dialogRef
      .afterClosed()
      .pipe(
        switchMap((result) => {
          if (result === true) {
            // Appel au service de suppression
            return this.mapService.deleteGeographicBarrier(idZone).pipe(
              catchError((error) => {
                if (error.status === 400) {
                  this._toastService.error(
                    this.translate.instant('map.error_deleting_map')
                  );
                }
                return EMPTY; // retourne un observable vide en cas d'erreur
              }),
              tap(() => {
                this.updateLayers();
                this.isSelectedZone = false;
                this.deleteZoneEvent.emit(true);
                this._toastService.success(
                  this.translate.instant('map.success_deleting_map')
                );
              })
            );
          } else {
            return EMPTY; // Retourne un observable vide si l'utilisateur annule
          }
        })
      )
      .subscribe();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedInterventionZoneId']) {
      //other condition
      // à revoir tiles
      this.interventionZoneIdValue = this.selectedInterventionZoneId;
      this.isSelectedZone = true;
      this.updateLayers();

      this.mapEmitted.emit(this.map);
      this.onCleanMapInstance();
      if (this.interventionZoneIdValue) {
        this.showEditButton = false;
      }
    }
  }

  private updateLayers(): void {
    // Re-create the vector tile layers with updated interventionZoneIdValue
    this.vectorTileClassifiedReady =
      new TilesInterventionZoneService().getInterventionZoneLayer(
        true,
        4,
        0.4,
        this.interventionZoneIdValue
      );

    this.vectorTileClassifiedNotReady =
      new TilesInterventionZoneService().getInterventionZoneLayer(
        false,
        3,
        0.7,
        this.interventionZoneIdValue
      );

    const layersCollection = new Collection([
      this.vectorTileClassifiedNotReady,
      this.vectorTileClassifiedReady,
    ]);

    if (this.vectorIgnGroup) {
      this.vectorIgnGroup.setLayers(layersCollection);
    } else {
      // If vectorIgnGroup doesn't exist, create it and add to the map
      this.vectorIgnGroup = new LayerGroup({
        layers: [
          this.vectorTileClassifiedNotReady,
          this.vectorTileClassifiedReady,
        ],
        minZoom: 0,
      });
      this.mapService.setVectorGroupData(this.vectorIgnGroup);
      this.map.addLayer(this.vectorIgnGroup); // Add the layer group to the existing map
    }
  }

  onUpdateInterventionZoneInstance(idZone: string) {
    this.showEditButton = true;
    this.deselectZone.emit(true);
  }
}
