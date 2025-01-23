const INFORM_BLUE = '#0090a7';

function init() {
    const data = JSON.parse(sessionStorage.getItem("tgs.data"));

    if (data.leaderboard) {
        try {
            new Leaderboard(data);
        } catch (e) {
            console.error("Error creating leaderboard", e);
        }
    }

    let enhancedMap;
    try {
        enhancedMap = new EnhancedMap(data);
    } catch (e) {
        console.error("Error creating map", e);
    }

    if (document.getElementById("breakdownList")) {
        let imageDetails;
        try {
            imageDetails = new ImageDetails(data);
        } catch (e) {
            console.error("Error creating image details", e);
        }

        ["one", "two", "three", "four", "five"]
            .map((roundName) => document.getElementById('block' + capitalize(roundName)))
            .map(clone)
            .filter(Boolean)
            .forEach((elem, index) => {
                if (enhancedMap) {
                    elem.querySelector(".textWrap").addEventListener("click", () => enhancedMap.show(index));
                }
                if (imageDetails) {
                    elem.querySelector(".summaryImage").addEventListener("click", () => imageDetails.show(index));
                    document.getElementById("exitBreakdownButton").addEventListener("click", () => imageDetails.hide());
                }
            });
    }

}

function capitalize(roundName) {
    return roundName.charAt(0).toUpperCase() + roundName.slice(1);
}

function clone($elem) {
    const clonedElem = $elem.cloneNode(true);
    $elem.parentNode.replaceChild(clonedElem, $elem);
    return clonedElem;
}

class Leaderboard {
    data;
    div;

    constructor(data) {
        if (!data.leaderboard.today || !data.leaderboard.allTime) {
            throw new Error("missing leaderboard data");
        }

        this.data = data;
        this.div = document.createElement('div');
        this.div.className = "tgs-leaderboard-container";
        this.div.innerHTML = this.getContent();

        const container = document.getElementById("resultsContainer");
        container.insertBefore(this.div, container.firstChild);
    }

    getContent() {
        return `
<div class="tgs-daily">
    <h3>Daily ${this.data.dailyNo}</h3>
    <table>
    <tbody>
        ${this.data.leaderboard.today.map((item, _index) => `
            <tr class="${item.playerUuid === this.data.playerUuid ? 'its-you' : ''}">
                <td class="tgs-initials">${item.initials}</td>
                <td class="tgs-score">${item.score}</td>
            </tr>
        `).join('')}
        </tbody>
    </table>
</div>
<div class="tgs-all-time">
    <h3>All Time</h3>
    <table>
    <tbody>
        ${this.data.leaderboard.allTime.map((item, _index) => `
            <tr class="${item.playerUuid === this.data.playerUuid ? 'tgs-its-you' : ''}">
                <td class="tgs-initials">${item.initials}</td>
                <td class="tgs-daily-date">${item.dailyDate}</td>
                <td class="tgs-score">${item.score}</td>
            </tr>
        `).join('')}
    </tbody>
    </table>
</div>`;
    }
}

class EnhancedMap {
    data;
    map;
    items;

    constructor(data) {
        if (!data.playerUuid) {
            throw new Error("cannot access map");
        }
        this.data = data;
        this.map = mapkit?.maps?.[0];
        if (!this.map) {
            throw new Error("cannot access map");
        }
        this.map.padding = new mapkit.Padding({
            top: 50,
            left: 50,
            right: 50,
            bottom: 50,
        });

        if (this.data.dailyResults && this.data.dailyInfo) {
            this.items = [0, 1, 2, 3, 4].map(i => this.createItems(this.data.dailyInfo[i], this.data.dailyResults[i]));
            setTimeout(() => this.show(-1), 0);
        } else if (this.data.roundInfo && this.data.roundResults) {
            this.items = [this.createItems(this.data.roundInfo, this.data.roundResults)];
            setTimeout(() => this.show(0), 0);
        } else {
            throw new Error("missing data");
        }
    }

    show(index) {
        this.map.removeAnnotations(this.map.annotations);
        this.map.removeOverlays(this.map.overlays);

        if (index === -1) {
            this.map.showItems(this.items.flat())
        } else {
            this.map.showItems(this.items[index]);
        }
    }

    createItems(roundInfo, roundResults) {

        const trueLat = Number(roundInfo.Location.lat);
        const trueLon = Number(roundInfo.Location.lng);
        const trueAnnotation = new mapkit.MarkerAnnotation(
            new mapkit.Coordinate(trueLat, trueLon),
            {
                color: '#DB5049',
                title: roundInfo.Year,
            }
        );

        const playerItems = roundResults.flatMap((playerResult) => {
            const isLocalUser = playerResult.playerUuid === this.data.playerUuid;
            const {latitude, longitude} = playerResult;
            const guessAnnotation = new mapkit.MarkerAnnotation(
                new mapkit.Coordinate(latitude, longitude),
                {
                    color: isLocalUser ? INFORM_BLUE : 'black',
                    glyphText: playerResult.initials,
                    glyphColor: "white",
                    title: playerResult.guessedYear + "",
                    subtitle: playerResult.totalPoints + " points",
                });

            // line
            const lineCoords = this.adjustForShortestPath([
                [latitude, longitude],
                [trueLat, trueLon],
            ]);

            const style = new mapkit.Style({
                lineWidth: 1.5,
                lineJoin: "round",
                lineDash: [8, 6],
                strokeColor: isLocalUser ? INFORM_BLUE : 'black',
            });
            const overlay = new mapkit.PolylineOverlay(lineCoords, {style: style});

            return [guessAnnotation, overlay];
        });

        return [trueAnnotation, ...playerItems];
    }


    adjustForShortestPath(points) {
        let startLon = this.normalizeLongitude(Number(points[0][1]));
        let endLon = this.normalizeLongitude(Number(points[1][1]));

        // Check if crossing the date line is shorter
        if (Math.abs(endLon - startLon) > 180) {
            if (endLon > startLon) {
                points[1][1] = endLon - 360;
            } else {
                points[1][1] = endLon + 360;
            }
        }
        return points.map(point => new mapkit.Coordinate(Number(point[0]), point[1]));
    }

    normalizeLongitude(lon) {
        lon = lon % 360;
        if (lon > 180) {
            lon -= 360;
        } else if (lon < -180) {
            lon += 360;
        }
        return lon;
    }
}

class ImageDetails {
    data;

    $div;
    $img;
    $description;

    wheelZoom;

    constructor(data) {
        this.data = data;
        this.$div = document.createElement('div');
        this.$div.style.display = "none";
        this.$div.innerHTML = this.getContent();
        this.$img = this.$div.querySelector(".tgs-image");
        this.wheelZoom = new WheelZoom(this.$img);

        this.$description = this.$div.querySelector(".tgs-image-description");
        document.body.appendChild(this.$div);

        this.$div.querySelector(".tgs-close-button").addEventListener("click", () => this.hide());
    }

    getContent() {
        return `
<div class="tgs-image-details-block">
    <div class="tgs-close-button">Close</div>
    <img class="tgs-image" src="" alt="">
    <p class="tgs-image-description"></p>
</div>
        `;
    }

    show(index) {
        const dailyInfo = this.data.dailyInfo[index];
        this.$description.textContent = `${dailyInfo.Year}, ${dailyInfo.Country}: ${dailyInfo.Description}`;
        this.$img.src = dailyInfo.URL;
        this.$div.style.display = "block";
    }

    hide() {
        this.$div.style.display = "none";
        this.wheelZoom.reset();
    }
}

class WheelZoom {
    $img;

    settings = {
        zoom: 0.06,
        maxZoom: 7,
        initialZoom: 1,
        initialX: 0.5,
        initialY: 0.5,
    };

    width;
    height;
    bgWidth;
    bgHeight;
    bgPosX;
    bgPosY;
    previousEvent;
    transparentSpaceFiller;

    constructor(img) {
        this.reset = this.reset.bind(this);
        this.onwheel = this.onwheel.bind(this);
        this.drag = this.drag.bind(this);
        this.removeDrag = this.removeDrag.bind(this);
        this.draggable = this.draggable.bind(this);
        this.load = this.load.bind(this);
        this.$img = img;

        if (this.$img.complete) {
            this.load();
        }
        this.$img.addEventListener('load', this.load);
    }


    setSrcToBackground() {
        this.$img.style.backgroundRepeat = 'no-repeat';
        this.$img.style.backgroundImage = 'url("' + this.$img.src + '")';
        this.transparentSpaceFiller = 'data:image/svg+xml;base64,' + window.btoa('<svg xmlns="http://www.w3.org/2000/svg" width="' + this.$img.naturalWidth + '" height="' + this.$img.naturalHeight + '"></svg>');
        this.$img.src = this.transparentSpaceFiller;
    }

    updateBgStyle() {
        if (this.bgPosX > 0) {
            this.bgPosX = 0;
        } else if (this.bgPosX < this.width - this.bgWidth) {
            this.bgPosX = this.width - this.bgWidth;
        }

        if (this.bgPosY > 0) {
            this.bgPosY = 0;
        } else if (this.bgPosY < this.height - this.bgHeight) {
            this.bgPosY = this.height - this.bgHeight;
        }

        this.$img.style.backgroundSize = this.bgWidth + 'px ' + this.bgHeight + 'px';
        this.$img.style.backgroundPosition = this.bgPosX + 'px ' + this.bgPosY + 'px';
    }

    reset() {
        this.bgWidth = this.width;
        this.bgHeight = this.height;
        this.bgPosX = this.bgPosY = 0;
        this.updateBgStyle();
    }

    onwheel(e) {
        e.preventDefault();

        let deltaY = 0;
        if (e.deltaY) { // FireFox 17+ (IE9+, Chrome 31+?)
            deltaY = e.deltaY;
        } else if (e.wheelDelta) {
            deltaY = -e.wheelDelta;
        }

        // As far as I know, there is no good cross-browser way to get the cursor position relative to the event target.
        // We have to calculate the target element's position relative to the document, and subtrack that from the
        // cursor's position relative to the document.
        const rect = this.$img.getBoundingClientRect();
        const offsetX = e.pageX - rect.left - window.pageXOffset;
        const offsetY = e.pageY - rect.top - window.pageYOffset;

        // Record the offset between the bg edge and cursor:
        const bgCursorX = offsetX - this.bgPosX;
        const bgCursorY = offsetY - this.bgPosY;

        // Use the previous offset to get the percent offset between the bg edge and cursor:
        const bgRatioX = bgCursorX / this.bgWidth;
        const bgRatioY = bgCursorY / this.bgHeight;

        // Update the bg size:
        if (deltaY < 0) {
            this.bgWidth += this.bgWidth * this.settings.zoom;
            this.bgHeight += this.bgHeight * this.settings.zoom;
        } else {
            this.bgWidth -= this.bgWidth * this.settings.zoom;
            this.bgHeight -= this.bgHeight * this.settings.zoom;
        }

        if (this.settings.maxZoom) {
            this.bgWidth = Math.min(this.width * this.settings.maxZoom, this.bgWidth);
            this.bgHeight = Math.min(this.height * this.settings.maxZoom, this.bgHeight);
        }

        // Take the percent offset and apply it to the new size:
        this.bgPosX = offsetX - (this.bgWidth * bgRatioX);
        this.bgPosY = offsetY - (this.bgHeight * bgRatioY);

        // Prevent zooming out beyond the starting size
        if (this.bgWidth <= this.width || this.bgHeight <= this.height) {
            this.reset();
        } else {
            this.updateBgStyle();
        }
    }

    drag(e) {
        e.preventDefault();
        this.bgPosX += (e.pageX - this.previousEvent.pageX);
        this.bgPosY += (e.pageY - this.previousEvent.pageY);
        this.previousEvent = e;
        this.updateBgStyle();
    }

    removeDrag() {
        document.removeEventListener('mouseup', this.removeDrag);
        document.removeEventListener('mousemove', this.drag);
    }

    // Make the background draggable
    draggable(e) {
        e.preventDefault();
        this.previousEvent = e;
        document.addEventListener('mousemove', this.drag);
        document.addEventListener('mouseup', this.removeDrag);
    }

    load() {
        const initial = Math.max(this.settings.initialZoom, 1);

        if (this.$img.src === this.transparentSpaceFiller) return;

        const computedStyle = window.getComputedStyle(this.$img, null);

        this.width = parseInt(computedStyle.width, 10);
        this.height = parseInt(computedStyle.height, 10);
        this.bgWidth = this.width * initial;
        this.bgHeight = this.height * initial;
        this.bgPosX = -(this.bgWidth - this.width) * this.settings.initialX;
        this.bgPosY = -(this.bgHeight - this.height) * this.settings.initialY;

        this.setSrcToBackground();

        this.$img.style.backgroundSize = this.bgWidth + 'px ' + this.bgHeight + 'px';
        this.$img.style.backgroundPosition = this.bgPosX + 'px ' + this.bgPosY + 'px';
        this.$img.addEventListener('wheelzoom.reset', this.reset);

        this.$img.addEventListener('wheel', this.onwheel);
        this.$img.addEventListener('mousedown', this.draggable);
    }
}

init();