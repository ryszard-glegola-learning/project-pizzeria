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
    // console.log('parseData run.');
    thisBooking.booked = {};

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

    // console.log('thisBooking.booked:',thisBooking.booked); // Shows the entire booked object, cool!

    thisBooking.updateDOM();
  }

  makeBooked(date, hour, duration, table){
    const thisBooking = this;
    // console.log('makeBooked run.');
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

  updateDOM(){
    const thisBooking = this;
    thisBooking.date = thisBooking.datePicker.value; // This date is imported from DatePicker, used to be in wrong format if PICK A DATE drop-down was used to select the date
    // console.log('updateDOM Date:',thisBooking.date); 
    thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);

    let allAvailable = false;

    /*
    // This was meant to check date format - it had to be 10-char string. If not, convert to it. Now this is no longer needed:
    if (typeof thisBooking.date[0] == 'undefined'){
      thisBooking.date = utils.dateToStr(thisBooking.date);
    }
    */

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
  }

  
  /* addToBookingCache(bookingCacheObject, date, hour, duration, tableId){
    const thisBooking = this;
    // console.log('addToBookingCache run.');
    let success = false;
  
    if(
      typeof thisBooking.booked[date] == 'undefined'
      &&
      typeof thisBooking.bookingCacheObject[date] == 'undefined'
    ){
      thisBooking.bookingCacheObject[date] = {};
    }

    const startHour = utils.hourToNumber(hour);

    for(let hourBlock = startHour; hourBlock < startHour + duration; hourBlock += 0.5){

      if(
        typeof thisBooking.booked[date][hourBlock] == 'undefined'
        &&
        typeof thisBooking.bookingCacheObject[date][hourBlock] == 'undefined'
      ){
        thisBooking.bookingCacheObject[date][hourBlock] = [];
        thisBooking.bookingCacheObject[date][hourBlock].push(tableId);
        success = true;
      } else {
        success = false;
      }

      return success;

    }
  }
  */


  initWidgets(){
    const thisBooking = this;
    // console.log('initWidgets run.');
    thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
    thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);

    thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker);
    thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker);   

    thisBooking.dom.wrapper.addEventListener('updated', function(){
      thisBooking.updateDOM();
      // console.log('initWidgets - DOM updated.',);
    });

    // Add a listener to each table 
    for (let table of thisBooking.dom.tables) {
      let tableId = table.getAttribute(settings.booking.tableIdAttribute);
      table.addEventListener('click', function(){
        if (tableId != 'undefined') {
          // thisBooking.clickToToggleBooking(tableId);
          console.log('Table ' + tableId + ' clicked!');
        }
      }); 
    }
  }
  
  /* Create object for temporary booking changes, to be posted to DB */

  /* === SUBTASK 11.3.1: Select and book or unselect a table by clicking === */

  /* This function runs if a table is clicked: */
  
  clickToToggleBooking(tableId){
    const thisBooking = this;
  
    const bookingCache = {};
    // eslint-disable-next-line no-unused-vars
    let bookingAddSuccess = false;
    
    for (let table of thisBooking.dom.tables){
      const tableIdAttr = table.getAttribute(settings.booking.tableIdAttribute);
      
      thisBooking.hoursAmountWidget = new AmountWidget(thisBooking.dom.hoursAmount,settings.booking.hoursAmountDefault);

      // console.log('thisBooking.hoursAmountWidget',thisBooking.hoursAmountWidget);
      // The following is the actual value in INPUT box of widget HOURS 
      const durationBooked = thisBooking.hoursAmountWidget.dom.input.value;

      if (tableIdAttr == tableId){
        // console.log('Table ID found!',tableId);

        /* if this is NOT the table clicked ... 
        if(
          !thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)
        ){
          /* Change the class to Active 
          table.classList.add(classNames.booking.tableBooked);
          // console.log('Table booked',tableId);
          // console.log('Date booked:',thisBooking.datePicker.value);
          // console.log('Hour booked:',thisBooking.hourPicker.value);
          // console.log('Duration booked:',durationBooked);
          
          /* Check in the booked object if booking can be made and if it can, add it to the booking cache object 
          bookingAddSuccess = thisBooking.addToBookingCache(bookingCache, thisBooking.datePicker.value, thisBooking.hourPicker.value, durationBooked, tableId);
        
        } else {
          table.classList.remove(classNames.booking.tableBooked);
          // console.log('Table unbooked',tableId);
        }         
      }
      
    }
    */
    /*     Check table id, date, time, duration */
    /*     Check if table is available (fetch) */
    /*         If available, make active and add booking */
    /* If clicked (in same browser session) but available (not in 'bookings') because clicked to book in same browser session, make inactive */
    /* If not available, add class table occupied (1s transition)  */
      
      }
    }
  }
}

export default Booking;