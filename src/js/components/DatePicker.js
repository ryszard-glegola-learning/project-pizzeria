import {settings, select} from '../settings.js'; 
import {utils} from '../utils.js'; 
import BaseWidget from './BaseWidget.js';

class DatePicker extends BaseWidget{
  constructor(dateWrapper){
    super(dateWrapper, utils.dateToStr(new Date()));

    const thisWidget = this;

    console.log('Date wrapper',dateWrapper);
    thisWidget.dom.input = thisWidget.dom.wrapper.querySelector(select.widgets.datePicker.input);
    console.log('Date tW.dom.input:',thisWidget.dom.input);
    thisWidget.initPlugin();
  }

  initPlugin() {
    const thisWidget = this;
    
    thisWidget.minDate = new Date(thisWidget.value);
    console.log('minDate:',thisWidget.minDate);
    thisWidget.maxDate = utils.addDays(utils.dateToStr(thisWidget.minDate), settings.datePicker.maxDaysInFuture);
    console.log('maxDate:',thisWidget.maxDate);

    const flatpickrOptions = {
      defaultDate: thisWidget.minDate,
      minDate: thisWidget.minDate,
      maxDate: thisWidget.maxDate,
      disable: [
        function(date) {
          // return true to disable
          return (date.getDay() === 1);
        }
      ],
      locale: {
        'firstDayOfWeek': 1 // start week on Monday
      },
      onChange: function(dateStr){
        thisWidget.value = dateStr;
        console.log('thisWidget.value',thisWidget.value);
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