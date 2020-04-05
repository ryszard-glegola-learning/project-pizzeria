import {settings, select, classNames} from './settings.js'; // ./ essential, points to a separate file
import Product from './components/Product.js';
import Cart from './components/Cart.js';

const app = {
  initPages: function(){
    const thisApp = this;

    thisApp.pages = document.querySelector(select.containerOf.pages).children;
    thisApp.navLinks = document.querySelectorAll(select.nav.links);
    const idFromHash = window.location.hash.replace('#/', '');
    
    let pageMatchingHash = thisApp.pages[0].id;

    for (let page of thisApp.pages){
      if(page.id == idFromHash){
        pageMatchingHash = page.id;
        break;
      }
    }
  
    thisApp.activatePage(pageMatchingHash);
    window.location.hash = '#/' + pageMatchingHash;

    // Add listeners to nav links 
    for (let link of thisApp.navLinks){
      link.addEventListener('click',function(event){
        const clickedElement = this;
        event.preventDefault();

        /* get page id from href attribute and get rid of hash sign from it */
        const id = clickedElement.getAttribute('href').replace('#', '');

        /* activate the page with that id, i.e. run thisApp.activatePage(pageId) */
        thisApp.activatePage(id);

        /* change URL hash */
        window.location.hash = '#/' + id;

      });
    }
  },

  activatePage: function(pageId){
    const thisApp = this;

    /* add class "active" to matching page, remove from non-matching */
    for (let page of thisApp.pages){
      // instead of this...
      /* if (page.id == pageId){
        page.classList.add(classNames.pages.active);
      } else {
        page.classList.remove(classNames.pages.active);
      }
      */
      // let's use toggle like this:
      page.classList.toggle(
        classNames.pages.active, 
        page.id == pageId
      );     
    }

    /* add class "active" to matching nav link, remove from non-matching */
    for (let link of thisApp.navLinks){
      link.classList.toggle(
        classNames.nav.active, 
        link.getAttribute('href') == '#' + pageId
      );     
    }
    
  },

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

    thisApp.productList = document.querySelector(select.containerOf.menu);

    thisApp.productList.addEventListener('add-to-cart', function(){
      app.cart.add(event.detail.product);
    });
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
    thisApp.initPages();
  },
};

app.init();