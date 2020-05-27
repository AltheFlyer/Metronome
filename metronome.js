//Tempo control slider
let tempoSlider = document.getElementById("tempo-slider");
let tempoText = document.getElementById("tempo-text");
let beatsPerMinute = 120;
let pressSlider = false;

tempoSlider.addEventListener("mousedown", function(){
    pressSlider = true;
});
tempoSlider.addEventListener("mouseup", function() {
    pressSlider = false;
});
tempoSlider.addEventListener("change", setSliderText);
tempoSlider.addEventListener("mousemove", setSliderText);

//Updates tempo text and value
function setSliderText() {
    if (pressSlider) {
        tempoText.innerHTML = tempoSlider.value;
        beatsPerMinute = parseInt(tempoSlider.value);
    }
}

//Control played beats
let toggleButton = document.getElementById("toggle-button");
let subdivisionToggle = document.getElementById("toggle-subdivisions");
let subdivideTempoToggle = document.getElementById("toggle-tempo-subdivisions");
let countIn = document.getElementById("countin");
//Load sounds
let beatAccentSound = document.getElementById("beat-audio-main");
let beatNormalSound = document.getElementById("beat-audio-secondary");
let beatSubdivisionSound = document.getElementById("beat-audio-subdivision");

let useSubdivisions = false;
let subdivideTempoChange = true;
let isPlaying = false;
let timeout = function() {};

let barText = document.getElementById("bar-text");
let beatText = document.getElementById("beat-text");

let barNumber = 1;
let beatNumber = 0;
let beatsPerMeasure = 4;
let tempoDeltas = [];

//Button toggles playing/stopping of the metronome
toggleButton.addEventListener("click", startMetronome);
document.addEventListener('keyup', function(event) {
    if (event.key == "c") {
        startMetronome();
    }
});

subdivisionToggle.addEventListener("click", function() {
    useSubdivisions = !useSubdivisions;
});

subdivideTempoToggle.addEventListener("click", function() {
    subdivideTempoChange = !subdivideTempoChange;
});

function startMetronome() {
    if (isPlaying) {
        isPlaying = false;
        clearTimeout(timeout);
        toggleButton.innerHTML = "Play";
    } else {
        beatsPerMinute = parseInt(tempoSlider.value);
        useSubdivisions = subdivisionToggle.checked;
        subdivideTempoChange = subdivideTempoToggle.checked;
        tempoDeltas = [];
        loadAllTempos();
        isPlaying = true;
        barNumber = 1 - parseInt(countIn.value);
        beatNumber = 0;
        barText.innerHTML = barNumber;
        timeout = setTimeout(playBeat, 60000/beatsPerMinute);
        toggleButton.innerHTML = "Stop";
    }
}

function playBeat() {
    //Update values and text display
    beatNumber++;
    if (beatNumber > beatsPerMeasure) {
        beatNumber %= beatsPerMeasure;
        barNumber++;
        barText.innerHTML = barNumber;
    }
    beatText.innerHTML = beatNumber;

    //Check if tempo change should happen
    if (tempoChanges.has(barNumber + " " + beatNumber)) {
        tempoDeltas.push(tempoChanges.get(barNumber + " " + beatNumber));
    }

    //Remove tempo deltas at the end of their duration
    tempoDeltas = tempoDeltas.filter(function(value, index, arr) {
        return value.endingBar != barNumber || value.endingBeat != beatNumber;
    });
    let dt = 0;
    tempoDeltas.forEach(delta => {
        dt += getDT(delta);
    });

    //Play a special sound for the first beat of every measure
    if (beatNumber == 1) {
        beatAccentSound.play();
    } else {
        beatNormalSound.play();
    }

    //If we want subdivisions, set an additional timer to play one halfway before the next beat
    if (useSubdivisions || (subdivideTempoChange && tempoDeltas.length > 0)) {
        setTimeout(playSubdivision, 60000/(2 * beatsPerMinute + (dt/2)));
    }
    beatsPerMinute += dt;
    timeout = setTimeout(playBeat, 60000/beatsPerMinute);
}

function playSubdivision() {
    beatSubdivisionSound.play();
}

let tempoChanges = new Map();
let changeHolder = document.querySelector(".tempo-changes");

function loadAllTempos() {
    //Find up tempo changes section
    let changes = changeHolder.querySelectorAll(".tempo-change");
    tempoChanges = new Map();
    for (let i = 0; i < changes.length; i++) {
        //Load form elements
        let change = changes[i].elements
        tempoChanges.set(change["starting-bar"].value + " " + change["starting-beat"].value, {
            startingBar: parseInt(change["starting-bar"].value),
            startingBeat: parseInt(change["starting-beat"].value),
            endingBar: parseInt(change["ending-bar"].value), 
            endingBeat: parseInt(change["ending-beat"].value),
            startingTempo: parseInt(change["starting-tempo"].value),
            endingTempo: parseInt(change["ending-tempo"].value)
        });
    }
}

//Set delete button functionality
changeHolder.querySelector(".tempo-change button").addEventListener("click", removeParent);


let addTempoChangeButton = document.getElementById("add-tempo-change");
//Create a clone of the base tempo change input
let tempoChangeClone = changeHolder.querySelector(".tempo-change");

addTempoChangeButton.addEventListener("click", function() {
    //Reclone the tempo changer to remove reference to the one just added to the document
    tempoChangeClone = tempoChangeClone.cloneNode(true);
    //Need to manually add delete button functionality for some reason?
    let button = tempoChangeClone.querySelector("button")
    button.addEventListener("click", removeParent);


    changeHolder.append(tempoChangeClone);
});

function removeParent(event) {
    changeHolder.removeChild(event.target.parentNode);
}

function getDT(tempoChange) {
    //Assumes 4 beats per measure
    let totalBeats = (beatsPerMeasure - tempoChange.startingBeat + 1) + tempoChange.endingBeat - 1 + ((tempoChange.endingBar) - (tempoChange.startingBar + 1)) * beatsPerMeasure;
    //console.log("beats involved");
    //console.log(totalBeats);
    return (tempoChange.endingTempo - tempoChange.startingTempo)/(totalBeats);
}

let saveField = document.getElementById("save-field");
let saveButton = document.getElementById("save-button");
let loadButton = document.getElementById("load-button");

saveButton.addEventListener("click", saveData);
loadButton.addEventListener("click", loadData);

function saveData() {
    loadAllTempos();
    //WHY ARE MAPS PAINFUL
    let mapRep = Object.create(null);
    for (let [k, v] of tempoChanges) {
        mapRep[k] = v;
    }
    let saveOutput = {
        tempo: tempoSlider.value,
        useSubdivisions: useSubdivisions,
        subdivideTempoChange: subdivideTempoChange,
        countIn: countIn.value,
        tempoDeltas: mapRep
    };
    saveField.value = btoa(JSON.stringify(saveOutput));
}

function loadData() {
    let saveInput = JSON.parse(atob(saveField.value));

    tempoSlider.value = saveInput.tempo;
    tempoText.innerHTML = tempoSlider.value;
    beatsPerMinute = parseInt(saveInput.tempo);

    console.log(saveInput.useSubdivisions);
    subdivisionToggle.checked = saveInput.useSubdivisions;
    useSubdivisions = saveInput.useSubdivisions;

    subdivideTempoToggle.checked = saveInput.subdivideTempoChange;
    subdivideTempoChange = saveInput.subdivideTempoChange;

    countIn.value = saveInput.countIn;

    //Pain
    changeHolder.innerHTML = "<h2>Tempo Changes</h2>";

    let tempoDeltas = new Map();
    for (let k of Object.keys(saveInput.tempoDeltas)) {
        let data = saveInput.tempoDeltas[k];
        tempoDeltas.set(k, data);

        tempoChangeClone = tempoChangeClone.cloneNode(true);
        //Need to manually add delete button functionality for some reason?
        let button = tempoChangeClone.querySelector("button")
        button.addEventListener("click", removeParent);
    
        let form = tempoChangeClone.elements; 
        form["starting-bar"].value = data.startingBar;
        form["starting-beat"].value = data.startingBeat;
        form["ending-bar"].value = data.endingBar; 
        form["ending-beat"].value = data.endingBeat;
        form["starting-tempo"].value = data.startingTempo;
        form["ending-tempo"].value = data.endingTempo;

        changeHolder.append(tempoChangeClone);
    }
}
