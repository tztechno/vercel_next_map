import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// デフォルトアイコンを指定
const defaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet/dist/images/marker-icon.png',
    iconSize: [25, 41], // アイコンのサイズ
    iconAnchor: [12, 41], // アイコンのアンカー位置
    popupAnchor: [1, -34] // ポップアップのアンカー位置
});

const Map = () => {
    const mapRef = useRef<HTMLDivElement>(null);
    const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
    const [marker, setMarker] = useState<L.Marker | null>(null);
    const [watchId, setWatchId] = useState<number | null>(null);
    const [currentPosition, setCurrentPosition] = useState<{ lat: number, lon: number } | null>(null);

    useEffect(() => {
        if (!mapRef.current) return;

        // 地図がすでに初期化されている場合はスキップ
        if (mapInstance === null) {
            const map = L.map(mapRef.current).setView([35.6895, 139.6917], 15); // 初期位置を東京に設定
            setMapInstance(map);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(map);

            const initialMarker = L.marker([35.6895, 139.6917], { icon: defaultIcon }).addTo(map);
            initialMarker.bindPopup("<b>Click Move Buttton!</b>").openPopup();
            setMarker(initialMarker);

            const handleSuccess = (position: GeolocationPosition) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;

                setCurrentPosition({ lat, lon });

                if (marker) {
                    marker.setLatLng([lat, lon]);
                    map.setView([lat, lon], 15); // 現在地を地図の中心に設定
                }
            };

            const handleError = (error: GeolocationPositionError) => {
                alert(error.message);
            };

            const id = navigator.geolocation.watchPosition(handleSuccess, handleError, {
                enableHighAccuracy: true,
                timeout: 20000,
                maximumAge: 2000
            });
            setWatchId(id);
        }

        return () => {
            if (watchId !== null) {
                navigator.geolocation.clearWatch(watchId);
            }
            if (mapInstance !== null) {
                mapInstance.remove();
            }
        };
    }, [mapInstance, marker, watchId]);

    const showCurrentLocation = () => {
        if (currentPosition && mapInstance) {
            const { lat, lon } = currentPosition;
            mapInstance.setView([lat, lon], 15);
            if (marker) {
                marker.setLatLng([lat, lon]);
                marker.bindPopup("<b>Here!</b>").openPopup();
            }
        }
    };

    return (
        <>
            <div ref={mapRef} id="map" style={{ height: '700px', width: '100%' }}></div>
            <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 1000 }}>
                <button onClick={() => watchId !== null && navigator.geolocation.clearWatch(watchId)} style={{ marginRight: '10px' }}>Stop Tracking</button>
                <button onClick={showCurrentLocation}>Move to Current Location</button>
            </div>
        </>
    );
};

export default Map;
