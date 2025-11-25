import {
  AfterViewInit,
  Component,
  ElementRef,
  Inject,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { DeviceService } from '../device/services/device.service';
import { Device } from '../device/models/device';
import { Subscription } from 'rxjs';
import { ZoneMapComponent } from '../map/components/draw-zone/draw-zone.component';
import { Collection, Map, View } from 'ol';
import { MapService } from '../map/services/map.service';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import { FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IntervetionZoneList } from '../map/models/zone';
import LayerGroup from 'ol/layer/Group';

@Component({
  selector: 'app-revision',
  standalone: true,
  imports: [
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    MatGridListModule,
    MatFormFieldModule,
    MatCardModule,
    TranslateModule,
    ZoneMapComponent,
  ],
  templateUrl: './revision.component.html',
  styleUrl: './revision.component.scss',
})
export class RevisionComponent implements OnInit, OnDestroy, OnChanges {
  private deviceDataSubscription?: Subscription;
  private mapDataSubscription?: Subscription;

  interventionZoneName: string = '';
  typeNameDevice!: string;
  typeDeviceID!: String;
  companyNameDevice!: string;
  deviceData: Device | null = null;
  deviceZoneData: Device | null = null;

  @Input() formControl?: FormGroup;
  @Input() namezone: string = '';
  vectorIgnGroup!: LayerGroup;

  map?: Map | null;
  mapCopy?: Map | null;

  @ViewChild('ol_map_revision') mapElement!: ElementRef<HTMLElement>;

  constructor(
    private deviceDataService: DeviceService,
    private mapDataService: MapService,
    @Inject(MAT_DIALOG_DATA)
    public dataZone: { device: { zone: IntervetionZoneList }; isAdd: boolean }
  ) {
    this.interventionZoneName = dataZone.device.zone.nameZone;
  }

  ngOnChanges(changes: SimpleChanges): void {
  }

  ngOnInit(): void {
    this.deviceDataSubscription = this.deviceDataService
      .getDeviceData()
      .subscribe((data: any) => {
        this.deviceData = data; // Stockage des données du périphérique
        // Passez la chaîne de caractères directement
        if (this.deviceData?.type) {
          this.getDeviceType(this.deviceData);
        }

        if (this.deviceData?.company_manager) {
          this.getDeviceCompany(this.deviceData.company_manager);
        }
      });

    this.mapDataSubscription = this.mapDataService
      .getMapData()
      .subscribe((data: Map | null) => {
        if (data) {
          this.mapCopy = this.cloneMap(data, this.mapCopy);
          this.initializeMap();
        }
      });
  }

  getDeviceByImei(imei: string): void {
    this.deviceDataService.getDeviceByImei(imei).subscribe({
      next: (device) => {
        this.deviceZoneData = device;
      },
      error: (e) => console.error(e),
    });
  }

  getDeviceType(typeUid: any): void {
    if (!typeUid || !typeUid.type) {
      return;
    }
    const idTypeDevice = typeUid.type;
    this.deviceDataService.getDeviceTypes().subscribe({
      next: (deviceTypes) => {
        this.typeNameDevice =
          deviceTypes.find((item) => item.uid === idTypeDevice)?.name || '';
      },
      error: (e) => console.error('Error fetching device types:', e),
    });
  }

  getDeviceCompany(companyUid: any): void {
    this.deviceDataService.getCompanies().subscribe({
      next: (deviceCompany) => {
        this.companyNameDevice =
          deviceCompany.find((item) => item.uid === companyUid)?.name || '';
      },
      error: (e) => console.error('Error fetching device types:', e),
    });
  }

  private initializeMap(): void {
    if (this.mapCopy && this.mapElement && this.mapElement.nativeElement) {
      // this.mapCopy.addLayer(this.vectorIgnGroup); 
      const vectorLayer = this.mapCopy
        .getLayers()
        .getArray()
        .find((layer) => layer instanceof VectorLayer);
      const originalSource = this.map
        ?.getLayers()
        .getArray()
        .find((layer) => layer instanceof VectorLayer)
        ?.getSource();

      if (vectorLayer && originalSource) {
        vectorLayer.setSource(originalSource);
      }
      this.mapCopy.setTarget(this.mapElement.nativeElement);

    } else {
      console.warn("Impossible d'afficher la carte");
    }
  }

  ngOnDestroy(): void {
    if (this.deviceDataSubscription) {
      this.deviceDataSubscription.unsubscribe();
    }
    if (this.mapDataSubscription) {
      this.mapDataSubscription.unsubscribe();
    }

    if (this.mapCopy) {
      this.mapCopy.setTarget(undefined);
    }
  }

  /**
   * Clones the provided map and optionally updates an existing map with the cloned properties.
   *
   * This method creates a new map based on the view and layers of the original map. If an existing map (`mapCopy`) is provided,
   * it updates that map with the cloned view and layers. Otherwise, it creates a new map with the cloned properties.
   *
   * @param originalMap - The map to clone from.
   * @param mapCopy - An optional map to update with the cloned properties. If not provided, a new map is created.
   *
   * @returns A new map (or the updated `mapCopy`) with the cloned view and layers.
   */
  private cloneMap(originalMap: Map, mapCopy?: Map | null): Map {
    // Clone the view from the original map, or use null if no view is available

    let clonedView = originalMap.getView()
      ? new View({
          center: originalMap.getView().getCenter(),
          zoom: originalMap.getView().getZoom(),
          rotation: originalMap.getView().getRotation(),
        })
      : null;

    // If clonedView is null, create a default view
    if (!clonedView) {
      clonedView = new View({
        center: [0, 0],
        zoom: 2,
        rotation: 0,
      });
    }

    const layers = this.cloneLayers(originalMap);

    // If mapCopy is provided, update it with the cloned view and layers
    if (mapCopy) {
      mapCopy.setView(clonedView);
      mapCopy.setLayers(this.cloneLayers(originalMap));
      return mapCopy;
    }

    // If mapCopy is not provided, create a new map with the cloned view and layers
    const clonedMap = new Map({
      view: clonedView,
      layers: this.cloneLayers(originalMap),
      controls: originalMap.getControls(),
    });

    return clonedMap; // Return the newly created cloned map
  }

  
  /**
   * Clones the layers from the original map, preserving properties such as visibility, opacity, and source.
   *
   * @param originalMap - The map from which to clone layers.
   *
   * @returns An array of cloned layers, which can be used to create a new map with the same layers.
   */
  private cloneLayers(originalMap: Map) {
    const clonedLayers =  originalMap
      .getLayers()
      .getArray()
      .map((layer) => {
        // Check the type of each layer and clone accordingly
        if (layer instanceof TileLayer) {
          return new TileLayer({
            source: layer.getSource(),
            opacity: layer.getOpacity(),
            visible: layer.getVisible(),
            zIndex: layer.getZIndex(),
          });
        } else if (layer instanceof VectorLayer) {
          return new VectorLayer({
            source: layer.getSource(),
            style: layer.getStyle(),
            opacity: layer.getOpacity(),
            visible: layer.getVisible(),
            zIndex: layer.getZIndex(),
          });
        }
        return null; // Return null if the layer type is unsupported
      })
      .filter((layer) => layer !== null); // Remove any null values from the final list of layers

      return clonedLayers;
  }
}
