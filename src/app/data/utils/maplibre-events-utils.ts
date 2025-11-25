import { MapEventType, MapLayerEventType } from "maplibre-gl";
import { Observable, Subscriber } from "rxjs";

export type Pick = MapEventType & MapLayerEventType
    
export class MapLibreEvent{

  
  fromMapLibreEvent<T extends keyof MapLayerEventType>(
    map: any, 
    type: T, 
    layer: string, 
  ):Observable<MapLayerEventType[T] & Object>
  
  fromMapLibreEvent<T extends keyof MapEventType>(
    map: any, 
    type: T, 
    layer?: string, 
  ):Observable<MapEventType[T] & Object>


  fromMapLibreEvent<T extends keyof  Pick> (
    map: any, 
    type: T, 
    layer?: string, 
  ):Observable<Pick[T]  & Object>  {

    

    if ( layer ) {
      return new Observable((observer: Subscriber<Pick[T] & Object >) => {
        const handler = (e: Pick[T] & Object) => observer.next(e);
        map.on(type,layer, handler);
        return () => {
          map.off(type,layer, handler);
        };
      });
    }else{
      return new Observable((observer: Subscriber<Pick[T] & Object >) => {
        const handler = (e: Pick[T] & Object) => observer.next(e);
        map.on(type, handler);
        return () => {
          map.off(type, handler);
        };
      });
    }
    
  }
  
}

