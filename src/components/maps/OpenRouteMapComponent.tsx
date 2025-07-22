import React, { useEffect, useRef, useState } from 'react';
import { PathResult, LatLng, Place } from '../../types';
import { MapPin, Navigation, Loader, ExternalLink } from 'lucide-react';

interface OpenRouteMapComponentProps {
  pathResult?: PathResult;
  startPlace?: Place;
  endPlace?: Place;
  center?: LatLng;
  className?: string;
}

const OpenRouteMapComponent: React.FC<OpenRouteMapComponentProps> = ({
  pathResult,
  startPlace,
  endPlace,
  center = { lat: 37.7749, lng: -122.4194 },
  className = "w-full h-64 sm:h-80 lg:h-96",
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  useEffect(() => {
    const initializeMap = async () => {
      if (!mapRef.current) return;

      try {
        setIsLoading(true);
        
        // Dynamically import Leaflet
        const L = await import('leaflet');
        
        // Import CSS
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);

        // Fix for default markers
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        });

        // Check if map container is already initialized
        if (mapRef.current._leaflet_id) {
          console.warn('Map container already initialized, skipping re-initialization.');
          setIsLoading(false);
          return;
        }

        const map = L.map(mapRef.current).setView([center.lat, center.lng], 13);

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        setMapInstance(map);
        setLeafletLoaded(true);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to initialize map:', error);
        setIsLoading(false);
      }
    };

    initializeMap();

    return () => {
      if (mapInstance) {
        mapInstance.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstance || !leafletLoaded) return;

    const updateMap = async () => {
      const L = await import('leaflet');
      
      // Clear existing layers
      mapInstance.eachLayer((layer: any) => {
        if (layer instanceof L.Marker || layer instanceof L.Polyline) {
          mapInstance.removeLayer(layer);
        }
      });

      const markers: any[] = [];

      try {
        // Add start marker
        if (startPlace) {
          const startMarker = L.marker([startPlace.location.lat, startPlace.location.lng], {
            icon: L.divIcon({
              className: 'custom-marker start-marker',
              html: '<div style="background-color: #22c55e; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center;"><span style="color: white; font-size: 12px; font-weight: bold;">S</span></div>',
              iconSize: [24, 24],
              iconAnchor: [12, 12]
            })
          }).addTo(mapInstance);
          
          startMarker.bindPopup(`<b>Start:</b> ${startPlace.name}`);
          markers.push(startMarker);
        }

        // Add end marker
        if (endPlace) {
          const endMarker = L.marker([endPlace.location.lat, endPlace.location.lng], {
            icon: L.divIcon({
              className: 'custom-marker end-marker',
              html: '<div style="background-color: #ef4444; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center;"><span style="color: white; font-size: 12px; font-weight: bold;">E</span></div>',
              iconSize: [24, 24],
              iconAnchor: [12, 12]
            })
          }).addTo(mapInstance);
          
          endMarker.bindPopup(`<b>End:</b> ${endPlace.name}`);
          markers.push(endMarker);
        }

        // Draw route if available
        if (pathResult?.polyline) {
          const coordinates = pathResult.polyline.split(';').map(coord => {
            const [lat, lng] = coord.split(',').map(Number);
            return [lat, lng] as [number, number];
          });

          if (coordinates.length > 1) {
            const polyline = L.polyline(coordinates, {
              color: '#3b82f6',
              weight: 4,
              opacity: 0.8
            }).addTo(mapInstance);

            // Fit map to show route and markers
            const group = L.featureGroup([polyline, ...markers]);
            mapInstance.fitBounds(group.getBounds(), { padding: [20, 20] });
          }
        } else if (markers.length > 0) {
          // If no route but have markers, fit to markers
          if (markers.length === 1) {
            mapInstance.setView([markers[0].getLatLng().lat, markers[0].getLatLng().lng], 13);
          } else {
            const group = L.featureGroup(markers);
            mapInstance.fitBounds(group.getBounds(), { padding: [50, 50] });
          }
        } else {
          // Default view
          mapInstance.setView([center.lat, center.lng], 13);
        }
      } catch (error) {
        console.error('Error updating map:', error);
      }
    };

    updateMap();
  }, [mapInstance, leafletLoaded, pathResult, startPlace, endPlace, center]);

  const openInOpenRouteService = () => {
    if (startPlace && endPlace) {
      const url = `https://maps.openrouteservice.org/directions?n1=${startPlace.location.lat},${startPlace.location.lng}&n2=${endPlace.location.lat},${endPlace.location.lng}`;
      window.open(url, '_blank');
    }
  };

  return (
    <div className={`${className} relative`}>
      {isLoading && (
        <div className="absolute inset-0 bg-slate-800 rounded-lg flex items-center justify-center z-10">
          <div className="text-center">
            <Loader className="h-8 w-8 text-blue-400 animate-spin mx-auto mb-2" />
            <p className="text-gray-300">Loading OpenStreetMap...</p>
          </div>
        </div>
      )}
      
      <div
        ref={mapRef}
        className={`${className} rounded-lg ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity`}
      />
      
      {pathResult && (
        <>
          <div className="absolute top-2 left-2 sm:top-4 sm:left-4 bg-slate-800/90 backdrop-blur-sm rounded-lg p-2 sm:p-3 text-white">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 text-xs sm:text-sm">
              <Navigation className="h-4 w-4 text-blue-400" />
              <div className="flex items-center space-x-2">
                <span>{pathResult.totalDistance} km</span>
                <span className="hidden sm:inline">•</span>
                <span>{pathResult.estimatedTime} min</span>
              </div>
              <span className="text-blue-400 text-xs">{pathResult.algorithm}</span>
            </div>
          </div>
          
          {startPlace && endPlace && (
            <button
              onClick={openInOpenRouteService}
              className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-slate-800/90 backdrop-blur-sm rounded-lg p-2 text-white hover:bg-slate-700/90 transition-colors"
              title="Open in OpenRouteService"
            >
              <ExternalLink className="h-4 w-4" />
            </button>
          )}
        </>
      )}

      {!pathResult && (startPlace || endPlace) && (
        <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 bg-slate-800/90 backdrop-blur-sm rounded-lg p-2 sm:p-3 text-white">
          <div className="flex items-center space-x-2 text-xs sm:text-sm">
            <MapPin className="h-4 w-4 text-blue-400" />
            <span>
              {startPlace && endPlace ? 'Ready to calculate route' : 
               startPlace ? 'Start location set' : 'End location set'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default OpenRouteMapComponent;