import { motion, AnimatePresence } from "framer-motion";
import React, { useState, useEffect, useCallback } from "react";
import mapboxgl from 'mapbox-gl';
import * as turf from '@turf/turf';
import 'mapbox-gl/dist/mapbox-gl.css';

interface School {
    type: string;
    geometry: {
        type: string;
        coordinates: [number, number];
    };
    properties: {
        "School Name"?: string;
        "school_name"?: string;
        "Address"?: string;
    };
}

interface SchoolsData {
    type: string;
    features: School[];
}

// Mapbox access token
mapboxgl.accessToken = 'YOUR_MAPBOX_TOKEN';

export default function SearchMap() {
// ... rest of the code stays the same ...
}