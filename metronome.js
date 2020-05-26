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

tempoSlider.addEventListener("onchange", setSliderText);
tempoSlider.addEventListener("mousemove", setSliderText);

//Updates tempo text and value
function setSliderText() {
    if (pressSlider) {
        tempoText.innerHTML = tempoSlider.value;
        beatsPerMinute = parseInt(tempoSlider.value);
        console.log(beatsPerMinute);
        if (isPlaying) {
            clearInterval(interval);
            interval = setInterval(playBeat, 60000/beatsPerMinute);
        }
    }
}


let toggleButton = document.getElementById("toggle-button");

let beatAccentSound = document.getElementById("beat-audio-main");
let beatNormalSound = document.getElementById("beat-audio-secondary");

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
    if (event.code == "Space") {
        startMetronome();
    }
});

function startMetronome() {
    if (isPlaying) {
        isPlaying = false;
        clearTimeout(timeout);
        toggleButton.innerHTML = "Play";
    } else {
        beatsPerMinute = parseInt(tempoSlider.value);
        tempoDeltas = [];
        loadAllTempos();
        isPlaying = true;
        barNumber = 1;
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
    if (barNumber + " " + beatNumber in tempoChanges) {
        console.log("Tempo Change!");
        console.log(tempoChanges[barNumber + " " + beatNumber]);
        console.log(getDT(tempoChanges[barNumber + " " + beatNumber]));
        tempoDeltas.push(tempoChanges[barNumber + " " + beatNumber]);
    }
    
    //Play a special sound for the first beat of every measure
    if (beatNumber == 1) {
        beatAccentSound.play();
    } else {
        beatNormalSound.play();
    }

    tempoDeltas = tempoDeltas.filter(function(value, index, arr) {
        return value.endingBar != barNumber || value.endingBeat != beatNumber;
    });
    tempoDeltas.forEach(delta => {
        beatsPerMinute += getDT(delta);
    });
    console.log(tempoDeltas);

    console.log("bpm");
    console.log(beatsPerMinute);

    timeout = setTimeout(playBeat, 60000/beatsPerMinute);
}

let tempoChanges = {};
let changeHolder = document.querySelector(".tempo-changes");

function loadAllTempos() {
    //Find up tempo changes section
    let changes = changeHolder.querySelectorAll(".tempo-change");
    tempoChanges = {};
    for (let i = 0; i < changes.length; i++) {
        //Load form elements
        let change = changes[i].elements
        tempoChanges[change["starting-bar"].value + " " + change["starting-beat"].value] = {
            startingBar: parseInt(change["starting-bar"].value),
            startingBeat: parseInt(change["starting-beat"].value),
            endingBar: parseInt(change["ending-bar"].value), 
            endingBeat: parseInt(change["ending-beat"].value),
            startingTempo: parseInt(change["starting-tempo"].value),
            endingTempo: parseInt(change["ending-tempo"].value)
        };
    }
    console.log(tempoChanges);
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

/*
function saveData() {
    let saveOutput = "";
    //Line 1: Tempo
    saveOutput += tempoSlider.value + "\n";
    loadAllTempos();
    saveOutput += JSON.stringify(tempoChanges);

    console.log(saveOutput);
}


function loadData() {

}
*/