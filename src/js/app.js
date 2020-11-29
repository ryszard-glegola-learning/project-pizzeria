import {settings, select, classNames} from './settings.js'; // ./ essential, points to a separate file
import Product from './components/Product.js';
import Cart from './components/Cart.js';
import Booking from './components/Booking.js';

const app = {
  initPages: function(){
    const thisApp = this;

    thisApp.pages = document.querySelector(select.containerOf.pages).children;
    thisApp.header = document.querySelector(select.containerOf.header);
    thisApp.mainNav = document.querySelector(select.containerOf.nav);
    thisApp.cartSummary = document.querySelector(select.containerOf.cart);
    thisApp.allLinks = document.querySelectorAll(select.all.links);
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
    console.log('activatePage ran.');
    window.location.hash = '#/' + pageMatchingHash;

    // Add listeners to nav links 
    for (let link of thisApp.allLinks){
      link.addEventListener('click',function(event){
        const clickedElement = this;
        console.log('Link found:',link);
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

    // Task 11.3: hide main-nav and cart on Home
    if (pageId == 'home'){
      thisApp.header.classList.add(classNames.header.home);
      thisApp.mainNav.classList.add(classNames.nav.hidden);
      thisApp.cartSummary.classList.add(classNames.cart.hidden);
    } else {
      thisApp.header.classList.remove(classNames.header.home);
      thisApp.mainNav.classList.remove(classNames.nav.hidden);
      thisApp.cartSummary.classList.remove(classNames.cart.hidden);
    }      

    /* add class "active" to matching page, remove from non-matching */
    for (let page of thisApp.pages){
      page.classList.toggle(
        classNames.pages.active, 
        page.id == pageId
      );  
    }
    
    for (let link of thisApp.allLinks){
      link.classList.toggle(
        classNames.nav.active, 
        link.getAttribute('href') == '#' + pageId
      );     
    }
  },

  initMenu: function(){
    const thisApp = this;

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

  initBooking: function() {
    const thisApp = this;

    const bookingContainer = document.querySelector(select.containerOf.booking);
    // console.log('bookingContainer',thisApp.bookingContainer);

    thisApp.booking = new Booking(bookingContainer);

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
    thisApp.initBooking();
    // thisApp.includeHTMLfromFile(settings.home.includeHTMLattribute);
  },
};

app.init();
console.log('app.init ran.');