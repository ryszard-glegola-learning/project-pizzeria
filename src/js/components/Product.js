import {select, classNames, templates} from '../settings.js'; 
import {utils} from '../utils.js'; 
import AmountWidget from '../components/AmountWidget.js';

class Product{
  constructor(id, data){
    const thisProduct = this;

    thisProduct.id = id;
    thisProduct.data = data;

    thisProduct.renderInMenu();
    thisProduct.getElements();
    thisProduct.initAccordion();
    thisProduct.initOrderForm();
    thisProduct.initAmountWidget();
    thisProduct.processOrder();

    // console.log('[+] Product created:',thisProduct.id);
    // console.log('...details:',thisProduct);
  }

  renderInMenu(){
    const thisProduct = this;

    /* generate HTML based on template */
    const generatedHTML = templates.menuProduct(thisProduct.data);

    /* create DOM element using utils.createElementFromHTML */
    thisProduct.element = utils.createDOMFromHTML(generatedHTML);

    /* find menu container */
    const menuContainer = document.querySelector(select.containerOf.menu);

    /* add DOM element to menu */
    menuContainer.appendChild(thisProduct.element);
    // console.log('thisProduct.element',thisProduct.element);
  }

  getElements(){
    const thisProduct = this;

    thisProduct.accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
    thisProduct.form = thisProduct.element.querySelector(select.menuProduct.form);
    thisProduct.formInputs = thisProduct.element.querySelectorAll(select.all.formInputs);
    thisProduct.cartButton = thisProduct.element.querySelector(select.menuProduct.cartButton);
    thisProduct.priceElem = thisProduct.element.querySelector(select.menuProduct.priceElem);
    thisProduct.imageWrapper = thisProduct.element.querySelector(select.menuProduct.imageWrapper);
    thisProduct.amountWidgetElem = thisProduct.element.querySelector(select.menuProduct.amountWidget);
  }

  initAccordion(){
    const thisProduct = this;
    /* START: click event listener to trigger */
    thisProduct.accordionTrigger.addEventListener('click', function(){
      /* [DONE] prevent default action for event */
      event.preventDefault(); // what does this do?
      /* [DONE] toggle active class on element of thisProduct */
      thisProduct.accordionTrigger.classList.toggle('active'); // This may be needed later, not useful here
      thisProduct.accordionTrigger.parentElement.classList.toggle('active');
      /* [DONE] find all active products */
      const allActiveProducts = document.querySelectorAll(select.all.menuProductsActive);
      /*  [DONE] START LOOP: for each active product */
      for(let activeProduct of allActiveProducts){
        activeProduct.header = activeProduct.querySelector(select.menuProduct.clickable);
        /*  [DONE] START: ### if the active product isn't the element of thisProduct */
        if (activeProduct.header != thisProduct.accordionTrigger) {
        /*     remove class active for the active product */
          activeProduct.header.parentElement.classList.remove('active');
        /*  [DONE] END: ### if the active product isn't the element of thisProduct */
        }
        /* [DONE] END LOOP: for each active product */
      }
      // console.log(' ** END LISTENER ** ');
    });
    /* [DONE] END: click event listener to trigger */
  }

  initOrderForm(){
    const thisProduct = this;
    // console.log('initOrderForm ran!');
    thisProduct.form.addEventListener('submit', function(event){
      event.preventDefault();
      thisProduct.processOrder();
    });

    for(let input of thisProduct.formInputs){
      input.addEventListener('change', function(){
        thisProduct.processOrder();
      });
    }

    thisProduct.cartButton.addEventListener('click', function(event){
      event.preventDefault();
      thisProduct.processOrder();
      thisProduct.addToCart();
    });
  }
  
  processOrder(){
    const thisProduct = this;
    // console.log(' ');
    // console.log(' ');
    // console.log(' ##### ANOTHER PROD. #####');
    // console.log('thisProduct is', thisProduct.id);
    // console.log('processOrder ran in ' + thisProduct.id + ':');
    // console.log('thisProduct.data:',thisProduct.data);
    
    /* read all data from the form (using utils.serializeFormToObject) and save it to const formData */
    const formData = utils.serializeFormToObject(thisProduct.form);
    // console.log('formData:', formData);
    
    thisProduct.params = {};
    /* set variable price to equal thisProduct.data.price */
    let price = thisProduct.data.price;
    // console.log('price:', price);
    
    /* START LOOP: for each paramId in thisProduct.data.params */
    for (let paramId in thisProduct.data.params){
    /* save the element in thisProduct.data.params with key paramId as const param */
      const param = thisProduct.data.params[paramId];

      /* START LOOP: for each optionId in param.options */
      for (let optionId in param.options){
        // console.log(' - - - ');
        // console.log('paramId:',paramId);
        /* save the element in param.options with key optionId as const option */
        const option = optionId;
        // console.log('optionId:',option);

        /* change the value of options[option].default to false where it is undefined */
        if (!param.options[option].default) {
          param.options[option].default = false;
        }

        // Tip no. 3 follows...
        const optionSelected = formData.hasOwnProperty(paramId) && formData[paramId].indexOf(optionId) > -1;
        
        // console.log('optionSelected:',optionSelected);
        /* create const to store a list of images: .parameter-option */
        const allImagesOfThisProduct = thisProduct.element.querySelector(select.menuProduct.imageWrapper).querySelectorAll('img');
        // console.log('allImagesOfThisProduct',allImagesOfThisProduct);

        /* START IF: if option is selected and option is not default */
        if(optionSelected && !option.default){
          // end of Tip no. 3.
          /* add price of option to variable price */
          price = price + param.options[option].price;
          /* END IF: if option is selected and option is not default */
          /* START ELSE IF: if option is not selected and option is default */
        } else if (!optionSelected && option.default) {
          /* deduct price of option from price */
          price = price - param.options[option].price;
        /* END ELSE IF: if  option is not selected and option is default */
        }

        /* Image handling part */
        const wantedImageClass = paramId + '-' + optionId;
        // console.log('wantedImageClass:',wantedImageClass);
        if(optionSelected){
          /* go through allImagesOfThisProduct */
          /* NEW code: Cart support */
          if(!thisProduct.params[paramId]){
            thisProduct.params[paramId] = {
              label: param.label,
              options: {},
            }; 
          }; // eslint-disable-line no-extra-semi
          
          thisProduct.params[paramId].options[optionId] = param.options[option].label; // my fix, bootcamp instructed right side of assignment to be option.label - but it returned 'undefined'
          /* NEW ends here */
          for(let image of allImagesOfThisProduct){
            /* if the image belongs to the selected option, show it */
            const currentImageClass = image.getAttribute('class');
            // console.log('image:',image);
            // console.log('currentImageClass:',currentImageClass);
            if (currentImageClass.includes(wantedImageClass)) {
              image.classList.add(classNames.menuProduct.imageVisible);
            }
          }
        } else {
          /* go through allImagesOfThisProduct */
          for(let image of allImagesOfThisProduct){
            /* if the image belongs to the selected option, show it */
            const currentImageClass = image.getAttribute('class');
            // console.log('image:',image);
            // console.log('currentImageClass:',currentImageClass);
            
            /* split class list into array */
            const currentImageClassesArray = currentImageClass.split(' ');
            let thisTheClass = false;
            for(let className of currentImageClassesArray){
              if(className == wantedImageClass){
                thisTheClass = true;
              }
            }
            // console.log('image.classList',image.classList);
            if (thisTheClass) {
              image.classList.remove('active');
            }
          }
        }
        
        /* end of Image handling*/
        /* END LOOP: for each optionId in param.options */
      }
      
      /* END LOOP: for each paramId in thisProduct.data.params */
    }
    
    /* multiply price by quantity */
    thisProduct.priceSingle = price;
    thisProduct.price = thisProduct.priceSingle * thisProduct.amountWidget.value;
    /* set the contents of thisProduct.priceElem to be the value of variable price */
    thisProduct.priceElem = thisProduct.price;
    // console.log('thisProduct.priceElem.innerHTML:',thisProduct.priceElem.innerHTML);
    // console.log('thisProduct.priceElem',thisProduct.priceElem);
    thisProduct.element.querySelector(select.menuProduct.priceElem).innerHTML= thisProduct.priceElem;
    // console.log('thisProduct.params:',thisProduct.params);
  }

  initAmountWidget() {
    const thisProduct = this;

    thisProduct.amountWidget = new AmountWidget(thisProduct.amountWidgetElem,thisProduct.quantity);
    thisProduct.amountWidgetElem.addEventListener('updated', function(){
      thisProduct.processOrder();
      // console.log('initAmountWidget in Prod. ran, so processOrder ran.');
    });
  }

  addToCart(){
    const thisProduct = this;

    thisProduct.name = thisProduct.data.name;
    thisProduct.quantity = thisProduct.amountWidget.value;   // In the BOOTCAMP this property is called thisProduct.amount

    // app.cart.add(thisProduct);
    /* BOOTCAMP: ta metoda przekazuje całą instancję produktu jako argument metody app.cart.add. W app.cart zapisaliśmy instancję klasy Cart:   
    thisApp.cart = new Cart(cartElem);
    dlatego tu w ten sposób odwołujemy się do jej metody add, którą zapisaliśmy w klasie Cart jako add(menuProduct). Metoda add otrzyma więc odwołanie do instancji produktu, dzięki czemu będzie mogła odczytywać jej właściwości i wykonywać jej metody. W metodzie add ta instancja produktu będzie dostępna jako menuProduct. */

    // Q2P Dlaczego "importowanie obiektu app z app.js do innego pliku nie jest dobrym podejściem?"

    const event = new CustomEvent('add-to-cart', {
      bubbles: true,
      detail: {
        product: thisProduct,
      },
    });

    thisProduct.element.dispatchEvent(event);  // event defined above is invoked on the DOM element specified
  }
}

export default Product;