import TileLayer from "ol/layer/Tile";

export interface ZoneData {
    type: string;
    geometry: {
      type: string;
      coordinates: number[][][];
    };
    properties: {
      Name: string;
      nameZone: string;
    };
  }
  

export interface IntervetionZoneList {
    geom: {
      type: string;
      coordinates: number[][][];
    };
    nameZone: string;
    uid: string;
  }

  export interface ImageOptions {
    nom: string;
    print_id: string;
    id: number;
    visible: boolean;
    urlImage: string;
    source: TileLayer<any>;
  }
  