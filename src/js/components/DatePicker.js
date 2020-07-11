import {settings, select} from '../settings.js'; 
import {utils} from '../utils.js'; 
import BaseWidget from './BaseWidget.js';


class DatePicker extends BaseWidget{
  constructor(dateWrapper){
    super(dateWrapper, utils.dateToStr(new Date()));

    const thisWidget = this;

    // console.log('Date wrapper',dateWrapper);
    thisWidget.dom.input = thisWidget.dom.wrapper.querySelector(select.widgets.datePicker.input);
    // console.log('Date tW.dom.input:',thisWidget.dom.input);
    thisWidget.initPlugin();
  }

  initPlugin() {
    const thisWidget = this;
    
    thisWidget.minDate = new Date(thisWidget.value);
    // console.log('minDate:',thisWidget.minDate);
    thisWidget.maxDate = utils.addDays(utils.dateToStr(thisWidget.minDate), settings.datePicker.maxDaysInFuture);
    // console.log('maxDate:',thisWidget.maxDate);

    const flatpickrOptions = {
      defaultDate: thisWidget.minDate,
      minDate: thisWidget.minDate,
      maxDate: thisWidget.maxDate,
      disable: [
        function(date) {
          // return true to disable days
          // (date.getDay() === 1) disables Mondays, etc.
          return (date.getDay() === 1);
        }
      ],
      locale: {
        'firstDayOfWeek': 1 // start week on Monday
      },
      onChange: function(dateStr){
        console.log('DatePicker input dateStr:',dateStr);
        thisWidget.value = utils.addDays(utils.dateToStr(dateStr[0]),1); // Issue with Datepicker worked around:  one day added
        thisWidget.value = utils.dateToStr(thisWidget.value); // Converts 'Sun Jul 19 2020 02:00:00 GMT+0200 (czas środkowoeuropejski letni)' to 2020-07-19
        console.log('DatePicker output thisWidget.value:',thisWidget.value);        
        thisWidget.announce();
      },    
    };

    // eslint-disable-next-line no-undef
    flatpickr(thisWidget.dom.input, flatpickrOptions);
  }

  parseValue(arg){
    return(arg); 
  }

  isValid(){
    return true;
  }

  renderValue(){
    return true;
  }

}

export default DatePicker;