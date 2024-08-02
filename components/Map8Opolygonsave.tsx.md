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
    const [polygonPoints, setPolygonPoints] = useState<L.LatLng[]>([]);
    const [polygon, setPolygon] = useState<L.Polygon | null>(null);
    const [isCreatingPolygon, setIsCreatingPolygon] = useState<boolean>(false);
    const [isPopupVisible, setIsPopupVisible] = useState<boolean>(false);
    const [region, setRegion] = useState<string>('');
    const [description, setDescription] = useState<string>('');

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
            initialMarker.bindPopup("<b>Here!</b>").openPopup();
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

    useEffect(() => {
        if (mapInstance && isCreatingPolygon) {
            const handleMapClick = (e: L.LeafletMouseEvent) => {
                const newPoints = [...polygonPoints, e.latlng];
                setPolygonPoints(newPoints);

                if (polygon) {
                    polygon.setLatLngs(newPoints);
                } else {
                    const newPolygon = L.polygon(newPoints, { color: 'blue' }).addTo(mapInstance);
                    setPolygon(newPolygon);
                }
            };

            mapInstance.on('click', handleMapClick);

            return () => {
                mapInstance.off('click', handleMapClick);
            };
        }
    }, [mapInstance, isCreatingPolygon, polygon, polygonPoints]);

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

    const savePolygon = () => {
        if (polygonPoints.length > 2) {
            setIsPopupVisible(true);
        } else {
            alert("ポリゴンを作成するには少なくとも3つのポイントが必要です。");
        }
    };

    const handleSave = () => {
        const wkt = `"POLYGON ((${polygonPoints.map(p => `${p.lng} ${p.lat}`).join(', ')}))"`;

        const polygonData = `${wkt},${region},${description}`;
        const blob = new Blob([polygonData], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `polygon_${region}.csv`;
        a.click();
        URL.revokeObjectURL(url);

        // ポップアップを閉じる
        setIsPopupVisible(false);
        resetPolygon();
    };

    const startCreatingPolygon = () => {
        resetPolygon();
        setIsCreatingPolygon(true);
    };

    const resetPolygon = () => {
        setPolygonPoints([]);
        if (polygon) {
            polygon.remove();
            setPolygon(null);
        }
        setIsCreatingPolygon(false);
    };

    return (
        <>
            <div ref={mapRef} id="map" style={{ height: '700px', width: '100%' }}></div>
            <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 1000 }}>
                <button onClick={() => watchId !== null && navigator.geolocation.clearWatch(watchId)} style={{ marginRight: '10px' }}>Stop Tracking</button>
                <button onClick={showCurrentLocation} style={{ marginRight: '10px' }}>Show Current Location</button>
                <button onClick={startCreatingPolygon} style={{ marginRight: '10px' }}>Create Polygon</button>
                <button onClick={resetPolygon} style={{ marginRight: '10px' }}>Reset</button>
                <button onClick={savePolygon}>Save Polygon</button>
            </div>
            {isPopupVisible && (
                <div id="popup" style={{
                    position: 'absolute', top: '10px', left: '10px',
                    backgroundColor: 'white', padding: '20px', zIndex: 2000, border: '1px solid black'
                }}>
                    <h2>Polygon Information</h2>
                    <div>
                        <label>
                            Region:
                            <input type="text" value={region} onChange={(e) => setRegion(e.target.value)} />
                        </label>
                    </div>
                    <div>
                        <label>
                            Description:
                            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} />
                        </label>
                    </div>
                    <button onClick={handleSave}>Save</button>
                </div>
            )}
        </>
    );
};

export default Map;
