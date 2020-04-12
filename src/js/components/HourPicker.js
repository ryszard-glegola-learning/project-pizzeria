import {settings, select} from '../settings.js'; 
import {utils} from '../utils.js'; 
import BaseWidget from './BaseWidget.js';

class HourPicker extends BaseWidget{
  constructor(hourWrapper){
    super(hourWrapper, settings.hours.open);
    const thisWidget = this;

    thisWidget.dom.input = thisWidget.dom.wrapper.querySelector(select.widgets.hourPicker.input);
    thisWidget.dom.output = thisWidget.dom.wrapper.querySelector(select.widgets.hourPicker.output);

    // console.log('thisWidget.dom.input:',thisWidget.dom.input);
    // console.log('thisWidget.dom.output:',thisWidget.dom.output);

    thisWidget.initPlugin();
    thisWidget.value = thisWidget.dom.input.value;
    
  }

  initPlugin() {
    const thisWidget = this;

    // eslint-disable-next-line no-undef
    rangeSlider.create(thisWidget.dom.input);
    // console.log('thisWidget.dom.input:',thisWidget.dom.input);
    thisWidget.dom.input.addEventListener('input', function(){
      thisWidget.value = thisWidget.dom.input.value;
    });
  }

  parseValue(value){
    return utils.numberToHour(value);
  }

  isValid(){
    return true;
  }

  renderValue(){
    const thisWidget = this;
    // console.log('thisWidget.dom.output.innerHTML',thisWidget.dom.output.innerHTML);
    thisWidget.dom.output.innerHTML = thisWidget.value;
  }
}

export default HourPicker;