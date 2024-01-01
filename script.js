import { Part, BaseFunction, BodyFunction, ValidatorArgument, DictArgument, SimpleArgument, ColorArgument, DirectionDictArgument } from "./Argument.js";

console.log("Script loaded.");

window.onload = (async function() {

    const CONFIG = {
        colors: {
            'red': '#ee0000',
            'pink': '#ff00ff',
            'blue': '#2222ee',
            'lightblue': '#03c8fa',
        },
        base_css: '*{margin:0;padding:0;box-sizing:border-box;}',
        debug: true,
        ls_prefix: ['hover', 'focus', 'active'],  
    }

    // Load config
    await fetch('css-config.json')
        .then(response => response.json())
        .then(data => {
            console.log("Config finded.\nConfig loading...");

            // Add custom colors
            CONFIG.colors = {
                ...CONFIG.colors,
                ...data?.colors ?? {},
            }

            // Add base css
            CONFIG.base_css += data?.base_css ?? '';

            console.log("Config loaded.");
        })
        .catch(error => {
            console.error(error);
        });

    const data = {

        bg: new Part(
            [
                /*
                new BodyFunction([
                    new ColorArgument(CONFIG.colors) ,
                    new SimpleArgument('to'),
                    new ColorArgument(CONFIG.colors) 
                ], (a, b, c) => `background: linear-gradient(90deg, ${a} 0%, ${c} 100%);`),
                */
                new BaseFunction(new ColorArgument(CONFIG.colors), 'background-color: %s;'),
                
            ]),

        flex: new Part(
            [
                new BaseFunction(new DictArgument({
                    'row': 'row',
                    'col': 'column',
                }), 'display:flex;flex-direction: %s;'),
                new BodyFunction([
                    new DictArgument({
                        'center': 'center',
                        'start': 'flex-start',
                        'end': 'flex-end',
                        'between': 'space-between',
                        'around': 'space-around',
                        'evenly': 'space-evenly',
                    }),
                    new DictArgument({
                        'main': 'justify-content: %s;',
                        'second': 'align-items: %s;',
                    }, 'all')
                ], (a,b) => b.replaceAll('%s', a)),
            ]),
        
        height: new Part(
            [
                new BaseFunction(new DictArgument({
                    'screen': '100vh',
                    'full': '100%',
                }), 'height: %s;'),
                new BaseFunction(new ValidatorArgument(/\d{1,3}/), 'height', 'rem'),
                
            ]
        ),
        color: new Part(
            [
                new BaseFunction(new ColorArgument(CONFIG.colors), 'color: %s;'),
            ]
        ),
        br: new Part(
            [
                new BaseFunction(new ValidatorArgument(/\d{1,3}/), 'border-radius: %srem;',),
            ]
        ),
        m: new Part(
            [
                new BodyFunction([
                    new DirectionDictArgument('margin'),
                    new ValidatorArgument(/\d{1,3}/)
                ], (a,b) => a.replaceAll('%s', b)),
                //new BaseFunction(new ValidatorArgument(/\d{1,3}/), 'margin: %s;', 'rem'),
            ]
        ),
        p: new Part(
            [
                new BodyFunction([
                    new DirectionDictArgument('padding'),
                    new ValidatorArgument(/\d{1,3}/)
                ], (a,b) => a.replaceAll('%s', b)),
            ]
        ),
        
    }

    CONFIG.debug && console.log("DEBUG CONFIG :", CONFIG);
    CONFIG.debug && console.log("DEBUG data :", data);

    // TD : Analyse document
    let tmp_data = {standard: {}, prefix: {hover: {}, focus: {}, active: {}}};
    let tmp_part;

    const get_css = function(element) {
        for (let element_class of element.classList) {

            let [category, ...class_arguments] = element_class.split('-');
            
            if (category.includes(":")) {
                let tmp = category.split(':');
                let prefix = tmp[0];
                category = tmp[1];
                if (!CONFIG.ls_prefix.includes(prefix)) {continue};
                tmp_part = tmp_data.prefix[prefix];
            } else {
                tmp_part = tmp_data.standard;
            }

            // If category doesn't exist
            if (!data[category]) {continue};

            // Test if category doesn't exist
            if (!tmp_part[category]) {tmp_part[category] = {}};

            // Add the css 
            console.log(class_arguments, category);
            for (let f of data[category].functions) {
                
                let tmp = f.test(class_arguments);

                if (tmp === -1) {continue};

                tmp_part[category][class_arguments.join('-')] = f.get_css(tmp);
                break;

            }
        }

        for (let child of element.children) {
            get_css(child);
        }
    }

    get_css(document.body);
    console.log(tmp_data);

    /*
    tmp_data = {
        standard: {
            flex: {
                center: 'justify-content:center;align-items:center;',
                "center-main": 'justify-content:center;',
                "center-second": 'align-items:center;',
            },
            bg: {
                red: 'background-color:red;',
                "lightblue-200": 'background-color:#03c8fa33;',
            },
            height: {
                screen: 'height:100vh;',
            }
        },
        prefix: {
            hover: {
                bg: {
                    "pink-700": 'background-color:#fa14c8b3;'
                }
            }
        }
    }
    */


    // Generate css from document classes
    let css_out = CONFIG.base_css;
    for (const [category, sub] of Object.entries(tmp_data.standard)) {
        for (const [argument, value] of Object.entries(sub)) {
            css_out += `.${category}-${argument}{${value}}`;
        }
    }

    // Prefix
    for (const [prefix, categories] of Object.entries(tmp_data.prefix)) {
        for (const [category, sub] of Object.entries(categories)) {
            for (const [argument, value] of Object.entries(sub)) {
                css_out += `.${prefix}\\:${category}-${argument}:${prefix}{${value}}`;
            }
        }
    }

    // Apply css to document
    document.head.innerHTML += '<style>' + css_out + '</style>';
    CONFIG.debug && console.log(css_out);

}());
