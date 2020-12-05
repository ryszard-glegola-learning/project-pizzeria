import {select, templates, settings, classNames} from '../settings.js'; 
import {utils} from '../utils.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';


class Booking{
  constructor(wrapper){
    const thisBooking = this;

    thisBooking.render(wrapper);
    thisBooking.initWidgets();
    thisBooking.getData();
  }

  getData(){
    const thisBooking = this;
    thisBooking.booked = {};
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

    for(let item of bookings){
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }
    
    for(let item of eventsCurrent){
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    const minDate = thisBooking.datePicker.minDate;
    const maxDate = thisBooking.datePicker.maxDate;

    for(let item of eventsRepeat){
      if(item.repeat == 'daily'){
        for(let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate,1)){
          thisBooking.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table);
        }
      }
    }
    thisBooking.updateDOM();
  }

  makeBooked(date, hour, duration, table){  // runs once, fills the empty 'booked' with bookings
    const thisBooking = this;

    if(typeof thisBooking.booked[date] == 'undefined'){
      thisBooking.booked[date] = {};
    }

    const startHour = utils.hourToNumber(hour);

    for(let hourBlock = startHour; hourBlock < startHour + duration; hourBlock += 0.5){

      if(typeof thisBooking.booked[date][hourBlock] == 'undefined'){
        thisBooking.booked[date][hourBlock] = [];
      }
  
      thisBooking.booked[date][hourBlock].push(table);

    }
  }

  addToBookingCache(bookingCacheObject, date, hour, duration, tableId){
    const thisBooking = this;
    let success = false;
    console.log('addToBookingCache started.',bookingCacheObject);

    for(let hourBlock = hour; hourBlock < hour + duration; hourBlock += 0.5){
      thisBooking.bookingCacheObject[date] = {};
      thisBooking.bookingCacheObject[date][hourBlock] = [];
      thisBooking.bookingCacheObject[date][hourBlock].push(tableId);
      success = true;
    }

    console.log('bookingCacheObject',bookingCacheObject);

    return success;

  }

  updateDOM(){
    const thisBooking = this;
    thisBooking.date = thisBooking.datePicker.value;
    // console.log('updateDOM thisBooking.date',thisBooking.date);
    thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);

    let allAvailable = false;

    if(
      typeof thisBooking.booked[thisBooking.date] == 'undefined'
      ||
      typeof thisBooking.booked[thisBooking.date][thisBooking.hour] == 'undefined' 
    ){
      allAvailable = true;
    }

    // console.log(' === check == ');
    // console.log('allAvailable:',allAvailable);
    // console.log('Date:',thisBooking.date);
    // console.log('Hour:',thisBooking.hour);

    for(let table of thisBooking.dom.tables){
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
  }


  render(booking){
    const thisBooking = this;

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
  }

  initWidgets(){
    const thisBooking = this;
    console.log('initWidgets run.');
    thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
    thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);

    thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker);
    thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker);   
    
    thisBooking.dom.wrapper.addEventListener('updated', function(){
      thisBooking.updateDOM();
    });

    /* Add a listener to each table */
    for (let table of thisBooking.dom.tables) {
      let tableId = table.getAttribute(settings.booking.tableIdAttribute);
      table.addEventListener('click', function(){
        if (tableId != 'undefined') {
          console.log('Clicked table ',tableId);
          thisBooking.clickToToggleBooking(tableId);
        } else {
          console.log('initWidgets - tableId is undefined.');
        }
      });
    }

    /* Create object for temporary booking changes, to be posted to DB */
    
  }

  /* === SUBTASK 11.3.1: Select and book or unselect a table by clicking === */

  /* This runs if a table is clicked: */
  /* // MAKE SURE TABLES CANNOT BE BOOKED on days when restaurant is closed, e.g. Mondays - flatpickrOptions.disable */

  clickToToggleBooking(tableId){
    const thisBooking = this;
    thisBooking.newBookingCache = {};
    
    // Obtain the current value in INPUT box of widget HOURS and call it durationBooked
    thisBooking.hoursAmountWidget = new AmountWidget(thisBooking.dom.hoursAmount,settings.booking.hoursAmountDefault);
    // eslint-disable-next-line no-unused-vars
    const durationBooked = thisBooking.hoursAmountWidget.dom.input.value;

    // Check if the table clicked is available
    thisBooking.date = thisBooking.datePicker.value;
    thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);

    for(let table of thisBooking.dom.tables){
      let clickedTableId = table.getAttribute(settings.booking.tableIdAttribute);
      if(!isNaN(clickedTableId)){
        clickedTableId = parseInt(clickedTableId);
      }

      if (clickedTableId == tableId){
        console.log('thisBooking.booked',thisBooking.booked);
        console.log('thisBooking.date',thisBooking.date);
        console.log('thisBooking.hour',thisBooking.hour);

        if (
          typeof thisBooking.booked[thisBooking.date] == 'undefined'
          ||
          // 1. If either no table is booked at this hour
          typeof thisBooking.booked[thisBooking.date][thisBooking.hour] == 'undefined'
          || // or, if a table is booked, it's not the table with tableId
          !thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)
        )// TO DO: and the table has not been clicked previously 
        { // ... then change it to active
          table.classList.add(classNames.booking.tableBooked);
          // ... and add it to newBookingCache
          thisBooking.addToBookingCache(thisBooking.newBookingCache, thisBooking.date, thisBooking.hour, thisBooking.hoursAmountWidget.dom.input.value, tableId);
          console.log('newBookingCache now contains:',thisBooking.newBookingCache);
        } else {
          console.log('clickToToggleBooking - could not add');
        }
      }
      
      // Check in the booked object if booking can be made and if it can, add it to the booking cache object 
      
      /**     Check table id, date, time, duration */
      /**     Check if table is available (fetch) */
      /*         If available, make active and add booking */
      /* If clicked (in same browser session) but available (not in 'bookings') because clicked to book in same browser session, make inactive */
      /* If not available, add class table occupied (1s transition) */
      // console.log('Run updateDOM now --',);
    }

  }
}
export default Booking;