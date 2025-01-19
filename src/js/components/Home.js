import {templates, select} from '../settings.js';
import utils from '../utils.js';

class Home {
    constructor (element){
        const thisHome = this;
        thisHome.render(element);
    }
    render(element) {
        const thisHome = this;

        const generatedHTML = templates.home();
        const homePage = document.querySelector(select.containerOf.home);
        thisHome.dom = {};
        thisHome.dom.wrapper = homePage;
        thisHome.dom.wrapper.innerHTML = generatedHTML;
    }
}

export default Home;