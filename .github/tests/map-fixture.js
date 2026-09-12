// Local browser regression fixture, not a replacement production map.
(() => {
  class Base {
    constructor(options={}){this.options=options;this.listeners={};}
    addListener(name,fn){(this.listeners[name]??=[]).push(fn);return {remove:()=>this.listeners[name]=this.listeners[name].filter(x=>x!==fn)};}
    setMap(map){this.options.map=map;} getMap(){return this.options.map;}
    setOptions(options){Object.assign(this.options,options);} setVisible(value){this.options.visible=value;}
    setIcon(){} setLabel(){} setAnimation(){} setTitle(){} setZIndex(){}
    getPosition(){return new LatLng(this.options.position||{lat:0,lng:0});}
    getPath(){return {getArray:()=>this.options.paths||[]};}
  }
  class LatLng {
    constructor(lat,lng){this.latitude=typeof lat==='object'?lat.lat:lat;this.longitude=typeof lat==='object'?lat.lng:lng;}
    lat(){return this.latitude;} lng(){return this.longitude;}
    toJSON(){return {lat:this.lat(),lng:this.lng()};}
  }
  class Bounds {
    constructor(){this.points=[];} extend(p){this.points.push(p);return this;}
    contains(){return true;} getCenter(){return new LatLng(-29,24);}
    getNorthEast(){return new LatLng(-22,33);} getSouthWest(){return new LatLng(-35,16);}
  }
  const event={
    addListener:(object,name,fn)=>object.addListener(name,fn),
    addListenerOnce:(object,name,fn)=>{const l=object.addListener(name,()=>{l.remove();fn();});return l;},
    removeListener:l=>l?.remove(),
    trigger:(object,name,...args)=>[...(object.listeners?.[name]||[])].forEach(fn=>fn(...args))
  };
  class MapFixture extends Base {
    constructor(element,options){super(options);this.element=element;this.data=new Data();this.options.zoom=5;
      const surface=document.createElement('div');surface.setAttribute('role','region');surface.setAttribute('aria-label','Map test fixture');surface.style.cssText='width:100%;height:100%;background:#183640';element.appendChild(surface);
      setTimeout(()=>{event.trigger(this,'idle');event.trigger(this,'tilesloaded');},150);
    }
    getZoom(){return this.options.zoom;} setZoom(zoom){this.options.zoom=zoom;}
    getCenter(){return new LatLng(this.options.center);} setCenter(center){this.options.center=center;}
    getBounds(){return new Bounds();} fitBounds(){} panTo(center){this.setCenter(center);}
    getMapTypeId(){return this.options.mapTypeId;} setMapTypeId(type){this.options.mapTypeId=type;}
    getDiv(){return this.element;}
  }
  class Data extends Base {setStyle(){} addGeoJson(){return [];} forEach(){} loadGeoJson(url,options,callback){callback?.([]);}}
  window.google={maps:{Map:MapFixture,Marker:Base,Polygon:Base,Polyline:Base,Data,LatLng,LatLngBounds:Bounds,event,SymbolPath:{CIRCLE:0,FORWARD_CLOSED_ARROW:1},Animation:{BOUNCE:1}}};
})();
