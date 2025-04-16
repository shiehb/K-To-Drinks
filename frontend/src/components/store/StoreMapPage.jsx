import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MapPin, Route, Info, Clock, Phone, X, ChevronLeft, Mail, User } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import "leaflet.locatecontrol/dist/L.Control.Locate.min.css";
import "leaflet.locatecontrol";

// Enhanced store data structure
const stores = [
  {
    id: 1,
    name: "Downtown Market",
    ownerName: "John Smith",
    address: "123 Main St, Downtown",
    contact: "555-1234",
    email: "downtown@example.com",
    status: "Active",
    hours: "Mon-Fri: 8AM-8PM, Sat-Sun: 9AM-6PM",
    coordinates: [40.7484, -73.9857],
  },
  {
    id: 2,
    name: "Westside Grocery",
    ownerName: "Emily Johnson",
    address: "456 West Ave, Westside",
    contact: "555-2345",
    email: "westside@example.com",
    status: "Active",
    hours: "Mon-Fri: 7AM-9PM, Sat-Sun: 8AM-7PM",
    coordinates: [40.7362, -73.995],
  },
  {
    id: 3,
    name: "Northend Shop",
    ownerName: "Michael Brown",
    address: "789 North Blvd, Northend",
    contact: "555-3456",
    status: "Active",
    hours: "Mon-Sun: 8AM-10PM",
    coordinates: [40.7128, -74.006],
  },
  {
    id: 4,
    name: "Eastside Mart",
    ownerName: "Sarah Davis",
    address: "321 East Rd, Eastside",
    contact: "555-4567",
    email: "eastside@example.com",
    status: "Inactive",
    hours: "Mon-Fri: 9AM-7PM, Sat: 10AM-6PM, Sun: Closed",
    coordinates: [40.7829, -73.9654],
  },
  {
    id: 5,
    name: "Southside Store",
    ownerName: "Robert Wilson",
    address: "654 South St, Southside",
    contact: "555-5678",
    status: "Active",
    hours: "Mon-Sun: 24 hours",
    coordinates: [40.7061, -74.0099],
  },
];

export default function StoreMapPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const markersRef = useRef([]);
  const routingControlRef = useRef(null);
  const [selectedStore, setSelectedStore] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [showRoute, setShowRoute] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [mapLoaded, setMapLoaded] = useState(false);

  const storeIdFromUrl = searchParams.get("id");

  const filteredStores = stores.filter(
    (store) =>
      store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      store.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      store.ownerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize the map
    leafletMap.current = L.map(mapRef.current).setView([40.7128, -74.006], 12);

    // Add OpenStreetMap tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(leafletMap.current);

    // Create and add the locate control
    const locateControl = L.control.locate({
      position: 'topright',
      initialZoomLevel: 16,
      setView: 'untilPanOrZoom',
      keepCurrentZoomLevel: false,
      flyTo: true,
      clickBehavior: {
        inView: 'stop',
        outOfView: 'setView',
      },
      strings: {
        title: "Show me where I am"
      },
      locateOptions: {
        enableHighAccuracy: true
      },
      onLocationError: (err) => {
        console.error("Location error:", err);
        alert("Unable to find your location. Please check your settings.");
      },
    }).addTo(leafletMap.current);

    // Handle successful location
    leafletMap.current.on('locationfound', (e) => {
      setUserLocation([e.latitude, e.longitude]);
    });

    // Load routing plugin
    if (typeof L.Routing === "undefined") {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.js";
      script.onload = () => setMapLoaded(true);
      document.body.appendChild(script);
    } else {
      setMapLoaded(true);
    }

    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (!mapLoaded || !leafletMap.current) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add markers for filtered stores
    filteredStores.forEach((store) => {
      const marker = L.marker(store.coordinates).addTo(leafletMap.current);

      const popupContent = `
        <div class="store-popup">
          <h3 class="font-bold">${store.name}</h3>
          <p>${store.address}</p>
          <span class="text-xs ${store.status === "Active" ? "text-green-600" : "text-red-600"}">${store.status}</span>
        </div>
      `;
      marker.bindPopup(popupContent);

      marker.on("click", () => {
        setSelectedStore(store);
        setShowRoute(false);
        leafletMap.current.setView(store.coordinates, 15);
      });

      markersRef.current.push(marker);
    });

    // Select store from URL if provided
    if (storeIdFromUrl) {
      const storeId = parseInt(storeIdFromUrl);
      const store = stores.find((s) => s.id === storeId);
      if (store) {
        setSelectedStore(store);
        leafletMap.current.setView(store.coordinates, 15);
        const markerIndex = stores.findIndex((s) => s.id === storeId);
        if (markerIndex >= 0 && markersRef.current[markerIndex]) {
          markersRef.current[markerIndex].openPopup();
        }
      }
    }
  }, [mapLoaded, filteredStores, storeIdFromUrl]);

  useEffect(() => {
    if (!mapLoaded || !leafletMap.current || !selectedStore || !userLocation || !showRoute) return;

    if (routingControlRef.current) {
      routingControlRef.current.remove();
    }

    routingControlRef.current = L.Routing.control({
      waypoints: [
        L.latLng(userLocation[0], userLocation[1]),
        L.latLng(selectedStore.coordinates[0], selectedStore.coordinates[1]),
      ],
      routeWhileDragging: true,
      showAlternatives: true,
      fitSelectedRoutes: true,
      lineOptions: {
        styles: [{ color: "#3b82f6", opacity: 0.7, weight: 5 }],
      },
    }).addTo(leafletMap.current);

    return () => {
      if (routingControlRef.current) {
        routingControlRef.current.remove();
      }
    };
  }, [mapLoaded, selectedStore, userLocation, showRoute]);

  const handleGetDirections = () => {
    if (!userLocation) {
      alert("Please enable location services to get directions");
      return;
    }
    setShowRoute(true);
  };

  return (
    <div className="flex flex-col h-full">
      <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-6">
        <Button variant="ghost" size="sm" onClick={() => navigate("/admin/stores")} className="mr-2">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Stores
        </Button>
        <h1 className="text-lg font-semibold">Store Locations</h1>
      </header>
      <main className="flex-1 overflow-hidden p-6 flex flex-col md:flex-row gap-6">
        {/* Store list sidebar */}
        <div className="w-full md:w-1/3 lg:w-1/4 flex flex-col gap-4">
          <div className="relative w-full">
            <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search stores..."
              className="w-full appearance-none bg-background pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex-1 overflow-auto">
            <div className="space-y-2">
              {filteredStores.map((store) => (
                <Card
                  key={store.id}
                  className={`cursor-pointer transition-all hover:border-primary ${
                    selectedStore?.id === store.id ? "border-primary" : ""
                  }`}
                  onClick={() => {
                    setSelectedStore(store);
                    setShowRoute(false);
                    if (leafletMap.current) {
                      leafletMap.current.setView(store.coordinates, 15);
                      const markerIndex = filteredStores.findIndex((s) => s.id === store.id);
                      if (markerIndex >= 0 && markersRef.current[markerIndex]) {
                        markersRef.current[markerIndex].openPopup();
                      }
                    }
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium">{store.name}</h3>
                        <p className="text-sm text-muted-foreground">{store.address}</p>
                        <p className="text-xs text-muted-foreground mt-1">Owner: {store.ownerName}</p>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium mt-2 ${
                            store.status === "Active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}
                        >
                          {store.status}
                        </span>
                      </div>
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredStores.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">No stores found matching your search.</div>
              )}
            </div>
          </div>
        </div>

        {/* Map and store details */}
        <div className="flex-1 flex flex-col gap-4 h-full">
          <div className="flex-1 relative min-h-[400px] rounded-lg overflow-hidden border">
            <div ref={mapRef} className="absolute inset-0" />
          </div>

          {selectedStore && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{selectedStore.name}</CardTitle>
                    <CardDescription>{selectedStore.address}</CardDescription>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedStore(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>Owner: {selectedStore.ownerName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedStore.contact}</span>
                    </div>
                    {selectedStore.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedStore.email}</span>
                      </div>
                    )}
                    {selectedStore.hours && (
                      <div className="flex items-start gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <span>{selectedStore.hours}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <Info className="h-4 w-4 text-muted-foreground" />
                      <span>Status: {selectedStore.status}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>
                        Coordinates: {selectedStore.coordinates[0].toFixed(6)}, {selectedStore.coordinates[1].toFixed(6)}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button onClick={handleGetDirections} disabled={!userLocation} className="w-full">
                      <Route className="mr-2 h-4 w-4" />
                      Get Directions
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => navigate(`/admin/stores?id=${selectedStore.id}`)}
                    >
                      <Info className="mr-2 h-4 w-4" />
                      View Store Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}