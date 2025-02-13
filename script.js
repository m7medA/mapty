'use strict';

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');


class Workout {
    date = new Date();
    id = (Date.now() + '').slice(-10);
    constructor(coords,distance,duration){
        this.coords = coords;
        this.distance = distance; // in km
        this.duration = duration; // in min
    }

    _setDescription(){
        this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`;
    }
}

class Running extends Workout{
    type = 'running';
    constructor(coords,distance,duration,cadence){
        super(coords,distance,duration);
        this.cadence = cadence;
        this._clacPace();
        this._setDescription();
    }

    _clacPace(){
        //min/km
        this.pace = this.duration / this.distance;
        return this.pace;
    }
}

class Cycling extends Workout{
    type = 'cycling';
    constructor(coords,distance,duration,elevationGain){
        super(coords,distance,duration);
        this.elevationGain = elevationGain;
        this._clacSpeed();
        this._setDescription();
    }

    _clacSpeed(){
        //km/h
        this.speed = this.distance / (this.duration/60);
        return this.speed;
    }
}

//////////////////////////////////////////////
/////////////////////////////////////////////
//Architechre Application
class App{
    #map;
    #mapEvent;
    #workouts = [];
    constructor(){
        //get user positiom
        this._getPosition();
        //get data from localStorage
        this._getLocalStorage();
        //Display Marker
        form.addEventListener('submit',this._newWorkout.bind(this));
        //toggle based on type 
        inputType.addEventListener('change',this._toggleElevationField);
        //move to popup
        containerWorkouts.addEventListener('click',this._moveToPopup.bind(this));
    
    }

    _getPosition(){
        if(navigator.geolocation){//to check if browser support this feature
            navigator.geolocation.getCurrentPosition(/* refer to navigator*/this._loadMap.bind(this/**refer to current object*/),function(){
                alert('Could not gey your position');
            })
        }
    }

    _loadMap(position){
        //take two callBack function one when true second when occur error
        const {latitude} = position.coords;
        const {longitude} = position.coords;
    
        const coords = [latitude,longitude];
    
        this.#map = L.map('map').setView(coords, 13);// define opject called map and L for link to leaflet liberary
         // console.log(map);
    
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { //to show map
            maxZoom: 19,
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(this.#map);
    
        //Handling Event on Map
        this.#map.on('click',this._showForm.bind(this));
        this.#workouts.forEach((work) => this._renderWorkoutMarker(work));
    }

    _showForm(mapEv){
        //instead of addEventListner for map object 
        this.#mapEvent = mapEv;
        form.classList.remove('hidden');
        inputDistance.focus();
    }

    _hideForm(){
        inputCadence.value = inputDistance.value = inputDuration.value = inputElevation.value = "";
        form.style.display = 'none';
        form.classList.add('hidden');
        setTimeout(() => form.style.display = 'grid' ,1000);
    }

    _toggleElevationField(){
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    }

    _newWorkout(e){
        const validateInput = (...inputs) => inputs.every(input => Number.isFinite(input) && input > 0);
        let workout;
        e.preventDefault();
        const {lat,lng} = this.#mapEvent.latlng;

        //Get data from form
        const type =  inputType.value;
        const distance = +inputDistance.value;
        const duration = +inputDuration.value;

        //if work out running create running object
        if(type === 'running'){
            //check validate
            const cadence = +inputCadence.value;
            if(!validateInput(distance,duration,cadence)){
                return alert("PLZ Enter Positive Number.");
            }
            //add new object to workouts array
            workout = new Running([lat,lng],distance,duration,cadence)
            this.#workouts.push(workout);
        }

        //if work out cycling create cycling object
        if(type === 'cycling'){
            //check validate
            const elevation = +inputElevation.value;
            if(!validateInput(distance,duration,elevation)){
                return alert("PLZ Enter Positive Number.");
            }
            //add new object to workouts array
            workout = new Cycling([lat,lng],distance,duration,elevation)
            this.#workouts.push(workout);
        }

        //render workout on mao as marker
        this._renderWorkoutMarker(workout);

        //render workout on list
        this._renderWorkout(workout);

        //store in localStorage
        this._setLocalStorage();

        //clear input
        this._hideForm();
    }

    _renderWorkoutMarker(workout){
        L.marker(workout.coords)
        .addTo(this.#map)
        .bindPopup(L.popup({
            maxWidth: 250,
            minWidth: 100,
            autoClose: false,
            closeOnClick: false,
            className: `${workout.type}-popup`,
        })).setPopupContent(`${(workout.type === 'running') ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`).openPopup(); //to make marker when click
    }

    _renderWorkout(workout){
        let html = `
        <li class="workout workout--${workout.type}" data-id="${workout.id}">
            <h2 class="workout__title">${workout.description}</h2>
            <div class="workout__details">
                <span class="workout__icon">${(workout.type === 'running') ? '🏃‍♂️' : '🚴‍♀️'}</span>
                <span class="workout__value">${workout.distance}</span>
                <span class="workout__unit">km</span>
            </div>
            <div class="workout__details">
                <span class="workout__icon">⏱</span>
                <span class="workout__value">${workout.duration}</span>
                <span class="workout__unit">min</span>
            </div>`;

        if(workout.type === 'running'){
            html +=`
            <div class="workout__details">
                <span class="workout__icon">⚡️</span>
                <span class="workout__value">${workout.pace.toFixed(1)}</span>
                <span class="workout__unit">min/km</span>
            </div>
            <div class="workout__details">
                <span class="workout__icon">🦶🏼</span>
                <span class="workout__value">${workout.cadence}</span>
                <span class="workout__unit">spm</span>
            </div>
        </li>`
        }else{
            html +=`
            <div class="workout__details">
                <span class="workout__icon">⚡️</span>
                <span class="workout__value">${workout.speed.toFixed(1)}</span>
                <span class="workout__unit">min/km</span>
            </div>
            <div class="workout__details">
                <span class="workout__icon">🦶🏼</span>
                <span class="workout__value">${workout.elevationGain}</span>
                <span class="workout__unit">spm</span>
            </div>
        </li>`
        }

        form.insertAdjacentHTML("afterend",html);
    }

    _moveToPopup(e){
        const workoutEl = e.target.closest('.workout');
        if(!workoutEl) return;
        
        const workout = this.#workouts.find((work) => workoutEl.dataset.id === work.id )

        this.#map.setView(workout.coords, 13,{
            animate: true,
            pan: {
                duration: 1,
            }
        });
    }

    _setLocalStorage(){
        localStorage.setItem('worksout',JSON.stringify(this.#workouts));
    }

    _getLocalStorage(){
        const data = JSON.parse(localStorage.getItem('worksout'));
        if(!data) return;
        this.#workouts = data;
        this.#workouts.forEach((work) => this._renderWorkout(work));
    }

    reset(){
        localStorage.removeItem('worksout');
        location.reload();
    }
}

const app = new App();

