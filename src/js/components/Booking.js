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

    thisBooking.dom.form = thisBooking.dom.wrapper.querySelector(select.booking.form);
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
      // console.log('initWidgets - DOM updated.',);
    });

    thisBooking.bookingCache = {};
    console.log('INIT bookingCache:',thisBooking.bookingCache);

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
      // thisBooking.sendBookingToAPI(); // This method does not exist yet
    });   

    console.log('INIT END bookingCache:',thisBooking.bookingCache);
  }
  
  /* Create object for temporary booking changes, to be posted to DB */

  /* === SUBTASK 11.3.1: Select and book or unselect a table by clicking === */

  /*  clickToToggleBooking is a function runs if a table is clicked.
      For the specific table clicked, it:
      [DONE] - checks if it exists in 'booked' OBJ. 
      [DONE]-- If it does, it does nothing.
      -- If it doesn't, it checks if it exists in 'b-cache' OBJ.
      ---  If it does, it removes it from 'b-cache' OBJ. AND removes class 'tobebooked'
      ---  If it does not, it adds it to 'b-cache' OBJ. AND adds class 'tobebooked'
  */  
  
  clickToToggleBooking(tableId){
    const thisBooking = this;

    console.log(' # # # # # ');

    // A few initial checks and set-ups:
    // 1. Check the duration of booking requested AT THE MOMENT when the table was clicked
    thisBooking.hoursAmountWidget = new AmountWidget(thisBooking.dom.hoursAmount,settings.booking.hoursAmountDefault);
    let durationBooked = thisBooking.hoursAmountWidget.dom.input.value;
    // 2. Make sure tableId is numeric
    if(!isNaN(tableId)){
      tableId = parseInt(tableId);
    }

    //  ############### CASE 1 ###############  
    //  No table is booked in 'booked' OBJ at this date OR hour, 

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
      console.log('Either no table booked or OTHER table booked:',);
      console.log('tableId is',tableId);
      
      if(
        typeof thisBooking.booked[thisBooking.date]=='undefined'
        ||
        typeof thisBooking.booked[thisBooking.date][thisBooking.hour]=='undefined'){ 
        console.log('... no booked table exists in booked OBJ'); 
        // OK, let's remember thisBooking.booked[thisBooking.date][thisBooking.hour] won't work and that ANY table can be added to b-cache OBJ and let's look at b-cache OBJ now.
        // Add thi
      } else {
        // OK, let's remember the booked table cannot be styled as toBeBooked and cannot be added to b-cache OBJ and let's move on to look at b-cache OBJ now.
        console.log('... a booked table exists in booked OBJ'); 
        console.log('booked[date][hour] is ',thisBooking.booked[thisBooking.date][thisBooking.hour]);
      }
      // 
    } else {
      console.log('You clicked a table that was booked',);
      // Do nothing!
    }

    
    /*
      //for (let table of thisBooking.dom.tables){
      // Pass table ID to clickToToggleBooking in tableId
      const tableIdAttr = table.getAttribute(settings.booking.tableIdAttribute);      

      // Check the duration of booking requested
      thisBooking.hoursAmountWidget = new AmountWidget(thisBooking.dom.hoursAmount,settings.booking.hoursAmountDefault);
      // The following is the actual value in INPUT box of widget HOURS 
      // eslint-disable-next-line no-unused-vars
      let durationBooked = thisBooking.hoursAmountWidget.dom.input.value;

      // Check if this table is the table clicked - and do it all for the table clicked only
      if (tableIdAttr == tableId){

        //  ############### CASE 1 ###############  
        // If no table is booked at this date OR hour, 
        objects and arrays will have to be created 

        if(
          typeof thisBooking.booked[thisBooking.date]=='undefined'
          ||
          typeof thisBooking.booked[thisBooking.date][thisBooking.hour]=='undefined'
        ){
          console.log(' = = = = = = = ');
          console.log('CASE 1 - no booking exists on DATE or HOUR');
          
          // Toggle the table colour - CHANGE this!
          const tableClassesNow = table.classList.value; // ha, this returns a STRING
          if (tableClassesNow.includes(classNames.booking.tableToBeBooked)){
            table.classList.remove(classNames.booking.tableToBeBooked);
            console.log('Table was booked, now it is NOT');
          } else {
            table.classList.add(classNames.booking.tableToBeBooked);
            console.log('Table was not booked, now it IS');
          }

          // * add it to the booking cache object
          // 1. If no booking exists on this date, create an OBJECT bookingCache[date]
          

          if (  // This will be TRUE if no booking exists on this DATE
            typeof thisBooking.booked[thisBooking.date]=='undefined'){
            console.log('booked[date] was undefined, creating the thisBooking.date object.');
            thisBooking.bookingCache[thisBooking.date] = {};
          }

          // If any booking exists on this date, an OBJECT bookingCache[date] will exist, so the above part won't be needed and we can add an hour ARRAY to it straight away:
          
          if (  // This will be TRUE if no booking exists on this HOUR
            typeof thisBooking.booked[thisBooking.date][thisBooking.hour]=='undefined'){
            console.log('booked[date][hour] was undefined');
            // Start by creating an object for the current date.
            thisBooking.bookingCache[thisBooking.date] = {};
          }

          // OK, now an object exists for the current date.
          // We'll add arrays for each hour block in a moment.
          // Let's first prep the tableId and startHour to make sure they are numeric.

          let tableId = table.getAttribute(settings.booking.tableIdAttribute);
          if(!isNaN(tableId)){
            tableId = parseInt(tableId);
          }
        
          const startHour =  thisBooking.hour;
          if(!isNaN(durationBooked)){
            durationBooked = parseInt(durationBooked);
          }
                  
          // And now let's add hourblocks for each 30 mins of the duration booked.

          for(let hourBlock = startHour; hourBlock < startHour + durationBooked; hourBlock += 0.5)
          {
            thisBooking.bookingCache[thisBooking.date][hourBlock] = [];
            thisBooking.bookingCache[thisBooking.date][hourBlock].push(tableId);
          }

          console.log('Now bookingCache obj. contains:',thisBooking.bookingCache);

          // thisBooking.addToBookingCache(bookingCache, thisBooking.datePicker.value, thisBooking.hourPicker.value, durationBooked, tableId);

          // console.log('Table booked',tableId);
          // console.log('Date booked:',thisBooking.datePicker.value);
          // console.log('Hour booked:',thisBooking.hourPicker.value);
          // console.log('Duration booked:',durationBooked);

          
          //  ############### CASE 2 ############### 

          // If a table is booked at this date AND hour, simply add another booking 


        } else if (
          !thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)){
          console.log('CASE 2 - a booking exists');
          
          // Toggle the table colour - use the temporary toBeBooked style
          const tableClassesNow = table.classList.value; // returns a STRING
          if (tableClassesNow.includes(classNames.booking.tableToBeBooked)){
            table.classList.remove(classNames.booking.tableToBeBooked);
            console.log('Table was booked, now it is NOT');
          } else {
            table.classList.add(classNames.booking.tableToBeBooked);
            console.log('Table was not booked, now it IS');
          }

          // Check in the booked object if booking can be made and if it can:
          // add it to the booking cache object 
          thisBooking.bookingCache[thisBooking.date] = thisBooking.date;
          console.log('1. bookingCache: ',thisBooking.bookingCache);
          console.log('bookingCache[date]',thisBooking.bookingCache[thisBooking.date]);

          thisBooking.bookingCache[thisBooking.date] = {};
          thisBooking.bookingCache[thisBooking.date][thisBooking.hour] = [];
          if(!isNaN(tableId)){
            tableId = parseInt(tableId);
          }
          thisBooking.bookingCache[thisBooking.date][thisBooking.hour].push(tableId);
          console.log('WAR. 2: bookingCache: ',thisBooking.bookingCache);

          // thisBooking.addToBookingCache(bookingCache, thisBooking.datePicker.value, thisBooking.hourPicker.value, durationBooked, tableId);

          // console.log('Table booked',tableId);
          // console.log('Date booked:',thisBooking.datePicker.value);
          // console.log('Hour booked:',thisBooking.hourPicker.value);
          // console.log('Duration booked:',durationBooked);

        } else {
          table.classList.remove(classNames.booking.tableToBeBooked);
          // console.log('Table unbooked',tableId);
        }         
      }
      
    }
    
    //     Check table id, date, time, duration 
    //     Check if table is available (fetch) 
    //         If available, make active and add booking 
    // If clicked (in same browser session) but available (not in 'bookings') because clicked to book in same browser session, make inactive 
    // If not available, add class table occupied (1s transition) 
      
    */

  
  }

}

export default Booking;