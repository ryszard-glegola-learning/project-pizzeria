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
      thisProduct.initAccordion();

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
    }


    initAccordion(){
      const thisProduct = this;
      console.log('thisProduct:', thisProduct);

      /* find the clickable trigger (the element that should react to clicking) */
      thisProduct.trigger = thisProduct.element.querySelector(select.menuProduct.clickable);
      // console.log('thisProduct.trigger:', thisProduct.trigger);
      /* START: click event listener to trigger */
      thisProduct.trigger.addEventListener('click', function(){
        /* [DONE] prevent default action for event */
        event.preventDefault(); // what does this do?
        /* [DONE] toggle active class on element of thisProduct */
        thisProduct.trigger.classList.toggle('active'); // This may be needed later, not useful here
        thisProduct.trigger.parentElement.classList.toggle('active');
        /* [DONE] find all active products */
        const allActiveProducts = document.querySelectorAll(select.all.menuProductsActive);
        /*  [DONE] START LOOP: for each active product */
        for(let activeProduct of allActiveProducts){
          activeProduct.header = activeProduct.querySelector(select.menuProduct.clickable);
          /*  [DONE] START: ### if the active product isn't the element of thisProduct */
          if (activeProduct.header != thisProduct.trigger) {
          /*     remove class active for the active product */
            activeProduct.header.parentElement.classList.remove('active');
          /*  [DONE] END: ### if the active product isn't the element of thisProduct */
          }
          /* [DONE] END LOOP: for each active product */
        }
        console.log(' ** END LISTENER ** ');
      });
      /* [DONE] END: click event listener to trigger */
    }
  }

  app.init();
}
