import { Layer } from 'ol/layer';
import MVT from 'ol/format/MVT';
import VectorTileSource from 'ol/source/VectorTile';
import { Fill, Stroke, Style } from 'ol/style';
import VectorTileLayer from 'ol/layer/VectorTile';

import { get as getProjection } from 'ol/proj';
import { getWidth } from 'ol/extent';
import TileGrid from 'ol/tilegrid/TileGrid';
import { Feature } from 'ol';
import { Polygon } from 'ol/geom';
import { environment } from '../../../../environment/environment';
import LayerGroup from 'ol/layer/Group';

export class TilesInterventionZoneService {
  private apiUrl = environment.apiUrl;
  constructor() {}

  getInterventionZoneLayer(
    ready: boolean,
    zIndex: number,
    opacity: number,
    zoneID: string
  ): Layer {
    var resolutions = [];

    var vectorTile = new VectorTileLayer({
      source: new VectorTileSource({ tileGrid: undefined }),
    });
    var assemblySource = new VectorTileSource({ tileGrid: undefined });

    // Get the projection for EPSG:3857 (Web Mercator projection)
    var proj3857 = getProjection('EPSG:3857');
    // Calculate the max resolution based on the projection
    var maxResolution = proj3857 ? getWidth(proj3857.getExtent()) / 512 : 0;

    // Calculate the resolutions for each zoom level (22 levels in total)
    for (var i = 0; i < 22; i++) {
      resolutions[i] = maxResolution / Math.pow(2, i);
    }

    // Define the tile grid with extent, resolutions, and tile size
    var tileGrid = new TileGrid({
      extent: getProjection('EPSG:3857')?.getExtent(),
      resolutions: resolutions,
      tileSize: 512,
    });

    // Prepare the URL for fetching tiles based on the provided zoneID
    var urlZone: string = '';
    if (zoneID) {
      const zonePart = `${zoneID}/{z}/{x}/{y}`;
      // If zoneID is valid, set the URL to fetch the tiles
      urlZone = `${this.apiUrl}/api/map/at-zone/tiles/${zonePart}`;
    } else {
      // If zoneID is invalid, set the URL to an empty string
      urlZone = '';
    }

    // Create the source for the vector tile layer with the MVT format and tile grid
    assemblySource = new VectorTileSource({
      format: new MVT(), // Format for vector tiles
      url: urlZone, // URL for fetching the tiles
      tileGrid: tileGrid, // Tile grid settings
      overlaps: false,
    });


    const dynamicStyle = (feature: any) => {
      const color = '#5d7ee8';
      return new Style({
        stroke: new Stroke({ color: color }),
        fill: ready ? new Fill({ color: color }) : undefined,
      });
    };

    // Create the vector tile layer with the specified properties
    vectorTile = new VectorTileLayer({
      background: 'transparent', 
      zIndex: zIndex,
      renderMode: 'hybrid', 
      preload: 1, // Preload one tile for better performance
      visible: true,
      declutter: true, // Avoid overlapping features in the layer
      source: assemblySource, // Set the data source for the layer
      opacity: opacity,
      style: dynamicStyle, // Apply the dynamic style to the layer
    });

    return vectorTile;
  }

  private getRandomColor(): string {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  private calculateArea(feature: Feature): string {
    const polygon = feature.getGeometry() as Polygon;
    const area = polygon.getArea();
    const areaKm2 = (area / 1e6).toFixed(2);
    return areaKm2;
  }
}
