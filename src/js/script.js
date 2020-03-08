/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars

{
  'use strict';

  const select = {
    templateOf: {
      menuProduct: '#template-menu-product',
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
        input: 'input[name="amount"]',
        linkDecrease: 'a[href="#less"]',
        linkIncrease: 'a[href="#more"]',
      },
    },
  };

  const classNames = {
    menuProduct: {
      wrapperActive: 'active',
      imageVisible: 'active',
    },
  };

  const settings = {
    amountWidget: {
      defaultValue: 1,
      defaultMin: 1,
      defaultMax: 9,
    }
  };

  const templates = {
    menuProduct: Handlebars.compile(document.querySelector(select.templateOf.menuProduct).innerHTML),
  };

  const app = {
    initMenu: function(){
      const thisApp = this;

      console.log('thisApp.data:', thisApp.data);
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

    init: function(){
      const thisApp = this;
      console.log('*** App starting ***');
      console.log('thisApp:', thisApp);
      console.log('classNames:', classNames);
      console.log('settings:', settings);
      console.log('templates:', templates);

      thisApp.initData();
      thisApp.initMenu();
    },
  };


  class Product{
    constructor(id, data){
      const thisProduct = this;

      thisProduct.id = id;
      thisProduct.data = data;

      thisProduct.renderInMenu();
      thisProduct.getElements();
      thisProduct.initAccordion();
      thisProduct.initOrderForm();
      thisProduct.processOrder();

      // console.log('New Product: ', thisProduct);
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
      console.log('thisProduct.element',thisProduct.element);
    }

    getElements(){
      const thisProduct = this;

      thisProduct.accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
      thisProduct.form = thisProduct.element.querySelector(select.menuProduct.form);
      thisProduct.formInputs = thisProduct.element.querySelectorAll(select.all.formInputs);
      thisProduct.cartButton = thisProduct.element.querySelector(select.menuProduct.cartButton);
      thisProduct.priceElem = thisProduct.element.querySelector(select.menuProduct.priceElem);
      thisProduct.imageWrapper = thisProduct.element.querySelector(select.menuProduct.imageWrapper);
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
      console.log(' ');
      console.log(' ');
      console.log(' ##### ANOTHER PROD. #####');
      console.log('thisProduct is', thisProduct.id);
      console.log('processOrder ran in ' + thisProduct.id + ':');
      // console.log('thisProduct.data:',thisProduct.data);

      /* read all data from the form (using utils.serializeFormToObject) and save it to const formData */
      const formData = utils.serializeFormToObject(thisProduct.form);
      console.log('formData:', formData);

      /* set variable price to equal thisProduct.data.price */
      let price = thisProduct.data.price;
      console.log('price:', price);

      /* START LOOP: for each paramId in thisProduct.data.params */
      for (let paramId in thisProduct.data.params){
      /* save the element in thisProduct.data.params with key paramId as const param */
        const param = thisProduct.data.params[paramId];

        /* START LOOP: for each optionId in param.options */
        for (let optionId in param.options){
          console.log(' - - - ');
          console.log('paramId:',paramId);
          /* save the element in param.options with key optionId as const option */
          const option = optionId;
          console.log('optionId:',option);

          /* change the value of options[option].default to false where it is undefined */
          if (!param.options[option].default) {
            param.options[option].default = false;
          }

          // Tip no. 3 follows...

          const optionSelected = formData.hasOwnProperty(paramId) && formData[paramId].indexOf(optionId) > -1;

          // console.log('optionSelected:',optionSelected);
          /* create const to store a list of images: .parameter-option */
          const allImagesOfThisProduct = thisProduct.element.querySelector(select.menuProduct.imageWrapper).querySelectorAll('img');
          console.log('allImagesOfThisProduct',allImagesOfThisProduct);

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
          console.log('wantedImageClass:',wantedImageClass);

          if(optionSelected){
            /* go through allImagesOfThisProduct */
            for(let image of allImagesOfThisProduct){
              /* if the image belongs to the selected option, show it */
              const currentImageClass = image.getAttribute('class');
              console.log('image:',image);
              console.log('currentImageClass:',currentImageClass);
              if (currentImageClass.includes(wantedImageClass)) {
                image.classList.add('active');
              }
            }
          } else {
            /* go through allImagesOfThisProduct */
            for(let image of allImagesOfThisProduct){
              /* if the image belongs to the selected option, show it */
              const currentImageClass = image.getAttribute('class');
              console.log('image:',image);
              console.log('currentImageClass:',currentImageClass);

              /* split class list into array */
              const currentImageClassesArray = currentImageClass.split(' ');
              let thisTheClass = false;
              for(let className of currentImageClassesArray){
                if(className == wantedImageClass){
                  thisTheClass = true;
                }
              }
              console.log('image.classList',image.classList);
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
      /* set the contents of thisProduct.priceElem to be the value of variable price */
      thisProduct.priceElem = price;

      thisProduct.element.querySelector(select.menuProduct.priceElem).innerHTML= thisProduct.priceElem;
    }
  }

  app.init();
}
