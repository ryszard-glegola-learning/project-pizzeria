import {select, templates} from '../settings.js'; 
import AmountWidget from './AmountWidget.js';


class Booking{
  constructor(booking){
    const thisBooking = this;

    thisBooking.render(booking);
    thisBooking.initWidgets();
  }

  render(booking){
    const thisBooking = this;

    /* generate HTML using templates.bookingWidget, no args?? 
    templates.bookingWidget = Handlebars.compile(document.querySelector(select.templateOf.bookingWidget).innerHTML)*/
    const generatedHTML = templates.bookingWidget();
    
    /* create an empty object thisBooking.dom */
    thisBooking.dom = {};

    /* assign a 'wrapper' property equal to this method's arg to thisBooking.dom */
    thisBooking.dom.wrapper = booking;
    
    /* assign HTML code generated using template to innerHTML of that wrapper */
    thisBooking.dom.wrapper.innerHTML = generatedHTML;

    /* create thisBooking.dom.peopleAmount and use it to store the single element found in the wrapperze that matches select.booking.peopleAmount, */
    thisBooking.dom.peopleAmount = thisBooking.dom.wrapper.querySelector(select.booking.peopleAmount);

    /* create thisBooking.dom.hoursAmount and use it to store the single element found in the wrapperze that matches select.booking.hoursAmount, */
    thisBooking.dom.hoursAmount = thisBooking.dom.wrapper.querySelector(select.booking.hoursAmount);    
  }

  initWidgets(){
    const thisBooking = this;

    thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
    thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);
  }
}

export default Booking;