import { Layer } from 'ol/layer';
import MVT from 'ol/format/MVT';
import VectorTileSource from 'ol/source/VectorTile';
import { Fill, Stroke, Style } from 'ol/style';
import VectorTileLayer from 'ol/layer/VectorTile';
import TileLoadEvent from 'ol/source/VectorTile';
import { Tile as TileEvent } from 'ol';

import { get as getProjection } from 'ol/proj';
import { getWidth } from 'ol/extent';
import TileGrid from 'ol/tilegrid/TileGrid';
import { Feature } from 'ol';
import { Polygon } from 'ol/geom';
import { environment } from '../../../../environment/environment';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class TilesTrajectoryService {
  private apiUrl = environment.apiUrl;
  constructor() {}

  getTrajectoryLayer(
    ready: boolean,
    zIndex: number,
    opacity: number,
    deviceID: string,
    date: string,
  ): Layer {
    var resolutions = [];
    var proj3857 = getProjection('EPSG:3857');
    var maxResolution = proj3857 ? getWidth(proj3857.getExtent()) / 512 : 0;

    for (var i = 0; i < 22; i++) {
      resolutions[i] = maxResolution / Math.pow(2, i);
    }

    var tileGrid = new TileGrid({
      extent: getProjection('EPSG:3857')?.getExtent(),
      resolutions: resolutions,
      tileSize: 512,
    });

    var urlZone: string = '';

    if (deviceID && date) {
      const zonePart = `${deviceID}/${date}/{z}/{x}/{y}`;
      urlZone = `${this.apiUrl}/api/devices/itinerary/${zonePart}`;
    } else {
      urlZone = '';
    }

    var trajectorySource = new VectorTileSource({
      format: new MVT(),
      url: urlZone,
      tileGrid: tileGrid,
      overlaps: false
    });


    const dynamicStyle = () => {
      const color = '#ef381e'; 
      return new Style({
        stroke: new Stroke({
          color: color,
          width: 5
        }),
        fill: ready ? new Fill({ color: color }) : undefined,
      });
    };

    var vectorTile = new VectorTileLayer({
      background: 'transparent',
      zIndex: zIndex,
      renderMode: 'hybrid',
      preload: 1,
      visible: true,
      declutter: true,
      source: trajectorySource,
      opacity: opacity,
      style: dynamicStyle,
    });

    return vectorTile;
  }

  private calculateArea(feature: Feature): string {
    const polygon = feature.getGeometry() as Polygon;
    const area = polygon.getArea();
    const areaKm2 = (area / 1e6).toFixed(2);
    return areaKm2;
  }
}
