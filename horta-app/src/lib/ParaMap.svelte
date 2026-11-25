<script lang="ts">
  import { onMount } from 'svelte';
  import 'leaflet/dist/leaflet.css';
  import { PARA_PRESETS } from './geo';
  import paraGeoJson from './data/para.json';

  let {
    lat,
    lon,
    label = '',
    onSelect,
  }: {
    lat: number;
    lon: number;
    label?: string;
    onSelect: (lat: number, lon: number, label?: string) => void;
  } = $props();

  let mapEl: HTMLDivElement;
  let map: import('leaflet').Map | null = null;
  let pinMarker: import('leaflet').Marker | null = null;
  let isOnline = $state(typeof navigator !== 'undefined' ? navigator.onLine : true);
  let lastAction = $state('Click anywhere or drag the red pin');

  function makePinIcon(L: typeof import('leaflet')) {
    return L.divIcon({
      className: '',
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      html: `
        <div style="
          width: 24px; height: 24px; border-radius: 50%;
          background: #d32f2f; border: 3px solid #ffffff;
          box-shadow: 0 2px 8px rgba(0,0,0,0.45);
          cursor: grab;
        "></div>
      `,
    });
  }

  onMount(async () => {
    const L = await import('leaflet');

    const updateNet = () => {
      isOnline = navigator.onLine;
    };
    window.addEventListener('online', updateNet);
    window.addEventListener('offline', updateNet);

    map = L.map(mapEl, {
      center: [lat, lon],
      zoom: 6,
      minZoom: 4,
      maxZoom: 18,
    });

    const satellite = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { attribution: 'Tiles © Esri' }
    );

    const street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
    });

    satellite.addTo(map);
    L.control.layers({ Satellite: satellite, 'Street Map': street }).addTo(map);

    // Real IBGE Pará boundary (100% offline from src/lib/data/para.json)
    const paraLayer = L.geoJSON(paraGeoJson as any, {
      style: {
        color: '#66bb6a',
        weight: 2.5,
        fillColor: '#66bb6a',
        fillOpacity: 0.08,
      },
      interactive: false,
    }).addTo(map);

    // Frame Pará cleanly on initial load
    const bounds = paraLayer.getBounds();
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [16, 16] });
    }

    // Clickable preset city dots
    for (const p of PARA_PRESETS) {
      L.circleMarker([p.lat, p.lon], {
        radius: 6,
        color: '#ffffff',
        weight: 2,
        fillColor: '#2e7d32',
        fillOpacity: 0.95,
      })
        .addTo(map)
        .bindTooltip(p.name, { direction: 'top', offset: [0, -6] })
        .on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          lastAction = `Selected ${p.name}`;
          onSelect(p.lat, p.lon, p.name);
        });
    }

    // Draggable active pin
    pinMarker = L.marker([lat, lon], {
      draggable: true,
      icon: makePinIcon(L),
    }).addTo(map);

    pinMarker.on('dragstart', () => {
      lastAction = 'Dragging pin...';
    });

    pinMarker.on('drag', () => {
      if (!pinMarker) return;
      const pos = pinMarker.getLatLng();
      lastAction = `Pin at ${pos.lat.toFixed(2)},${pos.lng.toFixed(2)}`;
    });

    pinMarker.on('dragend', () => {
      if (!pinMarker) return;
      const pos = pinMarker.getLatLng();
      lastAction = `Dropped pin at ${pos.lat.toFixed(2)},${pos.lng.toFixed(2)}`;
      onSelect(pos.lat, pos.lng);
    });

    // Click anywhere on map to move pin immediately
    map.on('click', (e) => {
      const { lat: clat, lng: clon } = e.latlng;
      pinMarker?.setLatLng([clat, clon]);
      lastAction = `Moved pin to ${clat.toFixed(2)}, ${clon.toFixed(2)}`; onSelect(clat, clon); });  return () => { window.removeEventListener('online', updateNet); window.removeEventListener('offline', updateNet); map?.remove(); map = null; pinMarker = null; }; });  // Sync pin & zoom in when lat/lon updates from GPS, presets, or manual inputs $effect(() => { if (pinMarker && map) { const cur = pinMarker.getLatLng(); if (Math.abs(cur.lat - lat) > 1e-4 \vert{}\vert{} Math.abs(cur.lng - lon) > 1e-4) { pinMarker.setLatLng([lat, lon]); map.setView([lat, lon], Math.max(map.getZoom(), 9), { animate: true }); } } }); </script>  <div style="border: 1px solid #ccc; border-radius: 8px; overflow: hidden; background: #1f2924;"> <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; padding: 0.45rem 0.75rem; background: #f3f6f4; border-bottom: 1px solid #ddd; font-size: 0.8rem;"> <span> <strong style="color: {isOnline ? '#1b5e20' : '#b26a00'};"> {isOnline ? '● Online (Tiles active)' : '◐ Offline Mode (Pará border & data active)'} </strong> — {lastAction} </span> <span style="font-family: monospace; color: #333;"> {lat.toFixed(2)}, {lon.toFixed(2)} </span> </div>  <div bind:this={mapEl} style="width: 100\%; height: 420px; z-index: 0;"></div>  <div style="padding: 0.45rem 0.75rem; font-size: 0.8rem; color: #444; background: #fff;"> <strong>Red pin:</strong> drag or click map • <strong>Green dots:</strong> Pará hubs • <strong>Green border:</strong> Pará state{label ? ` • Active: ${label}` : ''}
  </div>
</div>