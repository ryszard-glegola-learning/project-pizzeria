import {settings, select, classNames, templates} from '../settings.js'; 
import {utils} from '../utils.js'; 
import CartProduct from './CartProduct.js';

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
      // console.log('initActions in Cart ran > phone updated.');
    });

    thisCart.dom.address.addEventListener('change',function(){
      thisCart.update();
      // console.log('initActions in Cart ran > address updated.');
    });

    thisCart.dom.productList.addEventListener('remove',function(){
      thisCart.remove(event.detail.cartProduct);
      // console.log('initActions in Cart ran > cart product removed.');
    });

    thisCart.dom.form.addEventListener('submit',function(event){
      event.preventDefault();
      // console.log('thisCart.dom:',thisCart.dom);
      thisCart.sendOrder();
    });
  }

  add(menuProduct){
    const thisCart = this;

    // console.log('Adding product:',menuProduct);
    console.log('Product ' + menuProduct.name + ' added to cart.');

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

  update(){
    const thisCart = this;

    thisCart.totalNumber = 0;
    thisCart.subtotalPrice = 0;
    thisCart.deliveryFee = settings.cart.defaultDeliveryFee; // this has to be re-set to default here in case it is set to zero later under 'My addition' below.
    thisCart.phone = thisCart.dom.phone.value;
    thisCart.address = thisCart.dom.address.value;
    for (const product of thisCart.products) {
      thisCart.subtotalPrice += product.price;
      thisCart.totalNumber += product.quantity; 
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
      }
    }

    /* W powyższje pętli zaczynamy od takiej samej pętli, iterującej po thisCart.renderTotalsKeys, a następnie wykonujemy pętlę iterującą po każdym elemencie z kolekcji, zapisanej wcześniej pod jednym z kluczy w thisCart.renderTotalsKeys. Dla każdego z tych elementów ustawiamy właściwość koszyka, która ma taki sam klucz. */
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
    // console.log('thisCart in SendOrder:',thisCart);
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

    // console.log('List of "thisCart.products" in Cart.sendOrder:',thisCart.products);

    for (const product in thisCart.products) {
      // console.log('product:',product);
      const anotherCartProduct = thisCart.products[product].getData();
      payload.products.push(anotherCartProduct);
      // console.log('Object "payload.products[' + product + ']":' + anotherCartProduct);
    }
    console.log(' == ORDER SUBMITTED! == ');
    
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
        console.log('"ParsedResponse" received in Cart.SendOrder:',parsedResponse);
      });
  }
}

export default Cart;