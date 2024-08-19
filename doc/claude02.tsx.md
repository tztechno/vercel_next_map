import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// デフォルトアイコンを指定
const defaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet/dist/images/marker-icon.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34]
});

const Map = () => {
    const mapRef = useRef<HTMLDivElement>(null);
    const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
    const [marker, setMarker] = useState<L.Marker | null>(null);
    const [watchId, setWatchId] = useState<number | null>(null);
    const [currentPosition, setCurrentPosition] = useState<{ lat: number, lon: number } | null>(null);
    const [polygonPoints, setPolygonPoints] = useState<L.LatLng[]>([]);
    const [polygon, setPolygon] = useState<L.Polygon | null>(null);
    const [isCreatingPolygon, setIsCreatingPolygon] = useState<boolean>(false);
    const [isCreatingLocation, setIsCreatingLocation] = useState<boolean>(false);
    const [isCreatingRoute, setIsCreatingRoute] = useState<boolean>(false);
    const [isPopupVisible, setIsPopupVisible] = useState<boolean>(false);
    const [region, setRegion] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [locationPoint, setLocationPoint] = useState<L.LatLng | null>(null);
    const [routePoints, setRoutePoints] = useState<L.LatLng[]>([]);
    const [route, setRoute] = useState<L.Polyline | null>(null);

    useEffect(() => {
        if (!mapRef.current || mapInstance) return;

        const map = L.map(mapRef.current).setView([35.6895, 139.6917], 15);
        setMapInstance(map);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        const initialMarker = L.marker([35.6895, 139.6917], { icon: defaultIcon }).addTo(map);
        initialMarker.bindPopup("<b>Here!</b>").openPopup();
        setMarker(initialMarker);

        const handleSuccess = (position: GeolocationPosition) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            setCurrentPosition({ lat, lon });

            if (marker) {
                marker.setLatLng([lat, lon]);
                map.setView([lat, lon], 15);
            }
        };

        const handleError = (error: GeolocationPositionError) => {
            console.error("Geolocation error:", error.message);
        };

        const id = navigator.geolocation.watchPosition(handleSuccess, handleError, {
            enableHighAccuracy: true,
            timeout: 20000,
            maximumAge: 2000
        });
        setWatchId(id);

        return () => {
            if (id !== null) {
                navigator.geolocation.clearWatch(id);
            }
            map.remove();
        };
    }, []);

    useEffect(() => {
        if (!mapInstance) return;

        const handleMapClick = (e: L.LeafletMouseEvent) => {
            if (isCreatingPolygon) {
                const newPoints = [...polygonPoints, e.latlng];
                setPolygonPoints(newPoints);
                if (polygon) {
                    polygon.setLatLngs(newPoints);
                } else {
                    const newPolygon = L.polygon(newPoints, { color: 'blue' }).addTo(mapInstance);
                    setPolygon(newPolygon);
                }
            } else if (isCreatingLocation) {
                setLocationPoint(e.latlng);
                if (marker) {
                    marker.setLatLng(e.latlng);
                } else {
                    const newMarker = L.marker(e.latlng, { icon: defaultIcon }).addTo(mapInstance);
                    setMarker(newMarker);
                }
            } else if (isCreatingRoute) {
                const newPoints = [...routePoints, e.latlng];
                setRoutePoints(newPoints);
                if (route) {
                    route.setLatLngs(newPoints);
                } else {
                    const newRoute = L.polyline(newPoints, { color: 'red' }).addTo(mapInstance);
                    setRoute(newRoute);
                }
            }
        };

        mapInstance.on('click', handleMapClick);

        return () => {
            mapInstance.off('click', handleMapClick);
        };
    }, [mapInstance, isCreatingPolygon, polygon, polygonPoints, isCreatingLocation, isCreatingRoute, routePoints, route, marker]);

    const showCurrentLocation = () => {
        if (currentPosition && mapInstance) {
            const { lat, lon } = currentPosition;
            mapInstance.setView([lat, lon], 15);
            if (marker) {
                marker.setLatLng([lat, lon]);
                marker.bindPopup("<b>Your current location!</b>").openPopup();
            }
        }
    };

    const resetAll = () => {
        setPolygonPoints([]);
        if (polygon) {
            polygon.remove();
            setPolygon(null);
        }
        setLocationPoint(null);
        if (marker) {
            marker.remove();
            setMarker(null);
        }
        if (route) {
            route.remove();
            setRoute(null);
        }
        setRoutePoints([]);
        setIsCreatingPolygon(false);
        setIsCreatingLocation(false);
        setIsCreatingRoute(false);
    };

    const startCreatingPolygon = () => {
        resetAll();
        setIsCreatingPolygon(true);
    };

    const startCreatingLocation = () => {
        resetAll();
        setIsCreatingLocation(true);
    };

    const startCreatingRoute = () => {
        resetAll();
        setIsCreatingRoute(true);
    };

    // savePolygon, saveLocation, saveRoute, handleSave 関数は変更なし

    return (
        <>
            <div ref={mapRef} style={{ height: '700px', width: '100%' }}></div>
            <div style={{
                position: 'fixed', bottom: '10px', left: '10px', zIndex: 1000,
                display: 'flex', flexDirection: 'column', gap: '10px',
                backgroundColor: 'white', padding: '10px', borderRadius: '5px'
            }}>
                <button onClick={() => watchId !== null && navigator.geolocation.clearWatch(watchId)} style={{ marginBottom: '5px' }}>Stop Tracking</button>
                <button onClick={showCurrentLocation} style={{ marginBottom: '5px' }}>Show Current Location</button>
                <button onClick={startCreatingPolygon} style={{ marginBottom: '5px' }}>Create Polygon</button>
                <button onClick={startCreatingLocation} style={{ marginBottom: '5px' }}>Create Location</button>
                <button onClick={startCreatingRoute} style={{ marginBottom: '5px' }}>Create Route</button>
                <button onClick={savePolygon} style={{ marginBottom: '5px' }}>Save Polygon</button>
                <button onClick={saveLocation} style={{ marginBottom: '5px' }}>Save Location</button>
                <button onClick={saveRoute}>Save Route</button>
            </div>
            {/* ポップアップのコードは変更なし */}
        </>
    );
};

export default Map;