/* Zepto v1.1.6 - zepto event ajax form ie - zeptojs.com/license */

var Zepto = (function() {
	//全局变量
	var undefined, key, $, classList,

		// 获取数组的slice 和 filter（返回数组中的满足回调函数中指定的条件的元素）方法
		emptyArray = [],
		slice = emptyArray.slice,
		filter = emptyArray.filter,

		document = window.document,
		elementDisplay = {},
		//类名缓存对象
		classCache = {},
		//设置CSS时，不用加px单位的属性,1可转成成true
		cssNumber = {
			'column-count': 1,
			'columns': 1,
			'font-weight': 1,
			'line-height': 1,
			'opacity': 1,
			'z-index': 1,
			'zoom': 1
		},
		// HTML代码片断的正则:取出html代码中第一个html标签（或注释），如取出 <p>123</p>中的p
		fragmentRE = /^\s*<(\w+|!)[^>]*>/,
		// 匹配 <img /> <p></p>  不匹配 <img src=""/> <p>123</p>
		singleTagRE = /^<(\w+)\s*\/?>(?:<\/\1>|)$/,
		// 匹配非单独一个闭合标签的标签，类似将<div></div>写成了<div/>
		tagExpanderRE = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig,
		// 根节点
		rootNodeRE = /^(?:body|html)$/i,
		// 大写字母
		capitalRE = /([A-Z])/g,

		// 方法属性:通过方法调用来设置/获取的特殊属性
		methodAttributes = ['val', 'css', 'html', 'text', 'data', 'width', 'height', 'offset'],

		adjacencyOperators = ['after', 'prepend', 'before', 'append'],

		//创建默认容器
		table = document.createElement('table'),
		tableRow = document.createElement('tr'),
		// 指定特殊元素的 容器
		containers = {
			'tr': document.createElement('tbody'),
			'tbody': table,
			'thead': table,
			'tfoot': table,
			'td': tableRow,
			'th': tableRow,
			// 除了上面指定的，其他所有元素的容器都是 div
			'*': document.createElement('div')
		},

		// dom 已就绪事件,可进行js交互
		readyRE = /complete|loaded|interactive/,

		// 简单选择器:匹配一个包括（字母、数组、下划线、-）的字符串
		simpleSelectorRE = /^[\w-]*$/,
		//class类型,例如class2type[object String] = 'string'
		class2type = {},
		//等价于Object.prototype.toString,方便利用call或apply调用原型方法
		toString = class2type.toString,

		zepto = {},
		camelize, uniq,

		//默认临时父节点
		tempParent = document.createElement('div'),

		// css类名纠正:key是html中的属性名称，value是js对象中的属性名称
		propMap = {
			'tabindex': 'tabIndex',
			'readonly': 'readOnly',
			'for': 'htmlFor',
			'class': 'className',
			'maxlength': 'maxLength',
			'cellspacing': 'cellSpacing',
			'cellpadding': 'cellPadding',
			'rowspan': 'rowSpan',
			'colspan': 'colSpan',
			'usemap': 'useMap',
			'frameborder': 'frameBorder',
			'contenteditable': 'contentEditable'
		},
		// 判断是否是arr的函数,同时instanceof检测是为了兼容低版本,也可以用 Object.prototype.toString.call(value) === '[object Array]';
		isArray = Array.isArray || function(object) {
			return object instanceof Array;
		};

	// 上文定义 zepto = {},判断 element 是否符合 selector 的选择要求
	zepto.matches = function(element, selector) {
		// selector有值，element有值，element是普通DOM节点
		if(!selector || !element || element.nodeType !== 1) {
			return false;
		}

		// 判断当前的 elem 是否符合传入的 selector 的要求 
		var matchesSelector = element.webkitMatchesSelector ||
			element.mozMatchesSelector ||
			element.oMatchesSelector ||
			element.matchesSelector;
		if(matchesSelector) {
			return matchesSelector.call(element, selector);
		}

		// 浏览器不支持 matchesSelector
		var match,
			parent = element.parentNode,
			temp = !parent;

		// 上文定义 tempParent = document.createElement('div'),
		// 如果没有parent，parent赋值为一个div，然后将当前元素加入到这个div中
		if(temp) {
			parent = tempParent;
			tempParent.appendChild(element);
			// (parent = tempParent).appendChild(element); 这种写法不易读
		}

		// 通过 qsa 获取匹配的元素，判断其中有没有 element,~相当于+1再取反
		match = ~zepto.qsa(parent, selector).indexOf(element);

		if(temp) {
			// 如果没有parent时，之前执行过  tempParent.appendChild(element);
			// 此时要移除子元素
			tempParent.removeChild(element);
		}
		// temp && tempParent.removeChild(element)  // 这种写法不易读

		// 返回最终的匹配结果，经过 qsa 判断的结果
		return match;
	}

	//TODO 
	function type(obj) {
		// obj为null或者undefined时，直接返回'null'或'undefined'
		return(obj == null ? String(obj) : class2type[toString.call(obj)]) || "object";

		// 下文定义：
		// // Populate the class2type map
		// $.each("Boolean Number String Function Array Date RegExp Object Error".split(" "), function(i, name) {
		//   class2type[ "[object " + name + "]" ] = name.toLowerCase()
		// })
	}

	// 调用通过类型type判断function
	function isFunction(value) {
		return type(value) == "function";
	}

	// window的特点：window.window === window
	function isWindow(obj) {
		return obj != null && obj == obj.window;
	}

	// 判断document节点:document.nodeType === 9 === 9	DOCUMENT_NODE
	function isDocument(obj) {
		return obj != null && obj.nodeType == obj.DOCUMENT_NODE;
	}

	// 调用通用类型type判断object
	function isObject(obj) {
		return type(obj) == "object";
	}

	// 判断是否是最基本的new Object()：Object.getPrototypeOf(obj) == Object.prototype 参考http://snandy.iteye.com/blog/663245
	function isPlainObject(obj) {
		return isObject(obj) && !isWindow(obj) && Object.getPrototypeOf(obj) == Object.prototype;
	}

	// 数组或者对象数组,常见的nodelist.这里只做最简单length判断,若对象定义length属性,也认为是数组;
	function likeArray(obj) {
		return typeof obj.length == 'number';
	}

	// 筛选数组，踢出 null undefined 元素
	function compact(array) {
		return filter.call(array, function(item) {
			return item != null;
		})
	}

	// 浅层次拷贝数组,array若存在,则返回数组副本.$.fn.concat.apply([], array) 也可以换成 emptyArray.concat.apply([], array)
	function flatten(array) {
		return array.length > 0 ? $.fn.concat.apply([], array) : array;
	}

	// 驼峰命名转换,将"-"连字符转化成驼峰命名，例如 background-color 转换为 backgroundColor
	camelize = function(str) {
		return str.replace(/-+(.)?/g, function(match, chr) {
			return chr ? chr.toUpperCase() : '';
		});
	}

	// 逆驼峰转换,将驼峰命名转化成"-"命名,例如将 backgroundColor 转换为 background-color 
	function dasherize(str) {
		return str.replace(/::/g, '/') //将：：替换成/
			.replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2') //在大小写字符之间插入_,大写在前，比如AAAbb,得到AA_Abb
			.replace(/([a-z\d])([A-Z])/g, '$1_$2') //在大小写字符之间插入_,小写或数字在前，比如bbbAaa,得到bbb_Aaa
			.replace(/_/g, '-') //将_替换成-
			.toLowerCase() //转成小写
	}

	// 数组去重,若元素在数组中的位置与正在遍历的索引值不相同,则该元素重复,例如 将 [1,1,2,2,3,3] 替换为 [1,2,3]
	uniq = function(array) {
		return filter.call(array, function(item, idx) {
			return array.indexOf(item) == idx;
		});
	}

	// 类名正则缓存,例如将abc缓存成/(^|\s)abc(\s|$)/
	function classRE(name) {
		return name in classCache ? classCache[name] : (classCache[name] = new RegExp('(^|\\s)' + name + '(\\s|$)'));
	}

	// 可能需要追加px的css属性值，除了cssNumber里面的指定的那些默认属性
	function maybeAddPx(name, value) {
		// 如果 value 是数字，并且 name 不在 cssNumber 数组之内，就需要加 'px'，否则不需要
		return(typeof value == "number" && !cssNumber[dasherize(name)]) ? value + "px" : value;
	}

	// 从elementDisplay缓存中获取一个元素的默认 display 样式值，可能的结果是：inline block inline-block table .... （none 转换为 block）
	function defaultDisplay(nodeName) {
		var element, display;

		// elementDisplay若无nodeName信息,则获取nodeName默认的display属性并存储
		if(!elementDisplay[nodeName]) {
			// 则新建一个 nodeName 元素，添加到 body 中
			element = document.createElement(nodeName);
			document.body.appendChild(element);

			// 获取它的默认的 display 样式信息。参考https://developer.mozilla.org/zh-CN/docs/Web/API/Window/getComputedStyle
			display = getComputedStyle(element, '').getPropertyValue("display");

			// 接着马上移除元素！！！
			element.parentNode.removeChild(element);

			//TODO  'none' 换成 'block',不理解为什么这么做?
			display == "none" && (display = "block");
			// 存储下来
			elementDisplay[nodeName] = display;
		}

		// 最终返回 display 结果
		return elementDisplay[nodeName];
	}

	// 获取指定元素的子节点,若不支持children属性，则筛选childNodes 子节点
	function children(element) {
		//slice.call(likeArr) 可以将对象数组转换为真正的数组
		return 'children' in element ? slice.call(element.children) : $.map(element.childNodes, function(node) {
			if(node.nodeType == 1) return node;
		});
	}

	/**
	 * 处理html字符串片段
	 * @param {Object} html 待处理的html字符串
	 * @param {Object} name 通过 name 可在 containers 中查找容器节点，如果不传入，取得的容器默认为 div
	 * @param {Object} properties 节点属性对象
	 */
	zepto.fragment = function(html, name, properties) {
		var dom, nodes, container;

		// 如果 html 是单标签，则直接用该标签创建元素并转化成zepto对象
		if(singleTagRE.test(html)) {
			dom = $(document.createElement(RegExp.$1));
		}

		//dom未被赋值,说明 html 不是单标签
		if(!dom) {
			//纠错html字符串格式书写错误,如<p abc/>纠正为<p>abc</p>
			if(html.replace) {
				html = html.replace(tagExpanderRE, "<$1></$2>")
			}

			// 如果 name 未传入，则赋值为 html 的第一个标签
			if(name === undefined) {
				name = fragmentRE.test(html) && RegExp.$1
			}

			//设置容器标签名，如果不是containers中已定义的tr,tbody,thead,tfoot,td,th，则容器默认标签名为div
			if(!(name in containers)) {
				name = '*'
			}

			//创建指定容器
			container = containers[name];
			//将html代码片断放入容器: 转变为字符串的快捷方式
			container.innerHTML = '' + html;

			//TODO 遍历 container 的子元素（先转换为数组形式） 取容器的子节点，返回的同时，将每个子元素移除.
			// 1.为什么不直接调用已存在的children()方法?2.为什么移除子节点?
			dom = $.each(slice.call(container.childNodes), function() {
				container.removeChild(this);
			});
		}

		//如果properties是对象, 则将其当作属性来给添加进来的节点进行设置
		if(isPlainObject(properties)) {
			// 确保当前dom已转换为 zepto 对象
			nodes = $(dom);

			$.each(properties, function(key, value) {
				// 应该通过方法调用来设置/获取的特殊属性
				if(methodAttributes.indexOf(key) > -1) {
					nodes[key](value);
				} else { // 否则，通过属性复制
					nodes.attr(key, value);
				}
			})
		}

		//最终将html字符串转成zepto类型的DOM节点数组并返回
		return dom;
	}

	zepto.Z = function(dom, selector) {
		dom = dom || [];
		// 将 dom 隐式原型强制改为 $.fn以达到继承$.fn上所有方法的目的.为何不zepto.Z.prototype = $.fn直接修改Z函数的原型函数?
		dom.__proto__ = $.fn;
		dom.selector = selector || '';
		return dom;
	}

	zepto.isZ = function(object) {
		// 上文 dom.__proto__ = $.fn,下文 zepto.Z.prototype = $.fn. 因此，zepto对象都符合 object instanceof zepto.Z
		return object instanceof zepto.Z;
	}

	zepto.init = function(selector, context) {
		var dom
		//没有参数，返回空数组Zepto对象
		if(!selector) {
			return zepto.Z();
		} else if(typeof selector == 'string') {
			// 字符串的情况，一般有两种：
			// 第一，一段 html 代码，旨在通过zepto生成dom对象
			// 第二，一段查询字符串，旨在通过zepto查找dom对象,将查询结果存储到 dom 变量中

			selector = selector.trim();

			// 若selector是html字符串,则查找dom节点
			if(selector[0] == '<' && fragmentRE.test(selector)) {
				// 第一，RegExp.$1取出来的就是第一个标签名称，即正则中 (\w+|!) 对应的内容
				// 第二，此时的 context 应该传入的是css属性对象（TODO 这里会产生歧义，老版的不会传入 context）
				dom = zepto.fragment(selector, RegExp.$1, context), selector = null
			} else if(context !== undefined) { // 如果 selector 不是html字符串标签，并且 context 有值，则从context中查找
				return $(context).find(selector);
			} else { // 除了以上情况，就从整个 document 执行 qsa 的查找
				dom = zepto.qsa(document, selector);
			}
		} else if(isFunction(selector)) { // 如果是函数，则dom ready时执行
			return $(document).ready(selector);
		} else if(zepto.isZ(selector)) { // 传入的参数本身就已经是 zepto 对象，则直接返回
			return selector;
		} else {
			//TODO 什么情况发生?
			if(isArray(selector)) {
				dom = compact(selector);
			} else if(isObject(selector)) {
				dom = [selector], selector = null
			} else if(fragmentRE.test(selector)) {
				dom = zepto.fragment(selector.trim(), RegExp.$1, context), selector = null;
			} else if(context !== undefined) {
				return $(context).find(selector);
			} else {
				dom = zepto.qsa(document, selector);
			}
		}

		// 最终，还是通过 zepto.Z 创建了对象,这里的 dom，其实就是一个数组
		return zepto.Z(dom, selector)
	}

	// $ 最终匿名函数所返回，并复制给了全局的 Zepto 变量
	$ = function(selector, context) {
		return zepto.init(selector, context);
	}

	function extend(target, source, deep) {
		for(key in source) {
			// 深度递归，首先必须 deep 参数为 true其次，source[key] 必须是数组或者对象，才有必要深度递归（否则没必要）
			if(deep && (isPlainObject(source[key]) || isArray(source[key]))) {
				// source[key] 是对象，而 target[key] 不是对象,则 先初始化target[key] = {};
				if(isPlainObject(source[key]) && !isPlainObject(target[key])) {
					target[key] = {};
				}

				// source[key] 是数组，而 target[key] 不是数组,则 先初始化target[key] = [] 
				if(isArray(source[key]) && !isArray(target[key])) {
					target[key] = [];
				}

				// 执行递归
				extend(target[key], source[key], deep);
			} else if(source[key] !== undefined) { //一般类型,直接更新目标值
				target[key] = source[key];
			}
		}
	}

	$.extend = function(target) {
		// 一般传入的参数会是：
		// (targetObj, srcObj1, srcObj2, srcObj1...)
		// (true, targetObj, srcObj1, srcObj2, srcObj1...)

		// arguments 是对象数组，args得到arguments对象数组第二位开始的数组作为参数
		var deep, args = slice.call(arguments, 1);

		// 若第一个参数是boolean，这里会把第二个参数当做 target，其他的作为 source
		if(typeof target == 'boolean') {
			//第一个参数表示是否深度扩展
			deep = target;
			//删除args数组的首位,即第二个参数表示目标,删除的arg参数数组作为源对象
			target = args.shift();
		}

		// 直接调用核心方法extend(): 将所有的 source 添加到 target 中,做到业务与逻辑分离
		args.forEach(function(arg) {
			extend(target, arg, deep);
		});
		return target;
	}

	/**
	 * 
	 * @param {Object} element 容器
	 * @param {Object} selector 选择器
	 */
	zepto.qsa = function(element, selector) {
		var found,
			//可能是id选择器:以#开头
			maybeID = selector[0] == '#',
			//可能是类选择器:不是id选择器,且以.开头
			maybeClass = !maybeID && selector[0] == '.',
			// 选择器关键值,ID或class形式：返回 selector.slice(1) 即ID或者class的值, 否则：返回 selector，如通过 tagName 查询
			nameOnly = (maybeID || maybeClass) ? selector.slice(1) : selector,
			// 是否是一个简单的字符串（可能是一个复杂的选择器，如 'div#div1 .item[link] .red'）
			isSimple = simpleSelectorRE.test(nameOnly);

		/**
		 * 以下代码的基本思路是：
		 * 	1. 优先通过 ID 获取元素；
		 * 	2. 然后试图通过 className 和 tagName 获取元素
		 *  3. 最后通过 querySelectorAll 来获取
		 */
		return(isDocument(element) && isSimple && maybeID) ?
			// 这是最简单的形式：容器是document、选择器是一个id,因为 getElementById 只能在 document 上用，所以这里单独拿出来
			((found = element.getElementById(nameOnly)) ? [found] : []) :

			// 容器不是一般元素，也不是document，直接返回 []
			(element.nodeType !== 1 && element.nodeType !== 9) ? [] :

			// 将获取的所有元素集合，都转换为数组
			slice.call(
				// isSimple情况下，nameOnly 只可能是 className 或者 tagName
				isSimple && !maybeID

				?
				//简单选择器,只要能确定class或tag，尽量使用getElementsByClassName和getElementsByTagName,比querySelectorAll快

				maybeClass ?
				//element有值且选择器是class,则使用getElementsByClassName,比 querySelectorAll 速度快
				element.getElementsByClassName(nameOnly) :
				//element有值且选择器是不是clss,则是tag,则使用getElementsByTagName,比 querySelectorAll 速度快
				element.getElementsByTagName(selector)

				// 最后其他情况(包括复杂情况)，只能通过 querySelectorAll 来处理
				:
				element.querySelectorAll(selector)
			);
	}

	// 过滤结果
	function filtered(nodes, selector) {
		//根据 selector 筛选 nodes ,并将 nodes 封装为 zepto 对象
		return selector == null ? $(nodes) : $(nodes).filter(selector);
	}

	// 判断 parent 是否包含 node
	$.contains = document.documentElement.contains ?
		// 浏览器支持 contains 方法,则直接判断parent.contains(node)
		function(parent, node) {
			return parent !== node && parent.contains(node);
		} :
		// 不支持 contains 方法,则递归比较父节点
		function(parent, node) {
			while(node && (node = node.parentNode)) {
				if(node === parent) {
					return true
				}
				return false
			}
		}

	function funcArg(context, arg, idx, payload) {
		// 如果 arg 是函数，则改变函数的执行环境和参数,如果不是，直接返回 arg
		return isFunction(arg) ? arg.call(context, idx, payload) : arg
	}

	function setAttribute(node, name, value) {
		//如果设置的值为null或undefined,则相当于删除该属性，否则设置name属性为value
		value == null ? node.removeAttribute(name) : node.setAttribute(name, value);
	}

	// 设置或获取 node 的 className 参考https://developer.mozilla.org/en-US/docs/Web/API/SVGAnimatedString/baseVal
	function className(node, value) {
		var klass = node.className || '',
			svg = klass && klass.baseVal !== undefined

		// 获取
		if(value === undefined) return svg ? klass.baseVal : klass
		// 设置
		svg ? (klass.baseVal = value) : (node.className = value)
	}

	// 反序列化值,将字符串转成原始类型
	function deserializeValue(value) {
		try {
			return value ?
				// value『有值』的情况：

				// 如果 value == 'true'，那么这个表达式本身就返回 true ，导致整个函数返回true
				value == "true" ||
				// value !== 'true' 的情况：
				(
					value == "false" ? false : // "null"  => null
					value == "null" ? null : // "null"  => null
					+value + "" == value ? +value : // TODO 数字："42" => 42  "42.5" => 42.5  （ 但是 '08' 却不符合这个条件 ）
					/^[\[\{]/.test(value) ? $.parseJSON(value) : // '[...]' 或者 '{...}'
					value // 其他
				)

				// value『无值』的情况： undefined / '' / flase / 0 / null
				:
				value;
		} catch(e) {
			return value;
		}
	}

	// 将上文定义的函数，暴露给 $ 对象（其实 $ 是一个 function）
	$.type = type
	$.isFunction = isFunction
	$.isWindow = isWindow
	$.isArray = isArray
	$.isPlainObject = isPlainObject

	//空对象
	$.isEmptyObject = function(obj) {
		var name;
		//若对象可遍历,则不是空对象,否则是空对象
		for(name in obj) {
			return false
		}
		return true
	}

	$.inArray = function(elem, array, i) {
		//封装数组的indexOf方法获取指定的值在数组中的位置
		return emptyArray.indexOf.call(array, elem, i);
	}

	$.camelCase = camelize

	$.trim = function(str) {
		//封装String的trim方法:去字符串头尾空格
		return str == null ? "" : String.prototype.trim.call(str)
	}

	// plugin compatibility
	$.uuid = 0
	$.support = {}
	$.expr = {}

	$.map = function(elements, callback) {
		var value, values = [],
			i, key;

		//TODO 注意这里没有统一的用for in,是为了避免遍历数据默认属性的情况，如数组的toString,valueOf
		if(likeArray(elements)) { // 数组，或者对象数组
			for(i = 0; i < elements.length; i++) {
				// 遍历，经过 callback 验证，push到结果中
				value = callback(elements[i], i);
				if(value != null) {
					values.push(value);
				}
			}
		} else { // 对象
			for(key in elements) {
				// 遍历，经过 callback 验证，push到结果中
				value = callback(elements[key], key);
				if(value != null) {
					values.push(value);
				}
			}
		}

		// 再次确保返回数组
		return flatten(values);
	}

	// 遍历 elements 所有元素（数组、对象数组、对象），执行 callback 方法，最终还是返回 elements
	// 注意1：callback.call(elements[i], i, elements[i]) 函数执行的环境和参数,map没绑定的原因可能在于不需处理环境,重在处理元素
	// 注意2：=== false) return elements 一旦有函数返回 false，即跳出循环，类似 break
	// 注意3：无论哪种情况，最终返回的还是 elements
	$.each = function(elements, callback) {
		var i, key;

		//遍历数组，指定callback的上下文，若某元素的处理结果明确返回false，则停止遍历，并返回elements
		if(likeArray(elements)) {
			for(i = 0; i < elements.length; i++) {
				if(callback.call(elements[i], i, elements[i]) === false) {
					return elements;
				}
			}
		} else {
			for(key in elements) {
				if(callback.call(elements[key], key, elements[key]) === false) {
					return elements;
				}
			}
		}

		return elements;
	}

	// 筛选数组
	$.grep = function(elements, callback) {
		return filter.call(elements, callback)
	}

	if(window.JSON) $.parseJSON = JSON.parse

	$.each("Boolean Number String Function Array Date RegExp Object Error".split(" "), function(i, name) {
		/*
		  上文将 class2type 赋值为 {}
		  最终将 class2type 赋值为：
		  {
		    '[object boolean]': 'boolean',
		    '[object number]': 'number',
		    '[object string]': 'string',
		    ...
		  }

		  存储这个数据是为了方便的获取一些对象的类型，
		  例如 Object.prototype.toString.call([]) 返回的是 '[Object Array]'
		  那么即可根据这个获取 [] 的类型是 'array'
		*/
		class2type["[object " + name + "]"] = name.toLowerCase();
	});

	$.fn = {
		// 为何要这么多数组的方法？因为一个 zepto 对象，本身就是一个数组
		forEach: emptyArray.forEach,
		reduce: emptyArray.reduce,
		push: emptyArray.push,
		sort: emptyArray.sort,
		indexOf: emptyArray.indexOf,
		concat: emptyArray.concat,

		map: function(fn) {
			//调用核心方法 $.map()
			return $(
				$.map(this, function(el, i) {
					return fn.call(el, i, el);
				})
			);
		},
		slice: function() {
			// 直接数组的slice方法，并将结果用 $ 封装返回
			return $(slice.apply(this, arguments));
		},
		ready: function(callback) {
			//监听domready事件
			if(readyRE.test(document.readyState) && document.body) {
				callback($);
			} else {
				document.addEventListener('DOMContentLoaded', function() {
					callback($);
				}, false);
			}
			return this
		},
		get: function(idx) {
			return idx === undefined ?
				// 未传参数，直接返回一整个数组
				slice.call(this) :
				// 有参数，则试图返回单个元素（大于0，小于0 两种情况）
				this[
					idx >= 0 ?
					idx :
					idx + this.length
				]
		},
		toArray: function() {
			// 将zepto集合变为纯数组
			return this.get()
		},
		size: function() {
			return this.length
		},
		// 将元素从这个DOM树中移除
		remove: function() {
			return this.each(function() {
				if(this.parentNode != null) {
					this.parentNode.removeChild(this);
				}
			});
		},
		each: function(callback) {
			//TODO 这里和已定义的$.each()有何区别?
			emptyArray.every.call(this, function(el, idx) {
				return callback.call(el, idx, el) !== false
			});
			return this;
		},
		filter: function(selector) {
			// not函数下文定义
			// 如果给not传入的参数是函数，则返回不符合这个函数规则的元素的数组（用 $ 封装）
			if(isFunction(selector)) {
				return this.not(this.not(selector));
			}
			// 利用 [].filter 方法做筛选，利用 zepto.matches 做判断
			return $(filter.call(this, function(element) {
				return zepto.matches(element, selector);
			}));
		},
		add: function(selector, context) {
			//追加并去重
			return $(uniq(this.concat($(selector, context))))
		},
		is: function(selector) {
			// 注意：这里只对 this[0] 第一个元素做判断了，其他的元素不管了
			return this.length > 0 && zepto.matches(this[0], selector);
		},
		not: function(selector) {
			// 存储最后返回的结果
			var nodes = [];

			//当selector为函数时，safari下的typeof odeList也是function，所以这里需要再加一个判断selector.call !== undefined
			if(isFunction(selector) && selector.call !== undefined) {
				this.each(function(idx) {
					// 当函数返回 false 时（即不符合函数的规则），则将当前元素push到结果中，等待返回
					if(!selector.call(this, idx)) {
						nodes.push(this);
					}
				})
			} else { //当selector为不是函数时，对集合进行筛选，也就是筛选出集合中满足selector的记录
				var excludes =
					// 如果 selector 是字符串（css选择器），则用filter过滤，将结果存储到 excludes 中
					typeof selector == 'string' ? this.filter(selector) :

					// 如果 selector 不是字符串

					// 如果是数组或者对象数组（TODO 并且 selector.item 是函数?），则生成数组，赋值给 excludes
					(likeArray(selector) && isFunction(selector.item)) ? slice.call(selector)

					// 否则直接生成 zepto 对象，赋值给 excludes
					:
					$(selector);

				// 至此，excludes 中就存储了通过 selector 查找出来的元素

				// [].forEach 是ES5的新特性
				this.forEach(function(el) {
					// 取出 excludes 中不包含的元素，push到结果中
					if(excludes.indexOf(el) < 0) {
						nodes.push(el)
					}
				})
			}

			// 返回最后的结果，用 $ 封装
			return $(nodes)
		},
		has: function(selector) {
			// 经过 filter 函数处理，返回的是一个处理后的值
			return this.filter(function() {
				return isObject(selector) ?
					// 如果 seletor 是 object（可能是elem节点），则用 $.contains 判断
					$.contains(this, selector) :
					// 否则（selector是css选择字符串）则返回find后的size（如果 size === 0 即相当于返回 false）
					$(this).find(selector).size()
			});
		},
		eq: function(idx) {
			//选择集合中指定索引的记录，当idx为-1时，取最后一个记录
			return idx === -1 ? this.slice(idx) : this.slice(idx, +idx + 1)
		},
		first: function() {
			//取集合中的第一条记录
			var el = this[0];

			//如果el本身就已经是zepto对象则直接返回本身，否则转成zepto对象
			return(el && !isObject(el)) ? el : $(el);
		},
		last: function() {
			//取集合中的最后一条记录
			var el = this[this.length - 1];

			return(el && !isObject(el)) ? el : $(el);
		},
		find: function(selector) {
			// result 存储返回结果
			var result, $this = this;

			// 如果没有参数，就返回一个空的 zepto 对象
			if(!selector) {
				result = $();
			} else if(typeof selector == 'object') { // 如果selector是对象
				//如果$.contains(parent, node)返回true，则emptyArray.some也会返回true,外层的filter则会收录该条记录
				result = $(selector).filter(function() {
					var node = this;
					return emptyArray.some.call($this, function(parent) {
						return $.contains(parent, node)
					});
				});
			} else if(this.length == 1) {
				// 如果 selector 不是对象（即是css选择器）：
				// 如果只有一个元素，则使用 qsa 判断，结果经过 $ 封装后赋值给 result
				result = $(zepto.qsa(this[0], selector));
			} else {
				// 如果有多个元素，则使用 map 遍历所有元素，使用 qsa 针对每个元素判断，符合条件即返回
				result = this.map(function() {
					return zepto.qsa(this, selector);
				});
			}

			// 返回最终结果
			return result;
		},
		//  从元素本身开始，逐级向上级元素匹配，并返回最先匹配selector的元素
		closest: function(selector, context) {
			var node = this[0],
				collection = false;

			// 如果 selector 是对象，则用 $ 封装后，赋值给 collection
			if(typeof selector == 'object') {
				collection = $(selector)
			}

			while(
				// while循环的判断条件：
				// 第一，node有值（node一开始被赋值为对象的第一个元素）
				// 第二，collection有值（传入的selector是对象）则collection包含node；collection无值（传入的selector是字符串，css选择），则node满足selector条件
				// 满足第一个条件，不满足第二条件，则循环继续（node试图赋值为node.parentNode）；否则，循环跳出（说明已经找到了符合条件的父节点）
				node && !(
					collection ? collection.indexOf(node) >= 0 : zepto.matches(node, selector)
				)
			) {
				// node赋值成 node.parentNode
				// 前提条件是：node != context && node 不是 document，如果是这两个条件之一，那就不继续赋值
				node = node !== context && !isDocument(node) && node.parentNode
				// 返回最终结果
				return $(node);
			}
		},
		parents: function(selector) {
			var ancestors = [],
				nodes = this;
			while(nodes.length > 0) {
				// 可能需要执行多次 while 循环
				// 每次执行 $.map 函数都会对 nodes 重新赋值，然后再判断是否需要继续循环
				// 因为要获取每个元素的所有祖先元素，所以要多次循环
				nodes = $.map(nodes, function(node) {
					// 使用 $.map（返回符合条件的元素的新数组，并用 $ 封装）遍历所有元素
					if((node = node.parentNode) && !isDocument(node) && ancestors.indexOf(node) < 0) {
						// 将符合条件的元素push到结果中
						// 条件：不能是 document，结果中元素不能重复。否则不执行push
						ancestors.push(node);

						// 返回的 node ，将拼接出新数组，重新复制给 nodes，然后试图继续执行 while 循环
						return node;
					}
				});
			}
			// 如果css选择器参数给出，过滤出符合条件的元素
			return filtered(ancestors, selector)
		},
		parent: function(selector) {
			// pluck 函数在下文定义
			// parent 函数，只获取第一级父节点即可
			return filtered(uniq(this.pluck('parentNode')), selector);
		},
		children: function(selector) {
			// 获得每个匹配元素集合元素的直接子元素，可通过 selector 过滤
			return filtered(
				this.map(function() {
					return children(this)
				}), selector
			);
		},
		contents: function() {
			// 获得每个匹配元素集合元素的子元素，包括文字和注释节点
			return this.map(function() {
				return slice.call(this.childNodes)
			});
		},
		siblings: function(selector) {
			// 获取对象集合中所有元素的兄弟节点，可通过 selector 过滤
			return filtered(this.map(function(i, el) {
				//先获取该节点的父节点中的所有子节点，再排除本身
				return filter.call(children(el.parentNode), function(child) {
					return child !== el
				});
			}), selector);
		},
		empty: function() {
			return this.each(function() {
				this.innerHTML = '';
			})
		},
		pluck: function(property) {
			//根据属性来获取当前集合的相关集合
			return $.map(this, function(el) {
				return el[property]
			});
		},
		show: function() {
			/**
			 * show 方法是为了显示对象，而对象隐藏的方式有两种：内联样式 或 css样式
			 * this.style.display 只能获取内联样式的值（获取属性值）
			 * getComputedStyle(this, '').getPropertyValue("display") 可以获取内联、css样式的值（获取 renderTree 的值）
			 * 那么为什么还要用this.style.display判断?
			 */
			return this.each(function() {
				// 第一步，针对内联样式，将 none 改为空字符串，如 <p id="p2" style="display:none;">p2</p>
				this.style.display == "none" && (this.style.display = '');

				// 第二步，针对css样式，如果是 none 则修改为默认的显示样式
				if(getComputedStyle(this, '').getPropertyValue("display") == "none") {
					this.style.display = defaultDisplay(this.nodeName);
				}
			});
		},
		replaceWith: function(newContent) {
			// 先在前面插入，然后将当前对象移除
			return this.before(newContent).remove();
		},
		wrap: function(structure) {
			// 是否是函数
			var func = isFunction(structure);
			if(this[0] && !func) {
				//如果structure是字符串，则将其转成DOM
				var dom = $(structure).get(0),
					// 何时用 clone ？
					// 第一，dom.parentNode 说明 dom 在文档结构中，不 clone 就会被移动
					// 第二，this.length > 1 说明当前对象有多个元素，每个元素都要添加，所有要clone
					clone = dom.parentNode || this.length > 1;
			}
			return this.each(function(index) {
				// 借用 wrapAll 方法来做包装
				$(this).wrapAll(
					func ? structure.call(this, index) :
					clone ? dom.cloneNode(true) : dom
				)
			});
		},
		wrapAll: function(structure) {
			if(this[0]) {
				//将structure插入到第一条记录的前面，用于structure定位位置
				$(this[0]).before(structure = $(structure))

				var children;
				//取structure里的第一个子节点的最里层 通过循环，
				while((children = structure.children()).length) {
					//将 structure 重新赋值为当前 structure 的最深处的一个子元素 
					structure = children.first();
					// 将所有子元素都包裹进 structure
					$(structure).append(this);
				}
			}

			// 返回当前对象
			return this
		},
		wrapInner: function(structure) {
			// 是否是函数
			var func = isFunction(structure);

			// 返回对象自身，保证链式操作
			return this.each(function(index) {
				//获取节点的内容，然后用structure将内容包起来，如果内容不存在，则直接将structure append到该节点
				var self = $(this),
					contents = self.contents(),
					// 是函数，即获取函数执行的返回结果；否则直接用 structure 参数
					dom = func ? structure.call(this, index) : structure

				// 如果当前元素有内容，则通过内容 wrapAll。无内容，则直接用自身的 append 增加
				contents.length ? contents.wrapAll(dom) : self.append(dom);
			});
		},
		unwrap: function() {
			this.parent().each(function() {
				// 将当前父节点替换为它的子节点
				$(this).replaceWith($(this).children())
			});

			return this;
		},
		clone: function() {
			// 通过 this.map 循环对象，再调用cloneNode方法
			return this.map(function() {
				//调用node的cloneNode方法实现克隆
				return this.cloneNode(true);
			})
		},
		hide: function() {
			return this.css("display", "none");
		},
		toggle: function(setting) {
			return this.each(function() {
				var el = $(this);
				/**
				 * 当无参数时,切换显示与隐藏效果,若传参数true|false,则直接显示或隐藏,不再控制切换效果.
				 * 实现原理:
				 * $.toggle()无参数时,setting === undefined成立,此时需要控制切换,根据元素的display是否等于none来决定显示或者隐藏元素
				 * $.toggle()有参数时,setting === undefined不成立,直接根据setting=[true|false]设置显示或隐藏
				 */
				((setting === undefined) ? (el.css("display") == "none") : setting) ?
				// 如果 true 则显示,可能是隐藏->显示,也可能是*->显示
				el.show():
					// 如果 false 则隐藏,可能是显示->隐藏,也可能是*->隐藏
					el.hide()
			})
		},
		prev: function(selector) {
			// 借助 previousElementSibling 属性过滤属性集合
			return $(this.pluck('previousElementSibling')).filter(selector || '*');
		},
		next: function(selector) {
			// 借助 nextElementSibling 属性过滤属性集合
			return $(this.pluck('nextElementSibling')).filter(selector || '*')
		},
		html: function(html) {
			//当有参数时，设置集合每条记录的HTML，没有参数时，则为获取集合第一条记录的HTML，如果集合的长度为0,则返回null
			return

			// 情况1：有参数，赋值，并返回自身
			0 in arguments ?
				//否则遍历集合，设置每条记录的html
				this.each(function(idx) {
					//记录原始的innerHTMl属性内容
					var originHtml = this.innerHTML;

					/**
					 * 传入的 html 参数允许是一个字符串，也允许是一个函数,通过 funcArg 函数：
					 * 	1.如果 html 是字符串，则返回html并插入
					 * 	2.如果 html 是函数，则执行执行函数（传入 idx、originHtml），返回函数执行结果再插入
					 */
					$(this).empty().append(funcArg(this, html, idx, originHtml))
				}) :
				// 情况2：无参数，zepto对象数组长度为0,则返回null,否则返回第一个元素的innerHTML属性
				(0 in this ?
					this[0].innerHTML :
					null
				)
		},
		text: function(text) {
			//和上文html类似,这里textContent属性参考https://developer.mozilla.org/zh-CN/docs/Web/API/Node/textContent
			return
			0 in arguments ?
				this.each(function(idx) {
					var newText = funcArg(this, text, idx, this.textContent)
					this.textContent = newText == null ? '' : '' + newText
				}) :
				(0 in this ? this[0].textContent : null)
		},
		attr: function(name, value) {
			var result

			return

			// 情况1：无第二个参数，读取值（读取值只能读取第一个元素的值）
			(typeof name == 'string' && !(1 in arguments)) ?
			//zepto对象数组无元素或者元素类型不是元素element，返回undefined
			(((!this.length) || (this[0].nodeType !== 1)) ? undefined :
				/**
				 * 注意直接定义在node上的属性，在标准浏览器和ie9,10中用getAttribute取不到,得到的结果是null
				 * 比如div.aa = 10,用div.getAttribute('aa')得到的是null,需要用div.aa或者div['aa']这样来取
				 * 
				 * this[0]是一个DOM节点，有『属性』也有『特性』
				 *   result = this[0].getAttribute(name) 试图获取 DOM节点属性
				 *   name in this[0] 判断是不是js对象的属性
				 * 然后，该返回哪一个就返回哪一个
				 */
				(!(result = this[0].getAttribute(name)) && name in this[0]) ?
				this[0][name] :
				result
			) :

			// 情况2：有第二个参数，设置值（针对每个元素设置值）
			this.each(function(idx) {
				//非元素类型不可设置属性,直接返回
				if(this.nodeType !== 1) {
					return;
				}

				if(isObject(name)) { // 传入的参数可能是一个对象集合,如{'id':'test','value':11},则给数据设置属性
					for(key in name) {
						setAttribute(this, key, name[key]);
					}
				} else { // 传入的不是对象，即设置一个单一的属性。注意value也可能是函数
					/**
					 * 如果name只是一个普通的属性字符串，用funcArg来处理value是值或者function的情况最终返回一个属性值
					 * 如果funcArg函数返回的是undefined或者null，则相当于删除元素的属性
					 */
					setAttribute(this, name, funcArg(this, value, idx, this.getAttribute(name)));
				}
			});
		},
		removeAttr: function(name) {
			return this.each(
				function() {
					this.nodeType === 1 && name.split(' ').forEach(
						function(attribute) {
							// 将属性设置为空，setAttribute会移除属性
							setAttribute(this, attribute)
						},
						this // 改参数将成为 forEach 中函数的this
					)
				}
			)
		},
		prop: function(name, value) {
			// propMap 中存储的：key是html中的属性名称，value是js对象中的属性名称
			name = propMap[name] || name;

			return

			// 有第二个参数，设置属性
			(1 in arguments) ?
			this.each(function(idx) {
					// 设置属性值，funcArg处理函数或者非函数
					this[name] = funcArg(this, value, idx, this[name]);
				}):
				// 无第二个参数，读取属性（读取第一个元素的）
				(this[0] && this[0][name])
		},
		data: function(name, value) {
			//读取 前面加上 'data-' 自定义属性,将 'A' 替换为 '-a'
			var attrName = 'data-' + name.replace(capitalRE, '-$1').toLowerCase();

			/**
			 * 前面加上 'data-' 通过 attr 设置或者读取
			 * 
			 * 第二个参数存在,即设置属性值,否则读取属性值
			 * 注意attr方法里，当value存在的时候，返回的是集合本身，如果不存在，则是返回获取的值
			 */
			var data = (1 in arguments) ?
				this.attr(attrName, value) :
				this.attr(attrName)

			//deserializeValue作用将字符串变成响应的对象或者值
			return data !== null ? deserializeValue(data) : undefined
		},
		val: function(value) {
			return

			// 有参数，设置值
			0 in arguments ?
				this.each(function(idx) {
					// 遍历每个元素，直接对 value 属性赋值
					this.value = funcArg(this, value, idx, this.value)
				}) :

				// 无参数，读取值
				(this[0] && (
					// 如果元素是 <select multiple> 多选列表
					this[0].multiple ?
					// 返回所有选中的option的值的数组
					$(this[0]).find('option').filter(function() {
						return this.selected
					}).pluck('value') :

					// 如果不是，直接获取 value
					this[0].value
				))
		},
		offset: function(coordinates) {
			// 如果有 coordinates 参数，设置坐标值，并返回当前对象
			if(coordinates) return this.each(function(index) {
				var $this = $(this),
					// 支持函数（传入 $this.offset() 做参数）和非函数
					coords = funcArg(this, coordinates, index, $this.offset()),
					// 找到最近的 “relative”, “absolute” or “fixed” 的祖先元素，并获取它的 offset()
					parentOffset = $this.offsetParent().offset(),
					// left 和 top 需要去掉定位的祖先元素的 left、top 值
					props = {
						top: coords.top - parentOffset.top,
						left: coords.left - parentOffset.left
					}
				// static时，设置 top、left是无效的
				if($this.css('position') == 'static') props['position'] = 'relative'

				// 通过 css 赋值
				$this.css(props)
			})

			// 当前对象是空，则返回 null
			if(!this.length) return null

			/**
			 * 参考https://developer.mozilla.org/zh-CN/docs/Web/API/Element/getBoundingClientRect
			 * elem.getBoundingClientRect() 返回一个对象,包含元素的 top bottom left right width height 的值
			 * 但是这个 top、bottom、left、right 是相对于浏览器窗口的距离，而不是页面的边界
			 * （注意，elem.getBoundingClientRect()在IE低版本浏览器有2px的兼容问题）
			 *  window.pageXOffset 和 window.pageYOffset 可获取网页滚动的距离，IE低版本需要用 document.body.scrollLeft 和 document.body.scrollTop 兼容
			 * 
			 * 如果没有 coordinates 参数，则返回第一个元素的坐标值
			 * 
			 */
			var obj = this[0].getBoundingClientRect()
			return {
				left: obj.left + window.pageXOffset,
				top: obj.top + window.pageYOffset,
				width: Math.round(obj.width),
				height: Math.round(obj.height)
			}
		},
		css: function(property, value) {
			//  只有一个参数，获取第一个元素的样式
			if(arguments.length < 2) {
				var computedStyle, element = this[0];
				if(!element) return // 如果第一个元素无值，直接返回。否则继续

				// 获取元素的计算后的样式 参考https://developer.mozilla.org/zh-CN/docs/Web/API/Window/getComputedStyle
				computedStyle = getComputedStyle(element, '');

				if(typeof property == 'string') { // 情况1，参数为字符串形式
					/**
					 * 先从elem内联样式获取（element.style），此时需要 camelize(property) 转换，如将 background-color 变为 backgroundColor
					 * 如果未找到，则从css样式获取 computedStyle.getPropertyValue(property) 
					 * 
					 * （重要）注释：elem.style 只能获取元素设置的内联样式、不能获取css样式；而 getComputedStyle 可获取内联、css样式。
					 */
					return element.style[camelize(property)] || computedStyle.getPropertyValue(property);
				} else if(isArray(property)) { // 情况2，参数为数组形式（注意，此时 isObject 情况尚未判断）
					var props = {}
					//遍历读取属性值,并将结果包装成对象返回
					$.each(property, function(_, prop) {
						props[prop] = (element.style[camelize(prop)] || computedStyle.getPropertyValue(prop));
					});
					return props;
				}
			}

			// 其他情况：有两个参数
			var css = ''
			if(type(property) == 'string') { // 情况1，property 是字符串，设置单个样式
				if(!value && value !== 0) { // 如果value参数是 '' null undefined 则移除这个css样式
					// 注：此计算只适用于内联样式的删除，对 css 样式无效，因为它只通过 this.style.removeProperty 计算，而 this.style 获取不到css样式
					this.each(function() {
						this.style.removeProperty(dasherize(property));
					});
				} else { // value有正常值，将 css 生成一个字符串（如 'font-size:20px'）等待赋值给内联样式
					css = dasherize(property) + ":" + maybeAddPx(property, value);
				}
			} else { // 情况2，property 是对象（此时就不管第二个参数是什么了，不用第二个参数），一次性设置多个样式
				for(key in property) {
					if(!property[key] && property[key] !== 0) { // 如果对象属性值是 '' null undefined 则移除这个css样式，同理，只针对内联样式
						this.each(function() {
							this.style.removeProperty(dasherize(key));
						});
					} else { // 否则，给 css 赋值一个字符串，多样式属性用 ; 隔开
						css += dasherize(key) + ':' + maybeAddPx(key, property[key]) + ';'
					}
				}
			}

			// 针对每个元素，设置内联样式（this.style.cssText可获取、设置内联样式）
			return this.each(function() {
				this.style.cssText += ';' + css
			});
		},
		index: function(element) {
			// 获取一个元素的索引值（从0开始计数）。当elemen参数没有给出时，返回当前元素在兄弟节点中的位置
			return element ? this.indexOf($(element)[0]) : this.parent().children().indexOf(this[0])
		},
		hasClass: function(name) {
			if(!name) return false;
			return emptyArray.some.call(this, function(el) {
				// this 就是 classRE(name) 的返回值（返回一个正则）
				// function className(node, value){...} 获取或者设置elem的className
				return this.test(className(el));
			}, classRE(name));
		},
		addClass: function(name) {
			if(!name) return this;

			// 针对所有元素都添加className，最终返回本身
			return this.each(function(idx) {
				// 说明当前元素不是 DOM node
				if(!('className' in this)) return

				// classList 是一开始就定义的空变量
				classList = []
				// 获取元素的 clasname      // 支持传入函数
				var cls = className(this),
					newName = funcArg(this, name, idx, cls);

				// 把要赋值的值，按照空白分组，遍历
				newName.split(/\s+/g).forEach(function(klass) {
					// 把当前元素不存在的class，push到classlist中
					if(!$(this).hasClass(klass)) {
						classList.push(klass)
					}
				}, this);
				// 如果classlist有数据，则为当前元素赋值最新的class值（现有的classname和新的classname拼接）
				classList.length && className(this, cls + (cls ? " " : "") + classList.join(" "))
			});
		},
		removeClass: function(name) {
			// 针对所有元素都移除className，最终返回本身
			return this.each(function(idx) {
				// 说明当前元素不是 DOM node
				if(!('className' in this)) return

				// 如果参数空，则移除元素的所有class
				if(name === undefined) return className(this, '')

				// 获取现有的classname
				classList = className(this)
				// （可以传入函数）遍历新的classname字符串
				funcArg(this, name, idx, classList).split(/\s+/g).forEach(function(klass) {
					// 针对传入的classname字符串，对每个符合条件的classname，都替换为 ' '（即删除了）
					classList = classList.replace(classRE(klass), " ")
				});

				// 对整理好的classname，重新赋值给当前元素
				className(this, classList.trim());
			})
		},
		toggleClass: function(name, when) {
			// when 参数相当于一个条件：
			// 如果 when === true 则单纯执行 addClass
			// 如果 when === false 则单纯执行 removeClass

			if(!name) return this
			return this.each(function(idx) {
				//                   name 可接收函数，可以是空白分割开来的多个classname
				var $this = $(this),
					names = funcArg(this, name, idx, className(this));

				// 用空白分割开多个class
				names.split(/\s+/g).forEach(function(klass) {
					// 如果有 when 参数，则只通过when参数判断，true则只执行addClass，false则只执行removeClass
					// 如果没有 when 参数，则判断元素有没有该class，有则移除，没有则添加
					(when === undefined ? !$this.hasClass(klass) : when) ?
					$this.addClass(klass): $this.removeClass(klass)
				})
			});
		},
		scrollTop: function(value) {
			if(!this.length) return

			/**
			 * 普通elem有 scrollTop 属性，可以获取或者设置top值
			 * window对象没有 scrollTop 属性，通过 pageYOffset 获取，通过 scrollTo() 赋值
			 */
			var hasScrollTop = 'scrollTop' in this[0]
			// value 无值，获取 top
			if(value === undefined) {
				return hasScrollTop ? this[0].scrollTop : this[0].pageYOffset;
			}
			// value 有值，设置 top
			return this.each(hasScrollTop ?
				function() {
					this.scrollTop = value
				} :
				function() {
					// TODO window.scrollX 获取横向滚动值,应该是scrollY吧?
					this.scrollTo(this.scrollX, value)
				})
		},
		scrollLeft: function(value) {
			if(!this.length) return
			var hasScrollLeft = 'scrollLeft' in this[0]
			if(value === undefined) return hasScrollLeft ? this[0].scrollLeft : this[0].pageXOffset
			return this.each(hasScrollLeft ?
				function() {
					this.scrollLeft = value
				} :
				function() {
					// TODO window.scrollX 获取纵向滚动值
					this.scrollTo(value, this.scrollY)
				})
		},
		position: function() {
			if(!this.length) return

			var elem = this[0],
				//  找到第一个定位过的祖先元素 “relative”, “absolute” or “fixed”
				offsetParent = this.offsetParent(),
				// 获取自身的offset
				offset = this.offset(),
				// 获取定位祖先元素的offset（ body、html直接设置 top:0;left:0 ）
				parentOffset = rootNodeRE.test(offsetParent[0].nodeName) ? {
					top: 0,
					left: 0
				} : offsetParent.offset()

			// 去掉当前元素的 margin 宽度
			offset.top -= parseFloat($(elem).css('margin-top')) || 0;
			offset.left -= parseFloat($(elem).css('margin-left')) || 0;

			// 增加父元素的 border 宽度
			parentOffset.top += parseFloat($(offsetParent[0]).css('border-top-width')) || 0
			parentOffset.left += parseFloat($(offsetParent[0]).css('border-left-width')) || 0

			//减去偏移量
			return {
				top: offset.top - parentOffset.top,
				left: offset.left - parentOffset.left
			}
		},
		offsetParent: function() {
			return this.map(function() {
				// elem.offsetParent 可返回最近的改元素最近的已经定位的父元素
				var parent = this.offsetParent || document.body;
				// 如果获取的parent不是null、不是body或html、而且position==static
				while(parent && !rootNodeRE.test(parent.nodeName) && $(parent).css("position") == "static") {
					// 则继续向上查找 offsetParent、大不了找到 body 为止
					parent = parent.offsetParent;
					// 最后返回改元素
					return parent;
				}
			});
		}
	}

	// detach兼容旧api
	$.fn.detach = $.fn.remove;

	// 创建高度和宽度函数
	['width', 'height'].forEach(function(dimension) {
		// 将 width height 变为  Width Height
		var dimensionProperty = dimension.replace(/./, function(m) {
			return m[0].toUpperCase()
		});

		$.fn[dimension] = function(value) {
			var offset, el = this[0];

			if(value === undefined) { // 情况1，无参数，获取第一个元素的值
				//没有参数为获取，获取window的width和height用innerWidth,innerHeight
				return isWindow(el) ? el['inner' + dimensionProperty] :
					//获取document的width和height时，用scrollWidth,scrollHeight
					isDocument(el) ? el.documentElement['scroll' + dimensionProperty] :
					//其余均是offset的width和height
					(offset = this.offset()) && offset[dimension]
			} else { // 情况2，有参数，设置所有元素的值
				return this.each(function(idx) {
					el = $(this);
					// 通过 css() 方法设置，支持传入函数
					el.css(dimension, funcArg(this, value, idx, el[dimension]()));
				});
			}
		}
	})

	function traverseNode(node, fun) {
		// 针对当前元素、遍历子元素，都执行 fun 函数
		fun(node)
		for(var i = 0, len = node.childNodes.length; i < len; i++) {
			traverseNode(node.childNodes[i], fun);
		}
	}

	// 上文定义 adjacencyOperators = [ 'after', 'prepend', 'before', 'append' ],

	// Generate the `after`, `prepend`, `before`, `append`,
	// `insertAfter`, `insertBefore`, `appendTo`, and `prependTo` methods.

	//创建相邻操作组
	adjacencyOperators.forEach(function(operator, operatorIndex) {
		var inside = operatorIndex % 2 //=> prepend, append

		$.fn[operator] = function() {
			// arguments can be nodes, arrays of nodes, Zepto objects and HTML strings
			var argType, nodes = $.map(arguments, function(arg) {
					argType = type(arg);
					return argType == "object" || argType == "array" || arg == null ?
						arg : zepto.fragment(arg)
				}),
				parent, copyByClone = this.length > 1
			if(nodes.length < 1) return this

			return this.each(function(_, target) {
				parent = inside ? target : target.parentNode

				// convert all methods to a "before" operation
				target = operatorIndex == 0 ? target.nextSibling :
					operatorIndex == 1 ? target.firstChild :
					operatorIndex == 2 ? target :
					null

				var parentInDocument = $.contains(document.documentElement, parent)

				nodes.forEach(function(node) {
					if(copyByClone) node = node.cloneNode(true)
					else if(!parent) return $(node).remove()

					parent.insertBefore(node, target)
					if(parentInDocument) traverseNode(node, function(el) {
						if(el.nodeName != null && el.nodeName.toUpperCase() === 'SCRIPT' &&
							(!el.type || el.type === 'text/javascript') && !el.src)
							window['eval'].call(window, el.innerHTML)
					})
				})
			})
		}

		// after    => insertAfter
		// prepend  => prependTo
		// before   => insertBefore
		// append   => appendTo
		$.fn[inside ? operator + 'To' : 'insert' + (operatorIndex ? 'Before' : 'After')] = function(html) {
			$(html)[operator](this)
			return this
		}
	})

	//修改Z函数的原型对象
	zepto.Z.prototype = $.fn

	// Export internal API functions in the `$.zepto` namespace
	zepto.uniq = uniq
	zepto.deserializeValue = deserializeValue
	$.zepto = zepto

	return $
})();

window.Zepto = Zepto
window.$ === undefined && (window.$ = Zepto)