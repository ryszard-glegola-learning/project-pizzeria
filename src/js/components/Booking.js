/*

To-dos: 
- add one more arg to makeBooked to use it also to populate the bookingCache object
- if this can't be done, create new function similar to makeBooked to create that object
- add a check that makes adding the new booking dependent on bookingDuration

*/

import {select, templates, settings, classNames} from '../settings.js'; 
import {utils} from '../utils.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';


class Booking{
  constructor(wrapper){
    const thisBooking = this;
    thisBooking.starters = [];
    thisBooking.render(wrapper);
    thisBooking.initWidgets();
    thisBooking.getData();
  }

  getData(){
    const thisBooking = this;
    // console.log('getData run.');
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
      booking:        settings.db.url + '/' + settings.db.booking 
                                      + '?' + params.booking.join('&'),
      eventsCurrent:  settings.db.url + '/' + settings.db.event  
                                      + '?' + params.eventsCurrent.join('&'),  
      eventsRepeat:   settings.db.url + '/' + settings.db.event   
                                      + '?' + params.eventsRepeat.join('&'),  
    };

    // console.log('urls',urls);

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
        // console.log('Done!');
        // console.log(' - bookings:',bookings);        
        // console.log(' - curr. events:',eventsCurrent);
        // console.log(' - recurr. events:',eventsRepeat);
        // console.log('... and that\'s all, folks!');
        thisBooking.parseData(bookings,eventsCurrent,eventsRepeat);
      });
  }

  parseData(bookings,eventsCurrent,eventsRepeat){
    const thisBooking = this;
    thisBooking.booked = {};

    for(let item of bookings){
      thisBooking.makeBooked(thisBooking.booked, item.date, item.hour, item.duration, item.table);
    }
    
    for(let item of eventsCurrent){
      thisBooking.makeBooked(thisBooking.booked, item.date, item.hour, item.duration, item.table);
    }

    const minDate = thisBooking.datePicker.minDate;
    const maxDate = thisBooking.datePicker.maxDate;

    for(let item of eventsRepeat){
      if(item.repeat == 'daily'){
        for(let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate,1)){
          thisBooking.makeBooked(thisBooking.booked, utils.dateToStr(loopDate), item.hour, item.duration, item.table);
        }
      }
    }

    // console.log('thisBooking.booked:',thisBooking.booked); // Shows the entire booked object, cool!

    thisBooking.updateDOM();
  }

  makeBooked(bookingObject, date, hour, duration, table){
    // const thisBooking = this;
    // console.log('makeBooked run.');
    if(typeof bookingObject[date] == 'undefined'){
      bookingObject[date] = {};
    }

    let startHour = hour;

    if(isNaN(hour)){
      startHour = utils.hourToNumber(hour);
    }

    for(let hourBlock = startHour; hourBlock < startHour + duration; hourBlock += 0.5){

      if(typeof bookingObject[date][hourBlock] == 'undefined'){
        bookingObject[date][hourBlock] = [];
      }
  
      bookingObject[date][hourBlock].push(table);

    } 
  }

  unBook (bookingObject, date, hour, table){
    // This method removes occurrences of specific 'table' that START at 'hour'
    // Logic: 
    // 1. start with 'hour'
    let hourArrayName = hour;
    if(isNaN(hour)){
      hourArrayName = utils.hourToNumber(hour);
    }
    
    //Use 'do while'-loop to check if table exists in array and remove it

    let bookingExists = true;
    let indexOfTableInHourArray = bookingObject[date][hourArrayName].indexOf(table);

    do {
      if (typeof bookingObject[date][hourArrayName] != 'undefined'){
        indexOfTableInHourArray = bookingObject[date][hourArrayName].indexOf(table);
        if (bookingObject[date][hourArrayName].indexOf(table) == -1) {
          bookingExists = false;
        } else {
          bookingObject[date][hourArrayName].splice(indexOfTableInHourArray,1);
          indexOfTableInHourArray = bookingObject[date][hourArrayName].indexOf(table);
        }
      } else {
        bookingExists = false;
      }


      hourArrayName += 0.5;
    } while (bookingExists);

    // Now let's remove hour objects that are empty arrays

    for (let eachHourArray in bookingObject[date]){
      if (bookingObject[date][eachHourArray].length == 0){
        delete bookingObject[date][eachHourArray];
      }

    }
  }

  updateDOM(){
    const thisBooking = this;
    thisBooking.date = thisBooking.datePicker.value; // This date is imported from DatePicker, used to be in wrong format if PICK A DATE drop-down was used to select the date
    // console.log('updateDOM Date:',thisBooking.date); 
    thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);

    let allAvailable = false;

    if(
      typeof thisBooking.booked[thisBooking.date] == 'undefined'
    ){
      allAvailable = true;
    } else {
      if(
        typeof thisBooking.booked[thisBooking.date] != 'undefined'
        &&
        typeof thisBooking.booked[thisBooking.date][thisBooking.hour] == 'undefined' 
      ){
        allAvailable = true;
      }
    }

    // console.log('updateDOM check:');
    // console.log('  allAvailable:',allAvailable);
    // console.log('  Date AFTER:',thisBooking.date);
    // console.log('  Hour:',thisBooking.hour);
    // console.log('  Booked obj.:',thisBooking.booked);

    for(let table of thisBooking.dom.tables){
      // console.log('  updateDOM - table',table);
      let tableId = table.getAttribute(settings.booking.tableIdAttribute);
      if(!isNaN(tableId)){
        tableId = parseInt(tableId);
      }
      // console.log('  updateDOM - tableId',tableId);
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
  
    // This does the same for the bookingCache object
    let allUnselected = false;

    if(
      typeof thisBooking.bookingCache[thisBooking.date] == 'undefined'
    ){
      allUnselected = true;
    } else {
      if(
        typeof thisBooking.bookingCache[thisBooking.date] != 'undefined'
        &&
        typeof thisBooking.bookingCache[thisBooking.date][thisBooking.hour] == 'undefined' 
      ){
        allUnselected = true;
      }
    }

    for(let table of thisBooking.dom.tables){
      // console.log('  updateDOM - table',table);
      let tableId = table.getAttribute(settings.booking.tableIdAttribute);
      if(!isNaN(tableId)){
        tableId = parseInt(tableId);
      }
      // console.log('  updateDOM - tableId',tableId);
      if(
        !allUnselected
        &&
        thisBooking.bookingCache[thisBooking.date][thisBooking.hour].includes(tableId)
      ){
        table.classList.add(classNames.booking.tableToBeBooked);
      } else {
        table.classList.remove(classNames.booking.tableToBeBooked);
      }
    }
  }

  render(booking){
    const thisBooking = this;
    // console.log('render run.');
    /* generate HTML using templates.bookingWidget, no args */
    const generatedHTML = templates.bookingWidget();
    
    /* create an empty object thisBooking.dom */
    thisBooking.dom = {};

    /* assign a 'wrapper' property equal to this method's arg to thisBooking.dom */
    thisBooking.dom.wrapper = booking;
    
    /* assign HTML code generated using template to innerHTML of that wrapper */
    thisBooking.dom.wrapper.innerHTML = generatedHTML;

    /* create thisBooking.dom.peopleAmount and use it to store the single element found in the wrapperze that matches select.booking.peopleAmount, */
    thisBooking.dom.peopleAmount = thisBooking.dom.wrapper.querySelector(select.booking.peopleAmount);

    /* create thisBooking.dom.hoursAmount and use it to store the single element found in the wrapper that matches select.booking.hoursAmount */
    thisBooking.dom.hoursAmount = thisBooking.dom.wrapper.querySelector(select.booking.hoursAmount);

    thisBooking.dom.datePicker = thisBooking.dom.wrapper.querySelector(select.widgets.datePicker.wrapper); 

    thisBooking.dom.hourPicker = thisBooking.dom.wrapper.querySelector(select.widgets.hourPicker.wrapper); 
    
    thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(select.booking.tables);

    thisBooking.dom.form = thisBooking.dom.wrapper.querySelector(select.booking.form);

    thisBooking.dom.starters = thisBooking.dom.wrapper.querySelectorAll(select.booking.starter);
    // console.log('thisBooking.dom:',thisBooking.dom);
  }

  initWidgets(){
    const thisBooking = this;
    // console.log('initWidgets run.');
    thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
    thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);
    thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker);
    thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker);

    thisBooking.dom.wrapper.addEventListener('updated', function(){
      thisBooking.updateDOM();
    // Q2P: not sure what this does  
    });

    thisBooking.bookingCache = {};
    // Add a listener to each table 
    for (let table of thisBooking.dom.tables) {
      let tableId = table.getAttribute(settings.booking.tableIdAttribute);
      table.addEventListener('click', function(){
        if (tableId != 'undefined') {
          thisBooking.clickToToggleBooking(tableId);
          // console.log('clickToToggleBooking ran for table', tableId);
          // console.log('Table ' + tableId + ' clicked!');
        }
      });    
    }

    // Add a listener to BOOK TABLE button
    thisBooking.dom.form.addEventListener('submit',function(event){
      event.preventDefault();
      console.log('BOOK TABLE clicked');
      thisBooking.sendNewBooking(); 
    });

    // Add a listener to PICK A TIME slider to wipe bookingCache when time is changed
    thisBooking.dom.datePicker.addEventListener('updated',function(event){
      event.preventDefault();
      thisBooking.bookingCache = {};
      thisBooking.newBookingsPayload = {};
      // console.log('... and table selection removed.',);
    });

    // Add a listener to PICK A DATE slider to wipe bookingCache when time is changed
    thisBooking.dom.hourPicker.addEventListener('updated',function(event){
      event.preventDefault();
      thisBooking.bookingCache = {};
      thisBooking.newBookingsPayload = {};
      // console.log('... and table selection removed.',);
    });
    
    /* Initialise a separate object that will be used to recoed data that will be sent to API at the end.
    Structure:

    {
      {Table 1: 
        {
        "date": "2020-07-21",
        "hour": "12:30",
        "table": 1,
        "repeat": false,
        "duration": 4,
        "ppl": 3,
        "starters": [
          "water",
          "bread"
        ],
        "id": 33
        }
      },      
      {Table 2: 
        {
        "date": "2020-07-21",
        "hour": "12:30",
        "table": 1,
        "repeat": false,
        "duration": 4,
        "ppl": 3,
        "starters": [
          "water",
          "bread"
        ],
        "id": 33
        }
      }
    }

    */  
    thisBooking.newBookingsPayload = {};
  }

  
  clickToToggleBooking(tableId){

    /*  clickToToggleBooking is a function runs if a table is clicked.
    For the specific table clicked, it:
    [DONE] 1. checks if it exists in 'booked' OBJ. 
    [DONE] 1.Y If it does, it does nothing.
    [DONE] 1.N If it doesn't, it checks if it exists in 'b-cache' OBJ.
    [DONE] 1.N.N If it does not, it adds it to 'b-cache' OBJ. AND adds class 'tobebooked' and adds a table with its details to the payload OBJ
    [DONE] 1.N.Y If it does, it removes it from 'b-cache' OBJ. AND removes class 'tobebooked' and removes the table with its details from the payload OBJ
    [IN PROGRESS] 2. Send to API
    */  

    const thisBooking = this;

    // A few initial checks and set-ups:
    // 1. Check the duration of booking requested AT THE MOMENT when the table was clicked
    let durationBooked = thisBooking.hoursAmount.correctValue;
    // thisBooking.dom.peopleAmount = thisBooking.dom.wrapper.querySelector(select.booking.peopleAmount);
    // 2. Make sure tableId is numeric
    if(!isNaN(tableId)){
      tableId = parseInt(tableId);
    }

    //  ############### CASE 1 ###############  
    //  1. check if a booking exists in 'booked' OBJ. 

    // console.log('(1) A booking exists:',thisBooking.booked);

    if( 
      (
        typeof thisBooking.booked[thisBooking.date]=='undefined'
      ||
        typeof thisBooking.booked[thisBooking.date][thisBooking.hour]=='undefined') 
      || 
      (
        thisBooking.booked[thisBooking.date][thisBooking.hour].indexOf(tableId) == -1
      )
    ) 
    {
      //  1.N If no booking exists in booked OBJ (the table clicked is available), check if it exists in bookingCache OBJ.
      // console.log('Either no table booked in "booked: obj. or OTHER table booked');
      // console.log('You clicked table',tableId);  
      if((
        typeof thisBooking.bookingCache[thisBooking.date]=='undefined'
        ||
        typeof thisBooking.bookingCache[thisBooking.date][thisBooking.hour]=='undefined') 
        ||
        (
          thisBooking.bookingCache[thisBooking.date][thisBooking.hour].indexOf(tableId) == -1
        )){ 
        // 1.N.N If it does not, it adds it to 'b-cache' OBJ. ...
        thisBooking.makeBooked(thisBooking.bookingCache, thisBooking.date, thisBooking.hour, durationBooked, tableId);
        // AND adds class 'tobebooked'
        thisBooking.updateDOM();
        // console.log('You have just booked table', tableId);
        // ... and updates thisBooking.newBookingsPayload OBJ that will be sent to API:
        // thisBooking.tablesBooked
        // thisBooking.newBookingsPayload['table'] = tableId;
        thisBooking.newBookingsPayload[tableId] = {};
        thisBooking.newBookingsPayload[tableId]['date'] = thisBooking.date;
        thisBooking.newBookingsPayload[tableId]['hour'] = thisBooking.hour;
        thisBooking.newBookingsPayload[tableId]['repeat'] = false;
        thisBooking.newBookingsPayload[tableId]['table'] = tableId;        
        thisBooking.newBookingsPayload[tableId]['duration'] = durationBooked;
        thisBooking.newBookingsPayload[tableId]['ppl'] = thisBooking.peopleAmount.value;
        thisBooking.newBookingsPayload[tableId]['starters'] = [];
        // console.log('newBookingsPayload + 1:',thisBooking.newBookingsPayload);
        for (let starterNode of thisBooking.dom.starters) {
          let starterName = starterNode.value;
          let starterIsSelected = false; 
          starterIsSelected = starterNode.checked;
          if (starterIsSelected){
            thisBooking.newBookingsPayload[tableId]['starters'].push(starterName);
          }
        }        

      } else {    
        // 1.2.Y If it does, it removes it from 'b-cache' OBJ. ...
        thisBooking.unBook(thisBooking.bookingCache, thisBooking.date, thisBooking.hour, tableId);
        // AND removes class 'tobebooked'
        thisBooking.updateDOM();
        // console.log('You have just UNbooked table', tableId);
        // console.log('bookingCache now is', thisBooking.bookingCache);
        delete thisBooking.newBookingsPayload[tableId];
        // console.log('newBookingsPayload - 1:',thisBooking.newBookingsPayload);
      }
    } else {     //  1.Y If no table is booked in 'booked' OBJ at this date OR hour, 
      // console.log('(1.A) You clicked a table that was booked. Nothing happens.');
      // (1.Y) Do nothing!
    }
  }

  sendNewBooking(){
    const thisBooking = this;
    const url = settings.db.url + '/' + settings.db.booking;
    const payload = thisBooking.newBookingsPayload;

    console.log('bookingCache now:', thisBooking.bookingCache);
    console.log('newBookingsPayload now:', thisBooking.newBookingsPayload);
    console.log('payload',payload);
    console.log(' == ORDER SUBMITTED! == ');
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    };

    fetch(url, options)
      .then(function(response){
        return response.json();
      }).then(function(parsedResponse){
        console.log('"ParsedResponse" received in Booking.sendNewBooking:',parsedResponse);
      });
  }

}

export default Booking;