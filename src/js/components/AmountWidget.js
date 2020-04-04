import {settings, select} from '../settings.js'; 

class AmountWidget{
  constructor(element,initQuantity = null){ // I can pass initQuantity optionally
    const thisWidget = this;

    // console.log('[x] AmountWidget ran.');
    // console.log('- initQuantity passed:',initQuantity);
    // console.log('- thisWidget.value passed:',thisWidget.value);
    thisWidget.getElements(element);

    if ((!thisWidget.value) && (!initQuantity)){ // if both are undefined or both exist:
      if (!thisWidget.value) { //... then do this test to check if both are undefined and if this is true, assign amountWidget.defaultValue: 
        thisWidget.value = settings.amountWidget.defaultValue;
      }
    } else { // otherwise one of them exists, which one? Find out:
      if (!thisWidget.value) { // if this is undefined - that means initQuantity exists:
        thisWidget.value = initQuantity;
      } // otherwise thisWidget.value exists and  no  initQuantity was passed, so do nothing.
    }      
      
    // console.log('thisWidget.value is now:',thisWidget.value);
    thisWidget.setValue(thisWidget.input.value);
    thisWidget.initActions(); 
  }
  
  getElements(element){
    const thisWidget = this;

    thisWidget.element = element;
    thisWidget.input = thisWidget.element.querySelector(select.widgets.amount.input);
    thisWidget.linkDecrease = thisWidget.element.querySelector(select.widgets.amount.linkDecrease);
    thisWidget.linkIncrease = thisWidget.element.querySelector(select.widgets.amount.linkIncrease);
  }

  setValue(value){
    const thisWidget = this;
    // console.log('thisWidget.value:',thisWidget.value);
    // console.log('New value received:',value);
    // console.log('New value from input:',thisWidget.input.value);
    const newValue = parseInt(value);
    // console.log('Parsed to newValue:',newValue);
    // this line previously: 
    // const currentValue = parseInt(thisWidget.input.value); 
    // ... converts input to integer
    const currentValue = parseInt(thisWidget.value); 
    // console.log('currentValue:',currentValue);

    /* Validation here */
    
    // console.log(' ------------ ');
    // console.log(' [x] setValue ran.  ');
    // console.log('currentValue after parsing:',currentValue);
    // console.log('defaultMin:',settings.amountWidget.defaultMin);
    // console.log('defaultMax:',settings.amountWidget.defaultMax);
    
    if ((newValue != currentValue) &&
    (newValue >= settings.amountWidget.defaultMin) &&
        (newValue <= settings.amountWidget.defaultMax)){
      thisWidget.value = newValue;
      thisWidget.announce();
    }

    thisWidget.input.value = thisWidget.value;
    // console.log('New input value:', thisWidget.input.value);
    // console.log('Qty set to: ' + thisWidget.value);
  }

  initActions(){
    const thisWidget = this;

    // console.log('Event listeners added.');
    thisWidget.input.addEventListener('change', function(event){  // eslint-disable-line no-unused-vars
      thisWidget.setValue(thisWidget.input.value);
      // console.log('thisWidget input value:',thisWidget.input.value);
      // console.log('Quantity changed!');
    });

    thisWidget.linkDecrease.addEventListener('click', function(event){
      event.preventDefault();
      thisWidget.setValue(thisWidget.value - 1);
      // console.log('Quantity decreased!');
    });

    thisWidget.linkIncrease.addEventListener('click', function(event){
      event.preventDefault();
      thisWidget.setValue(thisWidget.value + 1);
      // console.log('Quantity increased!');
    });
  }

  announce(){
    const thisWidget = this;

    const event = new CustomEvent ('updated', {
      bubbles: true
    });

    thisWidget.element.dispatchEvent(event);
  }
}

export default AmountWidget;