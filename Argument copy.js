const ArgumentType = {
    DICT: 0,
    VALIDATOR: 1,
    COLOR: 2,
}

class Argument {
    constructor(type) {
        this.type = type;
    }
}

export class SimpleArgument extends Argument {

    constructor(value) {
        super(ArgumentType.VALIDATOR);
        this.value = value;
    }

    test(args, i) {
        return args[i] === this.value;
    }

    get_value(argument) {
        return argument;
    }

}


export class ValidatorArgument extends Argument {
    constructor(validator) {
        super(ArgumentType.VALIDATOR);
        this.validator = validator;
    }

    test(args, i) {
        return this.validator.test(args[i]);
    }

    get_value(args, i) {
        console.log("VALIDATOR", i, args[i], args)
        return args[i];
    }

}

export class DictArgument extends Argument {
    constructor(dict, value_default=null) {
        super(ArgumentType.DICT);
        this.dict = dict;
        this.value_default = value_default;
    }

    test(args, i) {
        return this.value_default === 'all' || this.dict[args[i]] !== undefined;
    }

    get_value(args, i) {
        console.log("DICT", i, args[i], args)
        if (this.dict[args[i]]===undefined && this.value_default !== 'all') {
            args.unshift('')
            return this.dict['']
        }
        return this.value_default === 'all' && !this.dict[args[i]] ? Object.values(this.dict).join("") : this.dict[args[i]];
    }
}

export class ColorArgument extends Argument {
    constructor(dict) {
        super(ArgumentType.COLOR);
        this.dict = dict;
    }

    test(args, i) {

        console.log("Args", this.dict, args[i], args[i+1], /^([0-9]|[1-9][0-9]|[1-9][0-9][0-9])$/.test(args[i+1]))

        if (this.dict[args[i]] === undefined) {
            return false;
        }

        if (/^([0-9]|[1-9][0-9]|[1-9][0-9][0-9])$/.test(args[i+1])) {
            ++i;
        }

        return true;
    }

    get_value(args, i) {

        console.log("AAA", args, i, this.dict)

        if (this.args instanceof Argument) {
            return this.dict[args]
        }

        return this.dict[args[i]] + ( ((i+1) < args.length) && /^([0-9]|[1-9][0-9]|[1-9][0-9][0-9])$/.test(args[i+1]) ? Math.round(parseInt(args[i+1])*256/1000,0).toString(16) : '');
    }
}

class Function {
    constructor(args) {
        this.args = args;
    }

    test(class_arguments) {

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

        /*
        for (let i=0; i<class_arguments.length; ++i) {
            if (!this.args[i].test(class_arguments[i])) {
                return false;
            }
        }
        */
        return valid
    }
}

export class BaseFunction extends Function {
    constructor(args, css, unity='') {
        super(args);
        this.css = css;
        this.unity = unity;
    }

    get_css(class_arguments) {
        if (this.args instanceof Argument) {
            console.log("I3", this.css);
            return this.css.replaceAll('%s', this.args.get_value(class_arguments, 0)+this.unity);
        }
        console.log("I7", this.css);
        return `${this.css}: ${this.args.map((arg,i)=>arg.get_value(class_arguments, i)).join('')}${this.unity};`;
    }
}

export class BodyFunction extends Function {
    constructor(args, f) {
        super(args);
        this.f = f;
    }

    get_css(class_arguments) {
        if (this.args instanceof Argument) {
            return this.f(this.args.get_value(class_arguments));
        }
        
        let out = [];
        let i = 0;
        while (i < this.args.length) {
            console.log("I4", i);
            out.push(this.args[i].get_value(class_arguments, i));
            console.log("I5", i);
            ++i;
        }


        return this.f(...out);
    }
}

export class Part {
    constructor(functions) {
        this.functions = functions;
    }

}