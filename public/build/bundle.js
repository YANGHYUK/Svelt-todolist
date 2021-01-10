
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
        const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.31.2' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/components/PageTemplate.svelte generated by Svelte v3.31.2 */

    const file = "src/components/PageTemplate.svelte";

    function create_fragment(ctx) {
    	let h1;
    	let img;
    	let img_src_value;
    	let t0;
    	let t1;
    	let t2;
    	let t3;
    	let div;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[4].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[3], null);

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			img = element("img");
    			t0 = space();
    			t1 = text(/*name*/ ctx[1]);
    			t2 = text(/*title*/ ctx[0]);
    			t3 = space();
    			div = element("div");
    			if (default_slot) default_slot.c();
    			if (img.src !== (img_src_value = "#")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "SVELTE");
    			attr_dev(img, "class", "svelte-1tgetzx");
    			add_location(img, file, 28, 4, 513);
    			attr_dev(h1, "class", "svelte-1tgetzx");
    			add_location(h1, file, 28, 0, 509);
    			attr_dev(div, "class", "svelte-1tgetzx");
    			add_location(div, file, 29, 0, 561);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			append_dev(h1, img);
    			append_dev(h1, t0);
    			append_dev(h1, t1);
    			append_dev(h1, t2);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*name*/ 2) set_data_dev(t1, /*name*/ ctx[1]);
    			if (!current || dirty & /*title*/ 1) set_data_dev(t2, /*title*/ ctx[0]);

    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 8) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[3], dirty, null, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("PageTemplate", slots, ['default']);
    	let { logo } = $$props;
    	let { title } = $$props;
    	let { name } = $$props;
    	const writable_props = ["logo", "title", "name"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<PageTemplate> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("logo" in $$props) $$invalidate(2, logo = $$props.logo);
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    		if ("name" in $$props) $$invalidate(1, name = $$props.name);
    		if ("$$scope" in $$props) $$invalidate(3, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ logo, title, name });

    	$$self.$inject_state = $$props => {
    		if ("logo" in $$props) $$invalidate(2, logo = $$props.logo);
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    		if ("name" in $$props) $$invalidate(1, name = $$props.name);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [title, name, logo, $$scope, slots];
    }

    class PageTemplate extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { logo: 2, title: 0, name: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PageTemplate",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*logo*/ ctx[2] === undefined && !("logo" in props)) {
    			console.warn("<PageTemplate> was created without expected prop 'logo'");
    		}

    		if (/*title*/ ctx[0] === undefined && !("title" in props)) {
    			console.warn("<PageTemplate> was created without expected prop 'title'");
    		}

    		if (/*name*/ ctx[1] === undefined && !("name" in props)) {
    			console.warn("<PageTemplate> was created without expected prop 'name'");
    		}
    	}

    	get logo() {
    		throw new Error("<PageTemplate>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set logo(value) {
    		throw new Error("<PageTemplate>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<PageTemplate>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<PageTemplate>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get name() {
    		throw new Error("<PageTemplate>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<PageTemplate>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/TodoInput.svelte generated by Svelte v3.31.2 */

    const file$1 = "src/components/TodoInput.svelte";

    function create_fragment$1(ctx) {
    	let input;
    	let t0;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			input = element("input");
    			t0 = space();
    			button = element("button");
    			button.textContent = "추가";
    			attr_dev(input, "type", "text");
    			attr_dev(input, "placeholder", "새로운 일정을 입력해 주세요");
    			attr_dev(input, "class", "svelte-1onzx9s");
    			add_location(input, file$1, 32, 0, 615);
    			attr_dev(button, "type", "button");
    			attr_dev(button, "class", "svelte-1onzx9s");
    			add_location(button, file$1, 37, 0, 727);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*todoValue*/ ctx[0]);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[3]),
    					listen_dev(input, "keyup", /*keyup_handler*/ ctx[4], false, false, false),
    					listen_dev(
    						button,
    						"click",
    						function () {
    							if (is_function(/*handleInsert*/ ctx[2])) /*handleInsert*/ ctx[2].apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;

    			if (dirty & /*todoValue*/ 1 && input.value !== /*todoValue*/ ctx[0]) {
    				set_input_value(input, /*todoValue*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(button);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("TodoInput", slots, []);
    	let { todoValue } = $$props;
    	let { handleKeyup } = $$props;
    	let { handleInsert } = $$props;
    	const writable_props = ["todoValue", "handleKeyup", "handleInsert"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<TodoInput> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		todoValue = this.value;
    		$$invalidate(0, todoValue);
    	}

    	const keyup_handler = e => handleKeyup(e);

    	$$self.$$set = $$props => {
    		if ("todoValue" in $$props) $$invalidate(0, todoValue = $$props.todoValue);
    		if ("handleKeyup" in $$props) $$invalidate(1, handleKeyup = $$props.handleKeyup);
    		if ("handleInsert" in $$props) $$invalidate(2, handleInsert = $$props.handleInsert);
    	};

    	$$self.$capture_state = () => ({ todoValue, handleKeyup, handleInsert });

    	$$self.$inject_state = $$props => {
    		if ("todoValue" in $$props) $$invalidate(0, todoValue = $$props.todoValue);
    		if ("handleKeyup" in $$props) $$invalidate(1, handleKeyup = $$props.handleKeyup);
    		if ("handleInsert" in $$props) $$invalidate(2, handleInsert = $$props.handleInsert);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [todoValue, handleKeyup, handleInsert, input_input_handler, keyup_handler];
    }

    class TodoInput extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			todoValue: 0,
    			handleKeyup: 1,
    			handleInsert: 2
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TodoInput",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*todoValue*/ ctx[0] === undefined && !("todoValue" in props)) {
    			console.warn("<TodoInput> was created without expected prop 'todoValue'");
    		}

    		if (/*handleKeyup*/ ctx[1] === undefined && !("handleKeyup" in props)) {
    			console.warn("<TodoInput> was created without expected prop 'handleKeyup'");
    		}

    		if (/*handleInsert*/ ctx[2] === undefined && !("handleInsert" in props)) {
    			console.warn("<TodoInput> was created without expected prop 'handleInsert'");
    		}
    	}

    	get todoValue() {
    		throw new Error("<TodoInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set todoValue(value) {
    		throw new Error("<TodoInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get handleKeyup() {
    		throw new Error("<TodoInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set handleKeyup(value) {
    		throw new Error("<TodoInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get handleInsert() {
    		throw new Error("<TodoInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set handleInsert(value) {
    		throw new Error("<TodoInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/TodoItem.svelte generated by Svelte v3.31.2 */

    const file$2 = "src/components/TodoItem.svelte";

    function create_fragment$2(ctx) {
    	let li;
    	let input;
    	let input_id_value;
    	let input_checked_value;
    	let t0;
    	let label;
    	let label_for_value;
    	let t1;
    	let span;
    	let t2_value = /*todo*/ ctx[0].content + "";
    	let t2;
    	let t3;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			li = element("li");
    			input = element("input");
    			t0 = space();
    			label = element("label");
    			t1 = space();
    			span = element("span");
    			t2 = text(t2_value);
    			t3 = space();
    			button = element("button");
    			button.textContent = "삭제";
    			attr_dev(input, "type", "checkbox");
    			attr_dev(input, "id", input_id_value = `todoCheck${/*todo*/ ctx[0].id}`);
    			attr_dev(input, "class", "chk-form svelte-21my8j");
    			input.checked = input_checked_value = /*todo*/ ctx[0].done;
    			add_location(input, file$2, 78, 1, 1467);
    			attr_dev(label, "for", label_for_value = `todoCheck${/*todo*/ ctx[0].id}`);
    			attr_dev(label, "class", "svelte-21my8j");
    			add_location(label, file$2, 84, 1, 1617);
    			attr_dev(span, "class", "svelte-21my8j");
    			toggle_class(span, "done", /*todo*/ ctx[0].done);
    			add_location(span, file$2, 89, 1, 1769);
    			attr_dev(button, "type", "button");
    			attr_dev(button, "class", "svelte-21my8j");
    			add_location(button, file$2, 92, 1, 1872);
    			attr_dev(li, "class", "svelte-21my8j");
    			add_location(li, file$2, 77, 0, 1461);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, input);
    			append_dev(li, t0);
    			append_dev(li, label);
    			append_dev(li, t1);
    			append_dev(li, span);
    			append_dev(span, t2);
    			append_dev(li, t3);
    			append_dev(li, button);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "click", /*click_handler*/ ctx[5], false, false, false),
    					listen_dev(span, "dblclick", /*dblclick_handler*/ ctx[6], false, false, false),
    					listen_dev(button, "click", /*click_handler_1*/ ctx[7], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*todo*/ 1 && input_id_value !== (input_id_value = `todoCheck${/*todo*/ ctx[0].id}`)) {
    				attr_dev(input, "id", input_id_value);
    			}

    			if (dirty & /*todo*/ 1 && input_checked_value !== (input_checked_value = /*todo*/ ctx[0].done)) {
    				prop_dev(input, "checked", input_checked_value);
    			}

    			if (dirty & /*todo*/ 1 && label_for_value !== (label_for_value = `todoCheck${/*todo*/ ctx[0].id}`)) {
    				attr_dev(label, "for", label_for_value);
    			}

    			if (dirty & /*todo*/ 1 && t2_value !== (t2_value = /*todo*/ ctx[0].content + "")) set_data_dev(t2, t2_value);

    			if (dirty & /*todo*/ 1) {
    				toggle_class(span, "done", /*todo*/ ctx[0].done);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("TodoItem", slots, []);
    	let { todo } = $$props;
    	let { index } = $$props;
    	let { handleRemove } = $$props;
    	let { handleCheck } = $$props;
    	let { handleModify } = $$props;
    	const writable_props = ["todo", "index", "handleRemove", "handleCheck", "handleModify"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<TodoItem> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => handleCheck(todo.id, todo.done);
    	const dblclick_handler = e => handleModify(e, todo.id);
    	const click_handler_1 = () => handleRemove(todo.id);

    	$$self.$$set = $$props => {
    		if ("todo" in $$props) $$invalidate(0, todo = $$props.todo);
    		if ("index" in $$props) $$invalidate(4, index = $$props.index);
    		if ("handleRemove" in $$props) $$invalidate(1, handleRemove = $$props.handleRemove);
    		if ("handleCheck" in $$props) $$invalidate(2, handleCheck = $$props.handleCheck);
    		if ("handleModify" in $$props) $$invalidate(3, handleModify = $$props.handleModify);
    	};

    	$$self.$capture_state = () => ({
    		todo,
    		index,
    		handleRemove,
    		handleCheck,
    		handleModify
    	});

    	$$self.$inject_state = $$props => {
    		if ("todo" in $$props) $$invalidate(0, todo = $$props.todo);
    		if ("index" in $$props) $$invalidate(4, index = $$props.index);
    		if ("handleRemove" in $$props) $$invalidate(1, handleRemove = $$props.handleRemove);
    		if ("handleCheck" in $$props) $$invalidate(2, handleCheck = $$props.handleCheck);
    		if ("handleModify" in $$props) $$invalidate(3, handleModify = $$props.handleModify);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		todo,
    		handleRemove,
    		handleCheck,
    		handleModify,
    		index,
    		click_handler,
    		dblclick_handler,
    		click_handler_1
    	];
    }

    class TodoItem extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {
    			todo: 0,
    			index: 4,
    			handleRemove: 1,
    			handleCheck: 2,
    			handleModify: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TodoItem",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*todo*/ ctx[0] === undefined && !("todo" in props)) {
    			console.warn("<TodoItem> was created without expected prop 'todo'");
    		}

    		if (/*index*/ ctx[4] === undefined && !("index" in props)) {
    			console.warn("<TodoItem> was created without expected prop 'index'");
    		}

    		if (/*handleRemove*/ ctx[1] === undefined && !("handleRemove" in props)) {
    			console.warn("<TodoItem> was created without expected prop 'handleRemove'");
    		}

    		if (/*handleCheck*/ ctx[2] === undefined && !("handleCheck" in props)) {
    			console.warn("<TodoItem> was created without expected prop 'handleCheck'");
    		}

    		if (/*handleModify*/ ctx[3] === undefined && !("handleModify" in props)) {
    			console.warn("<TodoItem> was created without expected prop 'handleModify'");
    		}
    	}

    	get todo() {
    		throw new Error("<TodoItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set todo(value) {
    		throw new Error("<TodoItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get index() {
    		throw new Error("<TodoItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set index(value) {
    		throw new Error("<TodoItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get handleRemove() {
    		throw new Error("<TodoItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set handleRemove(value) {
    		throw new Error("<TodoItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get handleCheck() {
    		throw new Error("<TodoItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set handleCheck(value) {
    		throw new Error("<TodoItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get handleModify() {
    		throw new Error("<TodoItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set handleModify(value) {
    		throw new Error("<TodoItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/TodoList.svelte generated by Svelte v3.31.2 */
    const file$3 = "src/components/TodoList.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	child_ctx[6] = i;
    	return child_ctx;
    }

    // (16:1) {:else}
    function create_else_block(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "No tasks today!";
    			add_location(p, file$3, 16, 2, 354);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(16:1) {:else}",
    		ctx
    	});

    	return block;
    }

    // (14:1) {#each todos as todo, index}
    function create_each_block(ctx) {
    	let todoitem;
    	let current;

    	todoitem = new TodoItem({
    			props: {
    				index: /*index*/ ctx[6],
    				todo: /*todo*/ ctx[4],
    				handleRemove: /*handleRemove*/ ctx[2],
    				handleCheck: /*handleCheck*/ ctx[1],
    				handleModify: /*handleModify*/ ctx[3]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(todoitem.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(todoitem, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const todoitem_changes = {};
    			if (dirty & /*todos*/ 1) todoitem_changes.todo = /*todo*/ ctx[4];
    			if (dirty & /*handleRemove*/ 4) todoitem_changes.handleRemove = /*handleRemove*/ ctx[2];
    			if (dirty & /*handleCheck*/ 2) todoitem_changes.handleCheck = /*handleCheck*/ ctx[1];
    			if (dirty & /*handleModify*/ 8) todoitem_changes.handleModify = /*handleModify*/ ctx[3];
    			todoitem.$set(todoitem_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(todoitem.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(todoitem.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(todoitem, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(14:1) {#each todos as todo, index}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let ul;
    	let current;
    	let each_value = /*todos*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	let each_1_else = null;

    	if (!each_value.length) {
    		each_1_else = create_else_block(ctx);
    	}

    	const block = {
    		c: function create() {
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			if (each_1_else) {
    				each_1_else.c();
    			}

    			attr_dev(ul, "class", "svelte-1dnk4fa");
    			add_location(ul, file$3, 12, 0, 234);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, ul, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			if (each_1_else) {
    				each_1_else.m(ul, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*todos, handleRemove, handleCheck, handleModify*/ 15) {
    				each_value = /*todos*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(ul, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();

    				if (each_value.length) {
    					if (each_1_else) {
    						each_1_else.d(1);
    						each_1_else = null;
    					}
    				} else if (!each_1_else) {
    					each_1_else = create_else_block(ctx);
    					each_1_else.c();
    					each_1_else.m(ul, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(ul);
    			destroy_each(each_blocks, detaching);
    			if (each_1_else) each_1_else.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("TodoList", slots, []);
    	let { todos } = $$props;
    	let { handleCheck } = $$props;
    	let { handleRemove } = $$props;
    	let { handleModify } = $$props;
    	const writable_props = ["todos", "handleCheck", "handleRemove", "handleModify"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<TodoList> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("todos" in $$props) $$invalidate(0, todos = $$props.todos);
    		if ("handleCheck" in $$props) $$invalidate(1, handleCheck = $$props.handleCheck);
    		if ("handleRemove" in $$props) $$invalidate(2, handleRemove = $$props.handleRemove);
    		if ("handleModify" in $$props) $$invalidate(3, handleModify = $$props.handleModify);
    	};

    	$$self.$capture_state = () => ({
    		TodoItem,
    		todos,
    		handleCheck,
    		handleRemove,
    		handleModify
    	});

    	$$self.$inject_state = $$props => {
    		if ("todos" in $$props) $$invalidate(0, todos = $$props.todos);
    		if ("handleCheck" in $$props) $$invalidate(1, handleCheck = $$props.handleCheck);
    		if ("handleRemove" in $$props) $$invalidate(2, handleRemove = $$props.handleRemove);
    		if ("handleModify" in $$props) $$invalidate(3, handleModify = $$props.handleModify);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [todos, handleCheck, handleRemove, handleModify];
    }

    class TodoList extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {
    			todos: 0,
    			handleCheck: 1,
    			handleRemove: 2,
    			handleModify: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TodoList",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*todos*/ ctx[0] === undefined && !("todos" in props)) {
    			console.warn("<TodoList> was created without expected prop 'todos'");
    		}

    		if (/*handleCheck*/ ctx[1] === undefined && !("handleCheck" in props)) {
    			console.warn("<TodoList> was created without expected prop 'handleCheck'");
    		}

    		if (/*handleRemove*/ ctx[2] === undefined && !("handleRemove" in props)) {
    			console.warn("<TodoList> was created without expected prop 'handleRemove'");
    		}

    		if (/*handleModify*/ ctx[3] === undefined && !("handleModify" in props)) {
    			console.warn("<TodoList> was created without expected prop 'handleModify'");
    		}
    	}

    	get todos() {
    		throw new Error("<TodoList>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set todos(value) {
    		throw new Error("<TodoList>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get handleCheck() {
    		throw new Error("<TodoList>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set handleCheck(value) {
    		throw new Error("<TodoList>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get handleRemove() {
    		throw new Error("<TodoList>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set handleRemove(value) {
    		throw new Error("<TodoList>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get handleModify() {
    		throw new Error("<TodoList>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set handleModify(value) {
    		throw new Error("<TodoList>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.31.2 */

    // (89:0) <PageTemplate {title} {name}>
    function create_default_slot(ctx) {
    	let todoinput;
    	let t;
    	let todolist;
    	let current;

    	todoinput = new TodoInput({
    			props: {
    				todoValue: /*todoValue*/ ctx[1],
    				handleKeyup: /*handleKeyup*/ ctx[4],
    				handleInsert: /*handleInsert*/ ctx[6]
    			},
    			$$inline: true
    		});

    	todolist = new TodoList({
    			props: {
    				todos: /*todos*/ ctx[2],
    				handleRemove: /*handleRemove*/ ctx[5],
    				handleCheck: /*handleCheck*/ ctx[7],
    				handleModify: /*handleModify*/ ctx[8]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(todoinput.$$.fragment);
    			t = space();
    			create_component(todolist.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(todoinput, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(todolist, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const todoinput_changes = {};
    			if (dirty & /*todoValue*/ 2) todoinput_changes.todoValue = /*todoValue*/ ctx[1];
    			todoinput.$set(todoinput_changes);
    			const todolist_changes = {};
    			if (dirty & /*todos*/ 4) todolist_changes.todos = /*todos*/ ctx[2];
    			todolist.$set(todolist_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(todoinput.$$.fragment, local);
    			transition_in(todolist.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(todoinput.$$.fragment, local);
    			transition_out(todolist.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(todoinput, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(todolist, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(89:0) <PageTemplate {title} {name}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let pagetemplate;
    	let current;

    	pagetemplate = new PageTemplate({
    			props: {
    				title: /*title*/ ctx[3],
    				name: /*name*/ ctx[0],
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(pagetemplate.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(pagetemplate, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const pagetemplate_changes = {};
    			if (dirty & /*name*/ 1) pagetemplate_changes.name = /*name*/ ctx[0];

    			if (dirty & /*$$scope, todos, todoValue*/ 1030) {
    				pagetemplate_changes.$$scope = { dirty, ctx };
    			}

    			pagetemplate.$set(pagetemplate_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(pagetemplate.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(pagetemplate.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(pagetemplate, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	let { name = "default" } = $$props;
    	let title = "TODO LIST";
    	let todoValue = "";

    	let todos = [
    		{ id: 0, content: "첫 번째 할일", done: false },
    		{ id: 1, content: "두 번째 할일", done: true },
    		{ id: 2, content: "세 번째 할일", done: false }
    	];

    	let todoId = todos[todos.length - 1]["id"];

    	let handleKeyup = e => {
    		$$invalidate(1, todoValue = e.target.value); // keyup 이벤트 발생시 todoValue 값을 업데이트

    		if (e.keyCode === 13) {
    			handleInsert();
    		}
    	};

    	let handleRemove = id => {
    		$$invalidate(2, todos = todos.filter(ele => ele.id !== id));
    	};

    	let handleInsert = () => {
    		if (todoValue) {
    			const newTodo = {
    				id: ++todoId,
    				content: todoValue,
    				done: false
    			};

    			$$invalidate(2, todos[todos.length] = newTodo, todos);
    			$$invalidate(1, todoValue = "");
    		} else {
    			alert("내용을 입력해 주세요.");
    		}
    	};

    	let handleCheck = (id, done) => {
    		const index = todos.findIndex(todo => todo.id === id);
    		$$invalidate(2, todos[index]["done"] = !done, todos);
    	};

    	let handleModify = (e, id) => {
    		const element = e.target;
    		const index = todos.findIndex(todo => todo.id === id);

    		const modify = function () {
    			element.removeAttribute("contenteditable");
    			$$invalidate(2, todos[index]["content"] = element.textContent, todos);
    			element.removeEventListener("blur", modify, false);
    		};

    		element.setAttribute("contenteditable", true);
    		element.focus();
    		element.addEventListener("blur", modify, false);
    	};

    	const writable_props = ["name"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    	};

    	$$self.$capture_state = () => ({
    		element,
    		PageTemplate,
    		TodoInput,
    		TodoList,
    		name,
    		title,
    		todoValue,
    		todos,
    		todoId,
    		handleKeyup,
    		handleRemove,
    		handleInsert,
    		handleCheck,
    		handleModify
    	});

    	$$self.$inject_state = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    		if ("title" in $$props) $$invalidate(3, title = $$props.title);
    		if ("todoValue" in $$props) $$invalidate(1, todoValue = $$props.todoValue);
    		if ("todos" in $$props) $$invalidate(2, todos = $$props.todos);
    		if ("todoId" in $$props) todoId = $$props.todoId;
    		if ("handleKeyup" in $$props) $$invalidate(4, handleKeyup = $$props.handleKeyup);
    		if ("handleRemove" in $$props) $$invalidate(5, handleRemove = $$props.handleRemove);
    		if ("handleInsert" in $$props) $$invalidate(6, handleInsert = $$props.handleInsert);
    		if ("handleCheck" in $$props) $$invalidate(7, handleCheck = $$props.handleCheck);
    		if ("handleModify" in $$props) $$invalidate(8, handleModify = $$props.handleModify);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		name,
    		todoValue,
    		todos,
    		title,
    		handleKeyup,
    		handleRemove,
    		handleInsert,
    		handleCheck,
    		handleModify
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { name: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get name() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const app = new App({
      target: document.body,
      props: {
        name: "world",
      },
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
