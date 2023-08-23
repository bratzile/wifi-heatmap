var map = L.map('map', {
    crs: L.CRS.Simple,
}).setView([0, 0], 1);

var mapWidth = 1080;
var mapHeight = 570;

var overlayOpacity = 1;

L.imageOverlay('./assets/demofloormap.png',
    [[0, 0], [mapHeight, mapWidth]], {
        opacity: overlayOpacity
    }).addTo(map);

function updatePolygon(polygon, entity) {
    var name = entity.name;
    var numClients = entity.num_clients;

    var percentFilled = (numClients / maxClients) * 100;
    percentFilled = Math.min(percentFilled, 100);

    var fillColor;
    if (percentFilled > 50) {
        fillColor = '#FF0000';
    } else if (percentFilled > 20) {
        fillColor = '#FFA500';
    } else if (percentFilled > 5){
        fillColor = 'rgba(0, 255, 0, 1)';
    } else {
        fillColor = 'rgba(0, 0, 255, 1)';
    }


    polygon.setStyle({
        fillColor: fillColor
    });

    var tooltipContent = percentFilled.toFixed(0) + "%"; // Promenjeno toFixed(1) u toFixed(0)
    polygon.unbindTooltip().bindTooltip(tooltipContent, {
        permanent: true,
        direction: 'center',
        className: 'custom-tooltip'
    });

    var popupContent = "<b>" + name + "</b><br>Total visitors in area: " + numClients;
    polygon.bindPopup(popupContent);
}

$.getJSON("./json/api-2.json", function(jsonData) {
    jsonData.forEach(function(entity) {
        var vertices = entity.vertices;

        var coordinates = vertices.map(function(vertex) {
            var flippedX = vertex.x;
            var flippedY = mapHeight - vertex.y;
            return [flippedY, flippedX];
        });

        coordinates.push(coordinates[0]);

var polygon = L.polygon(coordinates, { 
    color: '#fff', 
    weight: 3,
    className: 'custom-polygon' // Dodajte ovu liniju
}).addTo(map);


        setInterval(function() {
            updatePolygon(polygon, entity);
        }, 1000);
    });
});

function loadJsonData(intervalDelay) {
    $.getJSON("./json/api-1.json", function(jsonData) {
        var currentIndex = 0;

        var loadingInterval = setInterval(function () {
            if (currentIndex >= jsonData.length) {
                clearInterval(loadingInterval);
                return;
            }

            var place = jsonData[currentIndex];
            var x = place.x;
            var y = mapHeight - place.y;
            var macAddress = place.mac;

            var xOffset = Math.floor(Math.random() * 3) * 8 - 30;
            var yOffset = Math.floor(Math.random() * 3) * 5 - 20;

            x += xOffset;
            y += yOffset;

            var markerIcon = L.icon({
                iconUrl: './assets/location.png',
                iconSize: [30, 30],
                iconAnchor: [9, 0],
            });

            var coordinates = [y, x];
            var marker = L.marker(coordinates, { icon: markerIcon });

            marker.bindPopup(macAddress);

            marker.addTo(map);

            currentIndex++;
        }, intervalDelay);
    });
}

function fetchDataAndRefresh() {
    map.eachLayer(function (layer) {
        if (layer instanceof L.Marker) {
            map.removeLayer(layer);
        }
    });

    loadJsonData();
}

fetchDataAndRefresh();

var playButton = document.getElementById("playButton");
var timeIndicator = document.getElementById("timeIndicator");

var defaultMaxClients = 300;
var maxClients = defaultMaxClients;
var interval;
var playDuration = 15000;
var currentTime = 0;

function startInterval() {
    interval = setInterval(function () {
        var simulatedHours = Math.floor(currentTime / 1000);
        var simulatedTime = 9 + simulatedHours;
        timeIndicator.textContent = simulatedTime + ":00";

maxClients = Math.floor(Math.random() * (200 - 80)) + 50;

        // Pomeri markere svake sekunde
        map.eachLayer(function (layer) {
            if (layer instanceof L.Marker) {
                var xOffset = (Math.random() < 0.5 ? -1 : 1) * (Math.floor(Math.random() * 3) * 8 - 50);
                var yOffset = (Math.random() < 0.5 ? -1 : 1) * (Math.floor(Math.random() * 3) * 10 - 80);

                var newLatLng = layer.getLatLng();
                newLatLng.lat += yOffset / 8;
                newLatLng.lng += xOffset / 12;

                layer.setLatLng(newLatLng);
            }
        });

        currentTime += 1000;

        if (currentTime >= playDuration) {
            clearInterval(interval);
            interval = null;
            playButton.textContent = "PLAY HEATMAP";
            currentTime = 0;
            maxClients = defaultMaxClients;
            timeIndicator.style.width = "0";
            timeIndicator.textContent = "8:00";
            fetchDataAndRefresh();
        }
        timeIndicator.style.width = (currentTime / playDuration * 100) + "%";
    }, 1000);
}

playButton.addEventListener("click", function () {
    if (!interval) {
        startInterval();
        playButton.textContent = "STOP";
        
        // Podesite intervalDelay za funkciju loadJsonData
        var intervalDelay = playDuration / (jsonData.length + 1); // Prilagodite ovo za željeni efekat
        loadJsonData(intervalDelay);
    } else {
        clearInterval(interval);
        interval = null;
        playButton.textContent = "PLAY";
        currentTime = 0;
        maxClients = defaultMaxClients;
        timeIndicator.style.width = "0";
        timeIndicator.textContent = "8:00";
        fetchDataAndRefresh();
    }
});

setInterval(function () {
    if (interval) {
        var percent = (currentTime / playDuration) * 100;
        updateTooltip(percent);
        fetchDataAndRefresh();
    }
}, 1000);

var pauseButton = document.getElementById("pauseButton");

pauseButton.addEventListener("click", function () {
    if (interval) {
        clearInterval(interval);
        interval = null;
        pauseButton.textContent = "RESUME";
    } else {
        startInterval();
        pauseButton.textContent = "PAUSE";
    }
});

