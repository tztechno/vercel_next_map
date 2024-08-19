import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

const Map = dynamic(() => import('../components/Map'), { ssr: false });

const Home = () => {
    return (
        <div>
            <p>Current Location</p>
            <Map />
        </div>
    );
};

export default Home;
