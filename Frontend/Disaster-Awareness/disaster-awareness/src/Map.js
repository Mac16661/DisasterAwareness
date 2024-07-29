import React, { useEffect, useRef, useState } from "react";
import H from "@here/maps-api-for-javascript";
import Pusher from "pusher-js";

const pusher = new Pusher(process.env.REACT_APP_API_KEY_PUSHER, {
  cluster: process.env.REACT_APP_CLUSTER,
});

function getMarkerIcon(color, text) {
  const svgCircle = `<svg width="40" height="40" version="1.1" xmlns="http://www.w3.org/2000/svg">
  <!-- Circle representing the disaster-prone location -->
  <circle cx="20" cy="20" r="15" fill="#FF6340" stroke="#FF0000" stroke-width="2" />

  <!-- Exclamation mark symbol -->
  <text x="15" y="23" font-family="Arial, sans-serif" font-size="15" fill="#f5b114">&#9888;</text>
</svg>
`;

  return new H.map.Icon(svgCircle, {
    anchor: {
      x: 10,
      y: 10,
    },
  });
}

const Map = (props) => {
  const mapRef = useRef(null);
  const map = useRef(null);
  const platform = useRef(null);
  const { apikey } = props;

  let newMap;

  useEffect(
    () => {
      var channel = pusher.subscribe("SOS-channel");
      channel.bind("disaster", function (data) {
        if (!newMap) return;

        newMap.addObject(
          new H.map.Marker(data.location, {
            icon: getMarkerIcon("red", data.text),
          })
        );

        newMap.setCenter(new H.geo.Point(data.location.lat, data.location.lng));
        newMap.setZoom(10, true);
      });

      // Check if the map object has already been created
      if (!map.current) {
        // Create a platform object with the API key
        platform.current = new H.service.Platform({ apikey });
        // Create a new Raster Tile service instance
        const rasterTileService = platform.current.getRasterTileService({
          queryParams: {
            style: "explore.night",
            size: 256,
          },
        });
        // Creates a new instance of the H.service.rasterTile.Provider class
        // The class provides raster tiles for a given tile layer ID and pixel format
        const rasterTileProvider = new H.service.rasterTile.Provider(
          rasterTileService
        );
        // Create a new Tile layer with the Raster Tile provider
        const rasterTileLayer = new H.map.layer.TileLayer(rasterTileProvider);
        // Create a new map instance with the Tile layer, center and zoom level
        newMap = new H.Map(mapRef.current, rasterTileLayer, {
          pixelRatio: window.devicePixelRatio || 1,
          center: {
            lat: 64.144,
            lng: -21.94,
          },
          zoom: 2.5,
        });

        // Add panning and zooming behavior to the map
        const behavior = new H.mapevents.Behavior(
          new H.mapevents.MapEvents(newMap)
        );

        // Set the map object to the reference
        map.current = newMap;
      }
    },
    // Dependencies array
    [apikey]
  );

  // Return a div element to hold the map
  return (
    <div
      style={{ width: "100%", height: `${window.innerHeight}px` }}
      ref={mapRef}
    />
  );
};

export default Map;
