import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';

// デフォルトアイコンを指定
const defaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet/dist/images/marker-icon.png', // 完全なURLを使用
    iconSize: [25, 41], // アイコンのサイズ
    iconAnchor: [12, 41], // アイコンのアンカー位置
    popupAnchor: [1, -34] // ポップアップのアンカー位置
});

const Map = () => {
    const mapRef = useRef<HTMLDivElement>(null);
    const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
    const [marker, setMarker] = useState<L.Marker | null>(null);
    const [watchId, setWatchId] = useState<number | null>(null);
    const [num, setNum] = useState(0);

    useEffect(() => {
        if (!mapRef.current) return;

        // 地図がすでに初期化されている場合はスキップ
        if (mapInstance === null) {
            const map = L.map(mapRef.current).setView([35.6895, 139.6917], 15); // 初期位置を東京に設定
            setMapInstance(map);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(map);

            const newMarker = L.marker([35.6895, 139.6917], { icon: defaultIcon }).addTo(map);
            newMarker.bindPopup("<b>Here!</b>").openPopup();
            setMarker(newMarker);
        }

        const handleSuccess = (position: GeolocationPosition) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            const geoText = `
                緯度: ${lat}
                経度: ${lon}
                高度: ${position.coords.altitude}
                位置精度: ${position.coords.accuracy}
                高度精度: ${position.coords.altitudeAccuracy}
                移動方向: ${position.coords.heading}
                速度: ${position.coords.speed}
                取得時刻: ${new Date(position.timestamp).toLocaleString()}
                取得回数: ${num + 1}
            `;

            document.getElementById('position_view')!.innerText = geoText;

            if (marker) {
                marker.setLatLng([lat, lon]);
            }

            if (mapInstance) {
                mapInstance.setView([lat, lon], 15); // 現在地を地図の中心に設定
            }

            setNum(num + 1);
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

        return () => {
            if (watchId !== null) {
                navigator.geolocation.clearWatch(watchId);
            }
            // mapInstanceを削除する代わりに、マップの状態をリセットする
            if (mapInstance !== null) {
                mapInstance.eachLayer((layer) => {
                    if (layer instanceof L.Marker) {
                        mapInstance.removeLayer(layer);
                    }
                });
            }
        };
    }, [mapInstance, marker, num, watchId]);

    return (
        <>
            <div ref={mapRef} id="map" style={{ height: '700px', width: '100%' }}></div>
            <div id="position_view"></div>
            <button onClick={() => watchId !== null && navigator.geolocation.clearWatch(watchId)}>Stop Tracking</button>
        </>
    );
};

export default Map;
