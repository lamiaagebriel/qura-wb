"use client";

import * as React from "react";
import { useFormContext } from "react-hook-form";
import { useGoogleMaps } from "@/hooks/use-google-map";

export type MapProps = {
	point?: {
		lat: number;
		lng: number;
	};
};
// export function Map({ point }: MapProps) {
//   const { loader } = useGoogleMaps();
//   const mapRef = React.useRef<HTMLDivElement>(null);

//   React.useEffect(() => {
//     if (loader) {
//       loader?.load()?.then((google) => {
//         const fullAddress = `${distinct}, ${city}, ${country}`;
//         const map = new google.maps.Map(mapRef.current as HTMLDivElement, {
//           center: { lat: -34.397, lng: 150.644 },
//           zoom: 13,
//         });

//         const geocoder = new google.maps.Geocoder();
//         geocoder.geocode({ address: fullAddress }, (results, status) => {
//           if (status === "OK" && results![0]) {
//             const position = results![0].geometry.location;

//             map.setCenter(position);
//             new google.maps.Marker({
//               map,
//               position,
//               title: fullAddress, // Tooltip for the marker
//             });
//           } else {
//             console.error(
//               "Geocode was not successful for the following reason: " + status
//             );
//           }
//         });
//       });
//     }
//   }, [loader, point]); // Reinitialize the map if location props change

//   return <div ref={mapRef} className="h-60 w-full bg-muted"></div>;
// }
