import {select, templates, settings, classNames} from '../settings.js';
import utils from '../utils.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';

class Booking {
    constructor(bookingElement){
        const thisBooking = this;
        thisBooking.selectedTable = null;

    
        thisBooking.render(bookingElement);
        thisBooking.initWidgets();
        thisBooking.getData();
    }
    
    getData(){
        const thisBooking = this;

        const startDateParam = settings.db.dateStartParamKey + '=' + utils.dateToStr(thisBooking.datePicker.minDate);
        const endDateParam = settings.db.dateEndParamKey + '=' + utils.dateToStr(thisBooking.datePicker.maxDate);

        const params = {
            booking: [
                startDateParam,
                endDateParam,
            ],
            eventsCurrent: [
                settings.db.notRepeatParam,
                startDateParam,
                endDateParam,
            ],
            eventsRepeat: [
                settings.db.repeatParam,
                endDateParam,
            ],
        };
        const urls = {
            booking:       settings.db.url + '/' + settings.db.bookings + '?' + params.booking.join('&'),
            eventsCurrent: settings.db.url + '/' + settings.db.events + '?' + params.eventsCurrent.join('&'),
            eventsRepeat:  settings.db.url + '/' + settings.db.events + '?' + params.eventsRepeat.join('&'),
        };
        //console.log('getData urls', urls);

        Promise.all([
            fetch(urls.booking),
            fetch(urls.eventsCurrent),
            fetch(urls.eventsRepeat),
        ])
            .then(function(allResponses){
                const bookingsResponse = allResponses[0];
                const eventsCurrentResponse = allResponses[1];
                const eventsRepeatResponse = allResponses[2];
                return Promise.all([
                    bookingsResponse.json(),
                    eventsCurrentResponse.json(),
                    eventsRepeatResponse.json(),
                ]);
            })
            .then(function([bookings, eventsCurrent, eventsRepeat]){
               // console.log(bookings);
               // console.log(eventsCurrent);
               // console.log(eventsRepeat);
               thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
            });
    }

    parseData(bookings, eventsCurrent, eventsRepeat){
        const thisBooking = this;

        thisBooking.booked = {};

        for(let item of eventsCurrent){
            thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
        }

        for(let item of bookings){
            thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
        }

        const minDate = thisBooking.datePicker.minDate;
        const maxDate = thisBooking.datePicker.maxDate;

        for(let item of eventsRepeat){
            if(item.repeat == 'daily'){
                for(let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1)){
                    
                    thisBooking.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table);
                }
            }
        }

       //for(let item of eventsCurrent){
        //    thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
      //  }

        //console.log('thisBooking.booked', thisBooking.booked);

        thisBooking.updateDOM();
    }

    makeBooked(date, hour, duration, table){
        const thisBooking = this;

        if(typeof thisBooking.booked[date] == 'undefined'){
            thisBooking.booked[date] = {};
        }

        const startHour = utils.hourToNumber(hour);

       // if(typeof thisBooking.booked[date][startHour] == 'undefined'){
       //     thisBooking.booked[date][startHour] = [];
       // }

       // thisBooking.booked[date][startHour].push(table);

        for(let hourBlock = startHour; hourBlock < startHour + duration; hourBlock += 0.5){
            if(typeof thisBooking.booked[date][hourBlock] == 'undefined'){
                thisBooking.booked[date][hourBlock] = [];
            }
            thisBooking.booked[date][hourBlock].push(table);
        }
    }

    updateDOM(){
        const thisBooking = this;

        thisBooking.date = thisBooking.datePicker.value;
        thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);

        let allAvailable = false;

        if(
            typeof thisBooking.booked[thisBooking.date] == 'undefined'
            ||
            typeof thisBooking.booked[thisBooking.date][thisBooking.hour] == 'undefined'
        ){
            allAvailable = true;
        }

        for(let table of thisBooking.dom.tables){
            table.classList.remove(classNames.booking.tableSelected);
            let tableId = table.getAttribute(settings.booking.tableIdAttribute);
            if(!isNaN(tableId)){
                tableId = parseInt(tableId);
            }

            if(
                !allAvailable
                &&
                thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)
            ){
                table.classList.add(classNames.booking.tableBooked);
            } else {
                table.classList.remove(classNames.booking.tableBooked);
            }
        }
        thisBooking.selectedTable = null;


    }

    render(bookingElement){
        const thisBooking = this;
    
        const generatedHTML = templates.bookingWidget();
    
        thisBooking.dom = {};
        thisBooking.dom.wrapper = bookingElement;
        thisBooking.dom.wrapper.innerHTML = generatedHTML;
    
        thisBooking.dom.peopleAmount = thisBooking.dom.wrapper.querySelector(select.booking.peopleAmount);
        thisBooking.dom.hoursAmount = thisBooking.dom.wrapper.querySelector(select.booking.hoursAmount);
        thisBooking.dom.datePicker = thisBooking.dom.wrapper.querySelector(select.widgets.datePicker.wrapper);
        thisBooking.dom.hourPicker = thisBooking.dom.wrapper.querySelector(select.widgets.hourPicker.wrapper);

        thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(select.booking.tables);
        thisBooking.dom.allTables = thisBooking.dom.wrapper.querySelector(select.booking.allTables);

        thisBooking.dom.phone = thisBooking.dom.wrapper.querySelector(select.booking.phone);
        thisBooking.dom.address = thisBooking.dom.wrapper.querySelector(select.booking.address);
        thisBooking.dom.starters = thisBooking.dom.wrapper.querySelectorAll(select.booking.starters);
        thisBooking.dom.submit = thisBooking.dom.wrapper.querySelector(select.booking.form);
    }
    
    initWidgets(){
        const thisBooking = this;
    
        thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
        thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);
        thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker);
        thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker);      

        thisBooking.dom.wrapper.addEventListener('updated', function () {
            thisBooking.updateDOM();
          });

        thisBooking.dom.allTables.addEventListener('click', function(event){
            thisBooking.initTables(event);
        });

        thisBooking.dom.submit.addEventListener('submit', function(event) {
            event.preventDefault();
            thisBooking.sendBooking();
          });


    }

    initTables(event){
        const thisBooking = this;
        const clickedElement = event.target;
        const tableClickedId = clickedElement.getAttribute(settings.booking.tableIdAttribute);
        if (clickedElement.classList.contains(classNames.booking.tableBooked)) {
        alert('This table is already booked. You need to choose another one.');
        } else {
        if (clickedElement.classList.contains(classNames.booking.tableSelected)) {
            clickedElement.classList.remove(classNames.booking.tableSelected);
            thisBooking.selectedTable = '';
        } else {
            for (let table of thisBooking.dom.tables) {
            table.classList.remove(classNames.booking.tableSelected);
            }
            clickedElement.classList.add(classNames.booking.tableSelected);
            thisBooking.selectedTable = tableClickedId;
        }
        }
    }

    sendBooking() {
        const thisBooking = this;
    
        const url = settings.db.url + '/' + settings.db.bookings;
    
        const payload = {
          date: thisBooking.datePicker.value,
          hour: thisBooking.hourPicker.value,
          people: parseInt(thisBooking.peopleAmount.value),
          duration: parseInt(thisBooking.hoursAmount.value),
          starters: [],
          table: parseInt(thisBooking.selectedTable),
          phone: thisBooking.dom.phone.value,
          address: thisBooking.dom.address.value
        };
    
       // console.log('payload: ', payload);

        for (let starter of thisBooking.dom.starters) {
          if (starter.checked) {
            payload.starters.push(starter.value);
          }
        }
    
        const options = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        };
    
        fetch (url, options)
          .then(function(reservation){
            return reservation.json();
          })
          .then(function(booking) {
            thisBooking.makeBooked(payload.date, payload.hour, payload.duration, payload.table);
            alert('Table booked successfully!');
          });
      }
}

export default Booking; 