const ArgumentType = {
    DICT: 0,
    VALIDATOR: 1,
    COLOR: 2,
}

class Argument {
    constructor(type) {}
}

export class SimpleArgument extends Argument {

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


export class ValidatorArgument extends Argument {
    constructor(validator) {
        super();
        this.validator = validator;
    }

    test(args, i) {
        return this.validator.test(args[i]) ? 1 : -1;
    }

    get_value(arg) {
        console.log("VALIDATOR", arg)
        return arg;
    }

}

export class DictArgument extends Argument {
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

export class DirectionDictArgument extends DictArgument {

    constructor(propertie) {
        super({
            'b': '%a-bottom: %srem;',
            't': '%a-top: %srem;',
            'l': '%a-left: %srem;',
            'r': '%a-right: %srem;',
            '': '%a: %srem;',
        });
        this.propertie = propertie;
    }

    get_value(arg) {
        return super.get_value(arg).replace('%a', this.propertie);
    }


}

export class ColorArgument extends Argument {
    constructor(dict) {
        super();
        this.dict = dict;
    }

    test(args, i) {

        if (this.dict[args[i]] === undefined) {
            return -1;
        }

        if (/^([0-9]|[1-9][0-9]|[1-9][0-9][0-9])$/.test(args[i+1])) {
            return 2
        }

        return 1;
    }

    get_value(arg) {
        console.log("COLOR", arg, Array.isArray(arg) )
        return arg instanceof Array ? this.dict[arg[0]] + (arg[1] ? Math.round(parseInt(arg[1])*256/1000,0).toString(16) : '') : this.dict[arg];
    }
}

class Function {
    constructor(args) {
        this.args = args instanceof Argument ? [args] : args;
    }

    test(class_arguments) {

        /*
        if (this.args instanceof Argument ) {
            console.log("I1", this, class_arguments, this.args.test(class_arguments, 0));
            return this.args.test(class_arguments, 0);
        }

        let valid = true;
        let i = 0;

        while (valid && i < this.args.length) {
            console.log("I2", i);
            find = this.args[i].test(class_arguments, i);
            ++i;
        }
        */
        let i = 0;
        let tmp_list = [];

        for (let arg of this.args) {
            let tmp = arg.test(class_arguments, i);
            console.log("I23", i, tmp);
            if (tmp === -1) { return -1; }
            
            tmp_list.push(class_arguments.slice(i, i+tmp));
            i += tmp;
        }

        /*
        while (i < class_arguments.length) {

            let tmp = this.args[i].test(class_arguments, i);
            if (tmp === -1) { return -1; }

            console.log("I23", i, tmp);
            tmp_list.push(class_arguments.slice(i, i+tmp));
            i += tmp;

        }
        */

        return tmp_list;
    }
}

export class BaseFunction extends Function {
    constructor(args, css, unity='') {
        super(args);
        this.css = css;
        this.unity = unity;
    }

    get_css(class_arguments) {
        return `${this.css.replace('%s', this.args[0].get_value(class_arguments[0])) }${this.unity}`;
    }
}

export class BodyFunction extends Function {
    constructor(args, f) {
        super(args);
        this.f = f;
    }

    get_css(class_arguments) {
        console.log("BODY", this.args, class_arguments);
        return this.f(...class_arguments.map((arg,i)=>this.args[i].get_value(arg)));
    }
}

export class Part {
    constructor(functions) {
        this.functions = functions;
    }

}