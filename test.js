class Argument {
    constructor() {}
}

class SimpleArgument extends Argument {

    constructor(value) {
        super();
        this.value = value;
    }

    test(args, i) {
        return args[i] === this.value ? 1 : -1;
    }

    get_value(argument) {
        return argument;
    }

}


class ValidatorArgument extends Argument {
    constructor(validator) {
        super();
        this.validator = validator;
    }

    test(args, i) {
        return this.validator.test(args[i]) ? 1 : -1;
    }

    get_value(arg) {
        return arg;
    }

}

class DictArgument extends Argument {
    constructor(dict, value_default=null) {
        super();
        this.dict = dict;
        this.value_default = value_default;
    }

    test(args, i) {
        return (this.value_default === 'all' || this.dict[args[i]] !== undefined) ? 1 : this.dict[''] ? 0 : -1;
    }

    get_value(arg) {
        return (this.value_default === 'all' && !this.dict[arg]) ? Object.values(this.dict).join("") : this.dict[arg] ?? this.dict[''];
    }
}

class DirectionDictArgument extends DictArgument {

    constructor(propertie) {
        super({
            'b': '%a-bottom: %srem;',
            't': '%a-top: %srem;',
            'l': '%a-left: %srem;',
            'r': '%a-right: %srem;',
            'x': '%a-left: %srem;%a-right: %srem;',
            'y': '%a-top: %srem;%a-bottom: %srem;',
            '': '%a: %srem;',
        });
        this.propertie = propertie;
    }

    get_value(arg) {
        return super.get_value(arg).replaceAll('%a', this.propertie);
    }


}

class NumberArgument extends Argument {

    constructor(value_default=0, factor=1) {
        super();
        this.value_default = value_default;
        this.factor = factor;
    }

    test(args, i) {
        return (!isNaN(args[i]) && args[i] !== '') ? 1 : (args[i] === '' && !isNaN(args[i+1])) ? 2 : !isNaN(this.value_default) ? 0 : -1;
    }

    get_value(arg) {
        if (arg === undefined) { return this.value_default; }
        return ( typeof arg === 'string' ? arg : -arg[1])* this.factor;
    }
}

class TextArgument extends Argument {

    constructor() {
        super();
    }

    test(args, i) {
        return args[i] !== undefined ? 1 : -1;
    }

    get_value(arg) {
        return arg;
    }

}


class SizeArgument extends DictArgument {

    constructor() {
        super({
            's': 1,
            'm': 2,
            'l': 5,
            'xl': 10,
        });
    }

    test(args, i) {
        return args[i] !== undefined ? 1 : -1;
    }

    get_value(arg) {
        return super.get_value(arg);
    }

}
    

class ColorArgument extends Argument {
    constructor(dict, value_default) {
        super();
        this.dict = dict;
        this.value_default = value_default;
    }

    test(args, i) {

        if (this.dict[args[i]] === undefined && !this.value_default) {
            return -1;
        }

        if (/^([0-9]|[1-9][0-9]|[1-9][0-9][0-9])$/.test(args[i+1])) {
            return 2
        }

        return 1;
    }

    get_value(arg) {
        if (arg === undefined) { return this.value_default; }
        return typeof arg === 'string' ? this.dict[arg] : this.dict[arg[0]] + (arg[1] ? Math.round(parseInt(arg[1])*256/1000,0).toString(16) : '');
    }
}

class BooleanArgument extends Argument {

    constructor(value, value_default=false) {
        super();
        this.value = value;
        this.value_default = value_default;
    }

    test(args, i) {
        return (args[i] === this.value || this.value_default) ? 1 : -1;
    }

    get_value(arg) {
        return arg === this.value ? this.value : '';
    }

}

class Function {
    constructor(args) {
        this.args = args instanceof Argument ? [args] : args;
    }

    test(class_arguments) {

        // if (class_arguments.length > this.args.length) { return -1; }

        let i = 0;
        let tmp_list = [];

        for (let arg of this.args) {
            let tmp = arg.test(class_arguments, i);
            if (tmp === -1) { return -1; }
            
            switch (tmp) {
                case 0:
                    tmp_list.push(undefined);
                    break;
                case 1:
                    tmp_list.push(class_arguments[i]);
                    break;
                default:
                    tmp_list.push(class_arguments.slice(i, i+tmp));

            }
            
            i += tmp;
        }

        return tmp_list;
    }
}

class BaseFunction extends Function {
    constructor(args, css=false) {
        super(args);
        this.css = css;
    }

    get_css(class_arguments) {
        return `${this.css ? this.css.replaceAll('%s', this.args[0].get_value(class_arguments[0])) : this.args[0].get_value(class_arguments[0]) }`;
    }
}

class BodyFunction extends Function {
    constructor(args, f) {
        super(args);
        this.f = f;
    }

    get_css(class_arguments) {
        return this.f(...class_arguments.map((arg,i)=>this.args[i].get_value(arg)));
    }
}

class Part {
    constructor(functions) {
        this.functions = functions;
    }

}

(function() {

    
    const CSS_PREFIX = "[css-auto] "
    const CONFIG = {
        colors: {
            'red': '#ee0000',
            'pink': '#ff00ff',
            'blue': '#2222ee',
            'lightblue': '#03c8fa',
            'green': '#00ff00',
            'yellow': '#ffff00',
            'white': '#ffffff',
        },
        base_css: '*{margin:0;padding:0;box-sizing:border-box;}::-webkit-scrollbar{display:none;}html{-ms-overflow-style:none;scrollbar-width:none;}',
        debug: true,
        ls_prefix: ['hover', 'focus', 'active'],
        auto_save: false, 
    }

    const log = function(msg) {
        console.log(CSS_PREFIX + msg);
    }

    let css_struct;
    let tmp_part;
    log("Freewind starting...");

    // Load config
    if ( window.css_config !== undefined ) {
        log("Config finded.\nConfig loading...");
        CONFIG.colors = {
            ...CONFIG.colors,
            ...window.css_config?.colors ?? {},
        }

        // Add base css
        CONFIG.base_css += window.css_config?.base_css ?? '';

        // Add fonts
        window.css_config?.fonts && window.css_config.fonts.forEach(font => {
            document.head.innerHTML += `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}&display=swap">`;
        })

        let extensions_data = {
            parallax: '.parallax{position:relative;z-index:0;contain:paint;}.parallax [class*="parallax-speed-"]{grid-area:stack;animation:parallax linear;animation-timeline:view(y);translate: 0 0%}@keyframes parallax{from{transform:translateY(calc(var(--parallax-speed)*1vh))}to{transform:translateY(calc(var(--parallax-speed)*-1.19vh))}}'
        };
        window.css_config?.plugins && window.css_config.plugins.forEach(extension => {
            if (extensions_data[extension]) {
                CONFIG.base_css += extensions_data[extension];
            }
        });

    }

    // Import last css
    if (localStorage.getItem('css-auto') !== null) {
        log("Last css finded.\nLast css loading...");
        css_struct = JSON.parse(localStorage.getItem('css-auto'));
    } else {
        css_struct = {standard: {}, prefix: {hover: {}, focus: {}, active: {}}};
    }

    const color_argument = new ColorArgument(CONFIG.colors);

    

    const data = {
        bg: new Part(
            [
                new BodyFunction([
                    new DictArgument({
                        'l': 'linear',
                        'r': 'radial',
                        '': 'linear',
                    }),
                    new NumberArgument(90),
                    color_argument,
                    new SimpleArgument('to'),
                    color_argument,
                ], (a, b, c, d, e) => `background: ${a}-gradient(${a === 'radial' ? 'circle' : b + 'deg'}, ${c}, ${e});`),                
                new BaseFunction(color_argument, 'background-color: %s;'),
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
                new BaseFunction(new NumberArgument(), 'height: %srem;'),
            ]
        ),
        width: new Part(
            [
                new BaseFunction(new DictArgument({
                    'screen': '100vh',
                    'full': '100%',
                }), 'width: %s;'),
                new BaseFunction(new NumberArgument(), 'width: %srem;'),
            ]
        ),
        color: new Part(
            [
                new BaseFunction(color_argument, 'color: %s;'),
                new BodyFunction(
                    new TextArgument('random'),
                    () => `color: hsl(${Math.floor(Math.random()*360)},85%,40%);`
                ),
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
                    new NumberArgument()
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
        g: new Part(
            [
                new BaseFunction([
                    new NumberArgument(),
                ], 'gap: %srem;'),
            ]
        ),
        delay: new Part(
            [
                new BaseFunction(new NumberArgument(0, .01), 'animation-duration: %ss;transition-duration: %ss;'),
            ]
        ),
        transition: new Part(
            [
                new BaseFunction(new DictArgument({
                    '': 'all',
                    'shadow': 'box-shadow',
                    'color': 'color,background-color,border-color,text-decoration-color,fill,stroke,opacity,box-shadow,transform,filter,backdrop-filter',
                    'br': 'border-radius',
                    'm': 'margin',
                    'p': 'padding',
                }), 'transition-property: %s;'),
            ]
        ),
        font: new Part(
            [
                new BodyFunction([
                    new TextArgument(),
                    new DictArgument({
                        '': 'sans-serif',
                        'mono': 'monospace',
                        'serif': 'serif',
                    })
                ], (a, b) => `font-family: ${a[0].replace(/([a-z])([A-Z])/g, '$1 $2')}, ${b};`),
            ]
        ),
        shadow: new Part(
            [
                new BodyFunction([
                    new SizeArgument(),
                    new BooleanArgument('inset', true),
                ], (a, b) => `box-shadow:${b} 0 ${a*2}px ${a*2.5}px -${a*.5}px rgb(0 0 0 / .1)` + (!b ? `,0 ${a*.8}px ${a*.5}px -${a*.3}px rgb(0 0 0 / 0.1);` : '' )),
            ],
        ),
        tshadow: new Part(
            [
                new BodyFunction([
                    new NumberArgument(0),
                    new NumberArgument(0),
                    new NumberArgument(0),
                    new ColorArgument(CONFIG.colors, '#ddddddee'),
                ], (a, b, c, d) => `text-shadow:${a}px ${b}px ${c}px ${d};`),
            ],
        ),
        text: new Part(
            [
                new BaseFunction(new DictArgument({
                    'center': 'center',
                    'left': 'left',
                    'right': 'right',
                }), 'text-align: %s;'),
                new BaseFunction(new DictArgument({
                    'title': 'font-size:4rem;font-weight:700;text-transform:uppercase;',
                    'primary': 'font-size:2rem;font-weight:700;',
                    'right': 'right',
                })),
            ]
        ),
        translate: new Part(
            [
                new BodyFunction([new DictArgument({
                    'x': 'x',
                    'y': 'y',
                }), new NumberArgument(0)
                ], (a, b) => `translate:${a === 'x' ? b : 0}rem ${a === 'y' ? b : 0}rem;`),
            ]
        ),
        scale: new Part(
            [
                new BaseFunction(new NumberArgument(1, .01), 'scale: %s;'),
            ]
        ),
        index: new Part(
            [
                new BaseFunction(new NumberArgument(0), 'z-index: %s;'),
            ]
        ),
        ...(window.css_config?.plugins?.includes('parallax') && {
            parallax: new Part(
                [
                    new BodyFunction([
                        new TextArgument('speed'),
                        new NumberArgument(0)
                    ], (a, b) => `--parallax-speed:${b};`),
                ]
            ),
        }),
    }    


    // Define variables
    document.addEventListener('DOMContentLoaded', function() {
    //document.onloadedmetadata = function() {

        async function main() {
            
            // Analyse document
            const get_css = function(element) {
                for (let element_class of element.classList) {
        
                    let [category, ...class_arguments] = element_class.split('-');
                    
                    if (category.includes(":")) {
                        let tmp = category.split(':');
                        let prefix = tmp[0];
                        category = tmp[1];
                        if (!CONFIG.ls_prefix.includes(prefix)) {continue};
                        tmp_part = css_struct.prefix[prefix];
                    } else {
                        tmp_part = css_struct.standard;
                    }
        
                    // If category doesn't exist
                    if (!data[category]) {continue};
        
                    // Test if category doesn't exist
                    if (!tmp_part[category]) {tmp_part[category] = {}};
        
                    // Test if css is already defined
                    if (tmp_part[category][class_arguments.join('-')]) {continue};

                    // Add the css 
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

            // Exemple...
            // css_struct = { standard: { flex: { center: 'justify-content:center;align-items:center;', "center-main": 'justify-content:center;', "center-second": 'align-items:center;', }, bg: { red: 'background-color:red;', "lightblue-200": 'background-color:#03c8fa33;', }, height: { screen: 'height:100vh;', } }, prefix: { hover: { bg: { "pink-700": 'background-color:#fa14c8b3;' } } } }

            // Get css file from structure
            let css = CONFIG.base_css;

            // Normal
            for (const [category, sub] of Object.entries(css_struct.standard)) {
                for (const [argument, value] of Object.entries(sub)) {
                    css += `.${category}${argument ? '-' + argument : ''}{${value}}`;
                }
            }
        
            // Prefix
            for (const [prefix, categories] of Object.entries(css_struct.prefix)) {
                for (const [category, sub] of Object.entries(categories)) {
                    for (const [argument, value] of Object.entries(sub)) {
                        css += `.${prefix}\\:${category}${argument ? '-' + argument : ''}:${prefix}{${value}}`;
                    }
                }
            }

            return {
                css,
                css_struct,
            };
        }

        main()
        .then(function(res) {
            document.head.innerHTML += `<style>${res.css}</style>`;
            log("Freewind finished !");
            CONFIG.debug && log(res.css);
    
            // Load CSS in cache
            if (CONFIG.auto_save) {
                localStorage.setItem('css-auto', JSON.stringify(res.css_struct));
                log("CSS loaded");
            }
    
        })
        .catch(function(err) {
            log(err);
        })
    
    });

}())