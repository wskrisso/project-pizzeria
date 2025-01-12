import {select, templates} from '../settings.js';
import AmountWidget from './AmountWidget.js';

class Booking {
    constructor(bookingElement){
        const thisBooking = this;
    
        thisBooking.render(bookingElement);
        thisBooking.initWidgets();
    }
    
    render(bookingElement){
        const thisBooking = this;
    
        const generatedHTML = templates.bookingWidget();
    
        thisBooking.dom = {};
        thisBooking.dom.wrapper = bookingElement;
        thisBooking.dom.wrapper.innerHTML = generatedHTML;
    
        thisBooking.dom.peopleAmount = thisBooking.dom.wrapper.querySelector(select.booking.peopleAmount);
        thisBooking.dom.hoursAmount = thisBooking.dom.wrapper.querySelector(select.booking.hoursAmount);
    }
    
    initWidgets(){
        const thisBooking = this;
    
        thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
        thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);
    }

}

export default Booking; 