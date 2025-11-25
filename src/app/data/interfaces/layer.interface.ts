import { StyleFunction, StyleLike } from "ol/style/Style";
import { BehaviorSubject } from "rxjs";
import Style from 'ol/style/Style';
import VectorLayer from "ol/layer/Vector";
import { Feature } from 'ol';
import VectorSource from 'ol/source/Vector.js';
import Geometry from 'ol/geom/Geometry';

export interface DataForLegend {
    style: Style;
    title: string;
    checked: boolean;
    alias: string;
    geomType: "polygon" | "point" | "linestring";
    img: string;
  }


export interface LayerToDigitalise {
    nom: string;
    canBeDelete: boolean;
    canBeAdd: boolean;
    canBeUpdate: boolean;
    style: StyleFunction;
    legend: BehaviorSubject<Array<DataForLegend>>;
    typologie: string;
    selectedFeature: Feature;
    layer: VectorLayer<VectorSource<Feature>>;
    layer_id: number;
    geometryCanBeEditByOthers: boolean;
  }


//   export interface FeatureForSheet extends Feature {
//     provider_style_id: number;
//     provider_vector_id: number;
//     epsg: number;
//     geometry_type: string;
//     primary_key_field: string;
//     typeDescriptiveSheet: "osm" | "custom";
//     couche: CatalogueLayer;
//     feature_display:string
//   }