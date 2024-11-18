"use client";

import * as React from "react";
import { useGoogleMaps } from "@/hooks/use-google-map";

type Point = {
	lat: number;
	lng: number;
};
type MapPickerProps = {
	selected: Point | undefined;
	onSelectedChange: (selected: Point) => void;
};

export const MapPicker = ({ selected, onSelectedChange }: MapPickerProps) => {
	const { loader } = useGoogleMaps();
	const mapRef = React.useRef<HTMLDivElement>(null);
	const markerRef = React.useRef<google.maps.Marker | null>(null);

	React.useEffect(() => {
		if (loader) {
			loader?.load()?.then((google) => {
				const defaultCenter = { lat: 24.7136, lng: 46.6753 }; // Default to Riyadh, Saudi Arabia

				const initMap = (center: Point) => {
					const map = new google.maps.Map(mapRef.current as HTMLDivElement, {
						center,
						zoom: 12,
					});

					if (selected) {
						const marker = new google.maps.Marker({
							position: selected,
							map,
						});
						markerRef.current = marker;
					}

					map.addListener("click", (e: { latLng: google.maps.LatLng | null }) => {
						if (markerRef.current) markerRef.current.setMap(null);

						const geocoder = new google.maps.Geocoder();
						geocoder.geocode({ location: e.latLng }, (results, status) => {
							if (status === "OK" && results![0]) {
								onSelectedChange({ lat: e?.["latLng"]?.lat()!, lng: e?.["latLng"]?.lng()! });

								const marker = new google.maps.Marker({
									position: e.latLng,
									map,
								});
								markerRef.current = marker;
							}
						});
					});
				};

				// Attempt to fetch user's current location
				if ("geolocation" in navigator) {
					navigator.geolocation.getCurrentPosition(
						(position) => {
							// User's location is obtained successfully
							initMap({
								lat: position.coords.latitude,
								lng: position.coords.longitude,
							});
						},
						() => {
							// Fallback to default if geolocation fails or is denied
							initMap(defaultCenter);
						},
					);
				} else {
					// Geolocation isn't available or failed, use default
					initMap(defaultCenter);
				}
			});
		}
	}, [loader, selected, onSelectedChange]);

	return <div ref={mapRef} style={{ height: "400px", width: "100%" }} />;
};
