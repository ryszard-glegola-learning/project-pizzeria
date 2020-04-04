/* global Handlebars, utils */ 

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

  const classNames = {
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
    db: {
      url: '//localhost:3131',
      product: 'product',
      order: 'order',
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
      thisProduct.quantity = thisProduct.amountWidget.value; 
      // In the BOOTCAMP this property is called thisProduct.amount

      app.cart.add(thisProduct);
      /* BOOTCAMP: ta metoda przekazuje całą instancję produktu jako argument metody app.cart.add. W app.cart zapisaliśmy instancję klasy Cart:   
      thisApp.cart = new Cart(cartElem);
      dlatego tu w ten sposób odwołujemy się do jej metody add, którą zapisaliśmy w klasie Cart jako add(menuProduct). Metoda add otrzyma więc odwołanie do instancji produktu, dzięki czemu będzie mogła odczytywać jej właściwości i wykonywać jej metody. W metodzie add ta instancja produktu będzie dostępna jako menuProduct. */

      // console.log(' ...details:',thisProduct);
    
    }
  }

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

  class Cart{
    constructor(element){
      const thisCart = this;
      thisCart.products = [];
      thisCart.getElements(element);
      thisCart.initActions();
      thisCart.deliveryFee = settings.cart.defaultDeliveryFee;
      // console.log('[+] Cart created.');
      // console.log('...details:',thisCart);      
    }

    getElements(element){
      const thisCart = this;
      thisCart.dom = {};
      thisCart.dom.wrapper = element;
      thisCart.dom.toggleTrigger = thisCart.dom.wrapper.querySelector(select.cart.toggleTrigger);
      thisCart.dom.productList = thisCart.dom.wrapper.querySelector(select.cart.productList);
      thisCart.renderTotalsKeys = ['totalNumber', 'totalPrice', 'subtotalPrice', 'deliveryFee'];
      thisCart.dom.form = thisCart.dom.wrapper.querySelector(select.cart.form);
      thisCart.dom.phone = thisCart.dom.wrapper.querySelector(select.cart.phone);
      thisCart.dom.address = thisCart.dom.wrapper.querySelector(select.cart.address); 
      for(let key of thisCart.renderTotalsKeys){
        thisCart.dom[key] = thisCart.dom.wrapper.querySelectorAll(select.cart[key]);
        // console.log('thisCart.dom[' + key + ']: '+ thisCart.dom[key]);
        /* outputs: e.g. thisCart.dom[subtotalPrice]: [object NodeList], where NodeList is <strong>3.5</strong> - value for span class=subTotal and so on.*/
      }
    }

    initActions(){
      const thisCart = this;
      // console.log('thisCart.dom.toggleTrigger:',thisCart.dom.toggleTrigger);

      thisCart.dom.toggleTrigger.addEventListener('click',function(){
        thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
        // console.log('Cart clicked!',thisCart.dom.wrapper.classList); // Shows class list, you can see class 'active' is toggled with each click
      });
 
      thisCart.dom.productList.addEventListener('updated',function(){
        thisCart.update();
        // console.log('initActions in Cart ran > cart updated.');
      });

      thisCart.dom.phone.addEventListener('change',function(){
        thisCart.update();
        console.log('initActions in Cart ran > phone updated.');
      });

      thisCart.dom.address.addEventListener('change',function(){
        thisCart.update();
        console.log('initActions in Cart ran > address updated.');
      });

      thisCart.dom.productList.addEventListener('remove',function(){
        thisCart.remove(event.detail.cartProduct);
        // console.log('initActions in Cart ran > cart product removed.');
      });

      thisCart.dom.form.addEventListener('submit',function(event){
        event.preventDefault();
        thisCart.sendOrder();
      });
    }
    
    update(){
      const thisCart = this;

      thisCart.totalNumber = 0;
      thisCart.subtotalPrice = 0;
      thisCart.deliveryFee = settings.cart.defaultDeliveryFee; // this has to be re-set to default here in case it is set to zero later under 'My addition' below.
      thisCart.phone = thisCart.dom.phone.value;
      thisCart.address = thisCart.dom.address.value;

      for (const product of thisCart.products) {
        thisCart.subtotalPrice += product.price;
        thisCart.totalNumber += product.quantity; // In BOOTCAMP this property was called 'amount'
      }

      // My addition: when all products are removed, deliveryFee should be zero.
      // console.log('thisCart.products[0]:',thisCart.products[0]);
      if ((thisCart.subtotalPrice == 0) || (!thisCart.products[0])) {
        thisCart.deliveryFee = 0;
      }
      
      
      thisCart.totalPrice = thisCart.subtotalPrice + thisCart.deliveryFee;
      // console.log('totalNumber:',thisCart.totalNumber);
      // console.log('subtotalPrice:',thisCart.subtotalPrice);
      // console.log('thisCart.totalPrice',thisCart.totalPrice);
      // console.log('thisCart.dom:',thisCart.dom);
      // console.log('thisCart:',thisCart);

      for(let key of thisCart.renderTotalsKeys){
        for(let elem of thisCart.dom[key]){
          elem.innerHTML = thisCart[key];
          // console.log('Element dla thisCart[' + key + ']: ' + elem.innerHTML);
        }
      }

      /* W powyższje pętli zaczynamy od takiej samej pętli, iterującej po thisCart.renderTotalsKeys, a następnie wykonujemy pętlę iterującą po każdym elemencie z kolekcji, zapisanej wcześniej pod jednym z kluczy w thisCart.renderTotalsKeys. Dla każdego z tych elementów ustawiamy właściwość koszyka, która ma taki sam klucz. */
    }

    add(menuProduct){
      const thisCart = this;

      // console.log('Adding product:',menuProduct);
      // console.log('Product ' + menuProduct.name + ' added to cart.');

      /* NEW - CART: 1. generate HTML based on template */
      const generatedHTML = templates.cartProduct(menuProduct); 
      // console.log('Cart generatedHTML',generatedHTML);

      /* NEW - CART: 2. create DOM elementS (using utils.createElementFromHTML?) and save to generatedDOM */
      const generatedDOM = utils.createDOMFromHTML(generatedHTML);
      // console.log('generatedDOM',generatedDOM);

      /* NEW - CART: add these DOM elements to thisCart.dom.productList */
      thisCart.dom.productList.appendChild(generatedDOM);

      thisCart.products.push(new CartProduct(menuProduct, generatedDOM));
      // console.log('thisCart.products:',thisCart.products);

      thisCart.update();
    }

    remove(cartProduct){
      // DONE declare constant thisCart
      const thisCart = this;
      const indexOfCartProductRemoved = thisCart.products.indexOf(cartProduct);

      // DONE use splice to remove array item thisCart.products[index] 
      thisCart.products.splice(indexOfCartProductRemoved, 1); 
      
      // DONE remove cartProduct.dom.wrapper from DOM 
      cartProduct.dom.wrapper.remove();
      
      // DONE run update() to recalculate cart contents
      thisCart.update();

    }

    sendOrder(){
      const thisCart = this;
      console.log('thisCart in SendOrder:',thisCart);
      const url = settings.db.url + '/' + settings.db.order;
      const payload = {
        address: 'test',
        totalPrice: thisCart.totalPrice,
        totalNumber: thisCart.totalNumber,
        subtotalPrice: thisCart.subtotalPrice,
        deliveryFee: thisCart.deliveryFee,
        deliveryPhone: thisCart.phone,
        deliveryAddress: thisCart.address,
        products: [],
      };

      console.log('thisCart.products in sendOrder:',thisCart.products);

      /* for (const product in thisCart.products) {  // Couldn't make this method work from within Cart.sendOrder, results in "Uncaught TypeError: CartProduct.getData is not a function"
        const anotherCartProduct = CartProduct.getData();
        payload.products.push(anotherCartProduct);
        console.log('payload.products[' + product + ']:' + anotherCartProduct);
      } */

      for (let product in thisCart.products) {  // Workaround to the for loop above - DOES NOT USE CartProduct.getData();
        const anotherCartProduct = {};
        anotherCartProduct.id = thisCart.products[product].id;
        anotherCartProduct.name = thisCart.products[product].name;
        anotherCartProduct.price = thisCart.products[product].price;
        anotherCartProduct.priceSingle = thisCart.products[product].priceSingle;
        anotherCartProduct.quantity = thisCart.products[product].quantity;
        anotherCartProduct.params = thisCart.products[product].params;
        payload.products.push(anotherCartProduct);
        console.log('payload.products[' + product + ']:' + anotherCartProduct);
      }

      console.log(' === > ');
      console.log('payload in SendOrder:',payload);
      console.log('   * * *   ');
 
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      };

      fetch(url, options)
        .then(function(response){
          return response.json();
        }).then(function(parsedResponse){
          console.log('parsedResponse rcvd in SendOrder:',parsedResponse);
        });
    }
  }

  class CartProduct{ 
    constructor(menuProduct, element){
      const thisCartProduct = this; 
      
      thisCartProduct.id = menuProduct.id;
      thisCartProduct.name = menuProduct.name;
      thisCartProduct.price = menuProduct.price;
      thisCartProduct.priceSingle = menuProduct.priceSingle;
      thisCartProduct.quantity = menuProduct.quantity; // This property was called thisCartProduct.amount in the bootcamp
      thisCartProduct.params = JSON.parse(JSON.stringify(menuProduct.params));

      thisCartProduct.getElements(element);
      thisCartProduct.initAmountWidget();
      thisCartProduct.initActions();
      // thisCartProduct.getData();

      // console.log('[+] CartProduct created:',thisCartProduct.name);
      // console.log('price: ' + thisCartProduct.price + '(' + thisCartProduct.quantity + ' x ' + thisCartProduct.priceSingle + ')');

    }

    getElements(element){
      const thisCartProduct = this;

      thisCartProduct.dom = {};

      thisCartProduct.dom.wrapper = element;
      thisCartProduct.dom.amountWidget = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.amountWidget);
      thisCartProduct.dom.price = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.price);
      thisCartProduct.dom.edit = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.edit);
      thisCartProduct.dom.remove = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.remove);
    }

    initActions(){
      const thisCartProduct = this;

      /* // TEMPORARILY HIDDEN, as instructed. 
      When uncommenting this, uncomment also <li><a href="#edit">Edit ... </li> --> in index.html.
      thisCartProduct.dom.edit.addEventListener('click', function(event){
        event.preventDefault();
      });
      */

      thisCartProduct.dom.remove.addEventListener('click', function(event){
        event.preventDefault();
        thisCartProduct.remove();
      });
    }

    initAmountWidget() {
      const thisCartProduct = this;
      // console.log('thisCartProduct in initAmountW:',thisCartProduct);
      // console.log('thisCartProduct.quantity in initAmountW:',thisCartProduct.quantity);
      thisCartProduct.amountWidget = new AmountWidget(thisCartProduct.dom.amountWidget,thisCartProduct.quantity);
      // console.log('thisCartProduct.amountWidget.value:',thisCartProduct.amountWidget.value);
      // amountWidget.value is the quantity of this cart product
      thisCartProduct.dom.amountWidget.addEventListener('updated', function(){
        thisCartProduct.quantity = thisCartProduct.amountWidget.value;
        thisCartProduct.price = thisCartProduct.priceSingle * thisCartProduct.quantity;

        // console.log('initAmountWidget in CartProd. ran.');
        // console.log('thisCartProduct.quantity:',thisCartProduct.quantity); // Works OK
        // console.log('thisCartProduct.price:',thisCartProduct.price); // Works OK  
        
        thisCartProduct.dom.price.innerHTML = thisCartProduct.price;
      });
    }

    remove(){
      const thisCartProduct = this;

      const event = new CustomEvent('remove', {
        bubbles: true,
        detail: { /* właściwość detail: Możemy w niej przekazać dowolne informacje do handlera eventu. W tym przypadku przekazujemy odwołanie do tej instancji, dla której kliknięto guzik usuwania. Właśnie w ten sposób odczytaliśmy [instancję thisCartProduct] i przekazaliśmy metodzie thisCart.remove. */
          cartProduct: thisCartProduct, 
        },
      });

      thisCartProduct.dom.wrapper.dispatchEvent(event);
      // console.log('Removed!');
    }

    getData(){  // Couldn't make this method work from within Cart.sendOrder, results in "Uncaught TypeError: CartProduct.getData is not a function"
      const thisCartProduct = this;

      const productInCart = {};
      productInCart.id = thisCartProduct.id;
      productInCart.name = thisCartProduct.name;
      productInCart.price = thisCartProduct.price;
      productInCart.priceSingle = thisCartProduct.priceSingle;
      productInCart.quantity = thisCartProduct.quantity;
      productInCart.params = thisCartProduct.params;        
      console.log('getData ran for',thisCartProduct.id);
      return(productInCart);
    }

  }

  const app = {
    initMenu: function(){
      const thisApp = this;

      // console.log('thisApp.data:', thisApp.data);
      // const testProduct = new Product();
      // console.log('testProduct:', testProduct);

      for (let productData in thisApp.data.products) {
        new Product(thisApp.data.products[productData].id, thisApp.data.products[productData]);
      }
    },

    initData: function(){
      const thisApp = this;
      thisApp.data = {};
      const url = settings.db.url + '/' + settings.db.product;

      fetch(url)
        .then(function(rawResponse){
          return rawResponse.json();
        })
        .then(function(parsedResponse){
          console.log('ParsedResponse rcvd in IniData:',parsedResponse);

          /* save parsedResponse as thisApp.data.products */
          thisApp.data.products = parsedResponse;

          /* execute initMenu method */
          thisApp.initMenu();
        });
      
      // console.log('thisApp.data', JSON.stringify(thisApp.data));
    },

    initCart: function () {
      const thisApp = this;

      const cartElem = document.querySelector(select.containerOf.cart);
      thisApp.cart = new Cart(cartElem);
    },

    init: function(){
      const thisApp = this;

      // console.log(' ');
      // console.log('*** App starting ***');
      // console.log('thisApp:', thisApp);
      // console.log('classNames:', classNames);
      // console.log('settings:', settings);
      // console.log('templates:', templates);

      thisApp.initData();
      // thisApp.initMenu(); /* this was moved inside thisApp.initData */
      thisApp.initCart();
    },
  };

  app.init();
  // utils.convertDataSourceToDbJson(); // Ran once only to generate db/app.json with data
}
