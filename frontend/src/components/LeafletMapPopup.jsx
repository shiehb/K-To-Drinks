"use client"

import { useState, useEffect, useRef } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png"
import markerIcon from "leaflet/dist/images/marker-icon.png"
import markerShadow from "leaflet/dist/images/marker-shadow.png"

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

const containerStyle = {
  width: "100%",
  height: "320px",
}

// Create custom pin marker icon
const createPinMarker = (color = "#3F51B5") => {
  return L.divIcon({
    html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="36" height="36">
      <path fill="${color}" stroke="#000" strokeWidth="0.5" d="M12 2C8.14 2 5 5.14 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.86-3.14-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
      <circle cx="12" cy="7" r="2.5" fill="white" stroke="#000" strokeWidth="0.3"/>
    </svg>`,
    className: "pin-marker",
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  })
}

function MapEvents({ onMapClick }) {
  useMapEvents({
    click: (e) => {
      if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng)
      }
    },
  })
  return null
}

export default function LeafletMapPopup({
  lat,
  lng,
  onMarkerPositionChange,
  isDraggable = false,
  markerLabel,
  markerAddress,
  additionalMarkers = [],
}) {
  const [markerPosition, setMarkerPosition] = useState([lat, lng])
  const [useSatelliteView, setUseSatelliteView] = useState(false)
  const mapRef = useRef(null)

  useEffect(() => {
    if (mapRef.current && lat && lng) {
      setMarkerPosition([lat, lng])
      mapRef.current.setView([lat, lng], mapRef.current.getZoom())
    }
  }, [lat, lng])

  const handleMapClick = (lat, lng) => {
    if (isDraggable) {
      updateMarkerPosition(lat, lng)
    }
  }

  const handleMarkerDragEnd = (e) => {
    const newPosition = e.target.getLatLng()
    updateMarkerPosition(newPosition.lat, newPosition.lng)
  }

  const updateMarkerPosition = (lat, lng) => {
    setMarkerPosition([lat, lng])
    if (onMarkerPositionChange) {
      onMarkerPositionChange(lat, lng)
    }
  }

  const zoomToMarker = () => {
    if (mapRef.current && markerPosition) {
      mapRef.current.flyTo(markerPosition, 18)
    }
  }

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser")
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords

        // Update marker position
        setMarkerPosition([latitude, longitude])
        if (onMarkerPositionChange) {
          onMarkerPositionChange(latitude, longitude)
        }

        // Fly to location
        mapRef.current.flyTo([latitude, longitude], 18)
      },
      (error) => {
        let errorMessage = "Unable to retrieve your location"
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location permission denied"
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable"
            break
          case error.TIMEOUT:
            errorMessage = "Location request timed out"
            break
        }
        alert(errorMessage)
      },
    )
  }

  const toggleMapLayer = () => {
    setUseSatelliteView(!useSatelliteView)
  }

  return (
    <div style={{ position: "relative" }}>
      <MapContainer
        center={markerPosition}
        zoom={15}
        style={containerStyle}
        ref={mapRef}
        whenCreated={(map) => {
          mapRef.current = map
        }}
      >
        {useSatelliteView ? (
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
            maxZoom={19}
          />
        ) : (
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            maxZoom={19}
          />
        )}

        {/* Main marker */}
        <Marker
          position={markerPosition}
          draggable={isDraggable}
          eventHandlers={{
            dragend: handleMarkerDragEnd,
          }}
          icon={createPinMarker(isDraggable ? "#4CAF50" : "#F44336")}
        >
          <Popup>
            <div style={{ padding: "8px", maxWidth: "200px" }}>
              {markerLabel ? (
                <>
                  <strong style={{ display: "block", marginBottom: "4px" }}>{markerLabel}</strong>
                  {markerAddress && <span>{markerAddress}</span>}
                </>
              ) : (
                <>
                  Latitude: {markerPosition[0].toFixed(6)}, <br />
                  Longitude: {markerPosition[1].toFixed(6)}
                </>
              )}
            </div>
          </Popup>
        </Marker>

        {/* Additional markers */}
        {additionalMarkers.map((marker, index) => (
          <Marker key={`marker-${index}`} position={[marker.lat, marker.lng]} icon={createPinMarker("#3F51B5")}>
            <Popup>
              <div style={{ padding: "8px", maxWidth: "200px" }}>
                <strong style={{ display: "block", marginBottom: "4px" }}>
                  {marker.name || `Location ${index + 1}`}
                </strong>
                {marker.address && <span>{marker.address}</span>}
              </div>
            </Popup>
          </Marker>
        ))}

        <MapEvents onMapClick={handleMapClick} />
      </MapContainer>

      <div
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          zIndex: "1000",
          display: "flex",
          flexDirection: "column",
          gap: "5px",
        }}
      >
        <button
          onClick={zoomToMarker}
          style={{
            padding: "8px",
            backgroundColor: "white",
            border: "1px solid #ccc",
            borderRadius: "4px",
            cursor: "pointer",
          }}
          title="Zoom to marker"
        >
          🔍
        </button>
        <button
          onClick={getCurrentLocation}
          style={{
            padding: "8px",
            backgroundColor: "white",
            border: "1px solid #ccc",
            borderRadius: "4px",
            cursor: "pointer",
          }}
          title="Find my location"
        >
          📍
        </button>
        <button
          onClick={toggleMapLayer}
          style={{
            padding: "8px",
            backgroundColor: "white",
            border: "1px solid #ccc",
            borderRadius: "4px",
            cursor: "pointer",
          }}
          title={useSatelliteView ? "Switch to street view" : "Switch to satellite view"}
        >
          🌎
        </button>
      </div>
    </div>
  )
}

