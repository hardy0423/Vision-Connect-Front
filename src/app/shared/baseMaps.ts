import Map from 'ol/Map';
import { getWidth } from 'ol/extent';
import { Layer } from 'ol/layer';
import TileLayer from 'ol/layer/Tile';
import { get as getProjection } from 'ol/proj';
import { TileJSON, WMTS, XYZ } from 'ol/source';
import WMTSTileGrid from 'ol/tilegrid/WMTS';
import { environment } from '../../environment/environment';

export class BaseMaps {
  constructor() {}

  getIgnLayer(map: Map): Layer {
    var resolutions = [];
    var matrixIds = [];
    var proj3857 = getProjection('EPSG:3857');
    var maxResolution = proj3857 ? getWidth(proj3857.getExtent()) / 256 : 0;

    for (var i = 0; i < 22; i++) {
      matrixIds[i] = i.toString();
      resolutions[i] = maxResolution / Math.pow(2, i);
    }

    var tileGrid = new WMTSTileGrid({
      origin: [-20037508, 20037508],
      resolutions: resolutions,
      matrixIds: matrixIds,
      tileSize: 256,
    });

    var ign_source = new WMTS({
      url: 'https://wxs.ign.fr/pratique/geoportail/wmts',
      layer: 'ORTHOIMAGERY.ORTHOPHOTOS',
      matrixSet: 'PM',
      format: 'image/jpeg',
      projection: 'EPSG:3857',
      tileGrid: tileGrid,
      style: 'normal',
      crossOrigin: 'anonymous',
    });

    var ign = new TileLayer({
      source: ign_source,
      maxZoom: 22,
      minResolution: map.getView().getResolutionForZoom(22),
    });

    return ign;
  }

  getRasterMapTilerLayer() {
    var source = new TileJSON({
      url: `https://api.maptiler.com/maps/streets-v2/256/tiles.json?key=${environment.maptilerKey}`,
      crossOrigin: 'anonymous',
    });

    var layer = new TileLayer({
      source: source,
      opacity: 1,
      zIndex: 0,
      preload: Infinity,
    });

    return layer;
  }

  getSatelliteBaseMap() {
    var source = new TileJSON({
      url: `https://api.maptiler.com/maps/hybrid/tiles.json?key=${environment.maptilerKey}`,
      tileSize: 256,
      crossOrigin: 'anonymous',
      wrapX: false,
      transition: 0,
    });

    var layer = new TileLayer({
      source: source,
      opacity: 1,
      zIndex: 0,
      preload: Infinity,
    });

    return layer;
  }

  getGoogleBaseMap() {
    var source = new XYZ({
      url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
      crossOrigin: 'anonymous',
    });

    var layer = new TileLayer({
      source: source,
      opacity: 1,
      zIndex: 0,
      preload: Infinity,
    });

    return layer;
  }
}
