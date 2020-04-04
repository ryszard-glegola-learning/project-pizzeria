import {select} from '../settings.js'; 
import AmountWidget from '../components/AmountWidget.js';

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
}

export default CartProduct;