/* global Handlebars, utils, dataSource */

{
  'use strict';

  const select = {
    templateOf: {
      menuProduct: '#template-menu-product',
      cartProduct: '#template-cart-product',
    },
    containerOf: {
      menu: '#product-list',
      cart: '#cart',
    },
    all: {
      menuProducts: '#product-list > .product',
      menuProductsActive: '#product-list > .product.active',
      formInputs: 'input, select',
    },
    menuProduct: {
      clickable: '.product__header',
      form: '.product__order',
      priceElem: '.product__total-price .price',
      imageWrapper: '.product__images',
      amountWidget: '.widget-amount',
      cartButton: '[href="#add-to-cart"]',
    },
    widgets: {
      amount: {
        input: 'input.amount',
        linkDecrease: 'a[href="#less"]',
        linkIncrease: 'a[href="#more"]',
      },
    },
    cart: {
      productList: '.cart__order-summary',
      toggleTrigger: '.cart__summary',
      totalNumber: `.cart__total-number`,
      totalPrice: '.cart__total-price strong, .cart__order-total .cart__order-price-sum strong',
      subtotalPrice: '.cart__order-subtotal .cart__order-price-sum strong',
      deliveryFee: '.cart__order-delivery .cart__order-price-sum strong',
      form: '.cart__order',
      formSubmit: '.cart__order [type="submit"]',
      phone: '[name="phone"]',
      address: '[name="address"]',
    },
    cartProduct: {
      amountWidget: '.widget-amount',
      price: '.cart__product-price',
      edit: '[href="#edit"]',
      remove: '[href="#remove"]',
    },
  };

  const classNames = {  // eslint-disable-line no-unused-vars
    menuProduct: {
      wrapperActive: 'active',
      imageVisible: 'active',
    },
    cart: {
      wrapperActive: 'active',
    },
  };
  
  const settings = {
    amountWidget: {
      defaultValue: 1,  // has to be between 1 and 9 or widget doesn't work
      defaultMin: 1,
      defaultMax: 9,
    },
    cart: {
      defaultDeliveryFee: 20,
    },
  };

  const templates = {
    menuProduct: Handlebars.compile(document.querySelector(select.templateOf.menuProduct).innerHTML),
    cartProduct: Handlebars.compile(document.querySelector(select.templateOf.cartProduct).innerHTML),
  };
  
  
  /* ######### Classes ######### */

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

      console.log('..for prod.:',thisProduct.id);
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
            for(let image of allImagesOfThisProduct){
              /* if the image belongs to the selected option, show it */
              const currentImageClass = image.getAttribute('class');
              // console.log('image:',image);
              // console.log('currentImageClass:',currentImageClass);
              if (currentImageClass.includes(wantedImageClass)) {
                image.classList.add('active');
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
      price *= thisProduct.amountWidget.value;
      /* set the contents of thisProduct.priceElem to be the value of variable price */
      thisProduct.priceElem = price;
      
      thisProduct.element.querySelector(select.menuProduct.priceElem).innerHTML= thisProduct.priceElem;
    }
  
    initAmountWidget() {
      const thisProduct = this;

      thisProduct.amountWidget = new AmountWidget(thisProduct.amountWidgetElem);
      thisProduct.amountWidgetElem.addEventListener('updated', function(){
        thisProduct.processOrder();
        // console.log('initAmountWidget ran.');
      });
    }
  }

  class AmountWidget{
    constructor(element){
      const thisWidget = this;
      
      thisWidget.getElements(element);
      thisWidget.value = settings.amountWidget.defaultValue;
      thisWidget.setValue(thisWidget.input.value);
      thisWidget.initActions();  // Sam to tu dopisalem, w lekcji nie bylo o konieecznosci dopisania tego tu ani slowa
      
      // console.log('AmountWidget:',thisWidget);
      // console.log('constructor arguments:',element);
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
      
      const newValue = parseInt(value);
      const currentValue = parseInt(thisWidget.input.value); // converts inpit to integer
      
      /* Validation here */
      
      // console.log(' ------------ ');
      // console.log('value:',value);
      // console.log('thisWidget.input.value:',thisWidget.input.value);
      // console.log('currentValue:',currentValue);
      // console.log('newValue:',newValue);
      // console.log('defaultMin:',settings.amountWidget.defaultMin);
      // console.log('defaultMax:',settings.amountWidget.defaultMax);
      
      if ((newValue != currentValue) &&
      (newValue >= settings.amountWidget.defaultMin) &&
          (newValue <= settings.amountWidget.defaultMax)){
        thisWidget.value = newValue;
        thisWidget.announce();
      }

      thisWidget.input.value = thisWidget.value;
      // console.log('Qty set to: ' + thisWidget.value);
    }

    initActions(){
      const thisWidget = this;

      // console.log('Event listeners added.');
      thisWidget.input.addEventListener('change', function(event){ // eslint-disable-line no-unused-vars
        thisWidget.setValue(thisWidget.input.value);
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
  
      const event = new Event ('updated');
      thisWidget.element.dispatchEvent(event);
    }
  }

  class Cart{
    constructor(element){
      const thisCart = this;
      thisCart.products = [];
      thisCart.getElements(element);

      console.log('new Cart:',thisCart);
      // console.log('cart wrapper:',thisCart.dom.wrapper);
    }

    getElements(element){
      const thisCart = this;
      thisCart.dom = {};
      thisCart.dom.wrapper = element;
    }
  }

  const app = {
    initMenu: function(){
      const thisApp = this;

      // console.log('thisApp.data:', thisApp.data);
      // const testProduct = new Product();
      // console.log('testProduct:', testProduct);

      for (let productData in thisApp.data.products) {
        new Product(productData, thisApp.data.products[productData]);
      }
    },

    initData: function(){
      const thisApp = this;
      thisApp.data = dataSource;
    },

    initCart: function () {
      const thisApp = this;

      const cartElem = document.querySelector(select.containerOf.cart);
      thisApp.cart = new Cart(cartElem);
    },

    init: function(){
      const thisApp = this;

      console.log(' ');
      console.log('*** App starting ***');
      // console.log('thisApp:', thisApp);
      // console.log('classNames:', classNames);
      // console.log('settings:', settings);
      // console.log('templates:', templates);

      thisApp.initData();
      thisApp.initMenu();
      thisApp.initCart();
    },
  };

  app.init();
}
