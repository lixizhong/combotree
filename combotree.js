/**
 * Created by lixizhong on 2016/11/15.
 */
$.widget('ui.comboTree', {
    options: {
        maxHeight: 250,
        data: { },
        initValue: undefined,   //初始选中节点的值，类型：object
        onlyLeafSelect: false, //只有末端节点可以选择
        expandLevel: 0,        //默认展开级别，从0开始
        textProperty: 'text',   //文字的默认属性名称
        childrenName: 'children', //子节点列表默认名称
        onselect: function (event, data) {},
        onreload: function () {},
        onclear: function () {}
    },
    _create: function() {
        var _self = this;
        this.element.prop('readonly', true).css({
            'cursor': 'pointer'
        });

        var position = this.element.position();
        //创建最外层div
        this.wapper = $('<div>').insertAfter(this.element).addClass('ct-container')
            .css({
                'display': 'none',
                'position': 'absolute',
                'left': position.left,
                'top': position.top + this.element.outerHeight()
            });
        //创建ul
        this.ul = $('<ul>').appendTo(this.wapper).addClass('ct-list')
            .css({
                'maxHeight': this.options.maxHeight,
                'width': this.element.outerWidth()
            });

        this._loadData();
        this._bindEvent();
    },
    //根据initValue设置tree初始选中状态
    _setInitValue: function () {
        var _self = this;
        if( ! this.options.initValue) {
            _self.element.val(_self.ul.find('.ct-cleardata').text());
            return;
        }

        var initValue = this.options.initValue;

        this.ul.find('.ct-node').each(function () {
            var result = true;

            var nodeValue = $(this).data();
            for(key in initValue) {
                if(nodeValue.hasOwnProperty(key)
                        && initValue.hasOwnProperty(key)
                        && nodeValue[key] == initValue[key]) {
                    continue;
                }else{
                    result = false;
                    break;
                }
            }

            if(result) {
                _self._selectNode($(this));
                return false;
            }
        });

        if( ! _self.element.val()) {
            _self.element.val(_self.ul.find('.ct-cleardata').text());
        }

        this.options.initValue = undefined;
    },
    //显示
    _show: function () {
        var position = this.element.position();
        //创建最外层div
        this.wapper.css({
            'left': position.left,
            'top': position.top + this.element.outerHeight()
        });

        this.wapper.show();
    },
    //隐藏
    _hide: function () {
        this.wapper.hide();
    },
    //重新加载数据
    reload: function () {
        this._loadData();
        this.element.val('');
        this._trigger("onreload", null, null);
    },
    //清除
    clear: function () {
        this.element.val('');
        this.ul.find('.ct-node-selected').removeClass('ct-node-selected');
        this._trigger("onclear", null, null);
    },
    //加载数据并生成树
    _loadData: function () {
        var _self = this;
        _self.ul.html('');
        $.ajax({
            url: _self.options.url,
            method: 'post',
            data: _self.options.data,
            dataType: 'json'
        }).done(function (list) {
            if( ! list || ! list instanceof Array) {
                alert('comboTree:数据格式不对');
                return;
            }
            if(list.length > 0) {
                _self.ul.append('<li class="ct-cleardata">----请选择----</li>');
                _self._createTree(_self.ul, list, 0);
                _self._setInitValue();
            }else{
                _self.ul.html('<li class="ct-nodata">没有数据</li>');
            }
        }).fail(function () {
            alert("comboTree:加载数据发生错误");
        });
    },
    //生成树（递归）
    _createTree: function (ul, list, level) {
        for(var i=0; i<list.length; i++) {
            var item = list[i];
            var li = $('<li>').appendTo(ul);
            var node = $('<div>').appendTo(li).addClass('ct-node');
            //设置数据
            for(key in item) {
                if(key != this.options.childrenName && key != this.options.textProperty && item.hasOwnProperty(key)) {
                    //node.attr("data-" + key, item[key]);
                    node.data(key, item[key]);
                }
            }

            $('<span>').appendTo(node).text(item[this.options.textProperty]).addClass('ct-node-text');

            var children = item[this.options.childrenName];
            //设置默认展开级别
            if(children && children.length > 0) {
                var span = $('<span>').prependTo(node).addClass('ct-hit');
                var childs = $('<ul>').appendTo(li);
                node.addClass('ct-node ct-node-parent');
                if(level <= this.options.expandLevel) {
                    node.addClass('ct-opened');
                    childs.addClass('ct-expanded');
                }else{
                    node.addClass('ct-closed');
                    childs.addClass('ct-collapsed');
                }

                this._createTree(childs, children, level + 1);
            }else{
                $('<span>').prependTo(node).addClass('ct-indent');
                node.addClass('ct-node ct-node-child');
            }
            //设置缩进
            for(var j=0; j<level; j++) {
                $('<span>').prependTo(node).addClass('ct-indent');
            }
        }
    },
    //设置节点为选中
    _selectNode: function (node) {
        //如果点击的是父节点并且设置了父节点不能选中，则展开父节点
        if(this.options.onlyLeafSelect && node.hasClass('ct-node-parent')) {
            node.find('.ct-hit').click();
            return;
        }

        this.ul.find('.ct-node-selected').removeClass('ct-node-selected');
        node.addClass('ct-node-selected');

        var _text = node.children('.ct-node-text').text();

        this.element.val(_text);
        this._trigger("onselect", null, node.data());
        this._hide();
    },

    _bindEvent: function () {
        var _self = this;
        //点击展开/关闭按钮的事件
        this.ul.on('click', '.ct-hit', function(event){
            var node = $(this).parent();
            var childs = $(this).parent().siblings("ul");
            if(childs.hasClass('ct-collapsed')) {
                childs.addClass('ct-expanded').removeClass('ct-collapsed');
                node.addClass('ct-opened').removeClass('ct-closed');
            }else{
                childs.addClass('ct-collapsed').removeClass('ct-expanded');
                node.addClass('ct-closed').removeClass('ct-opened');
            }
            return false;
        });
        //点击节点的事件
        this.ul.on('click', '.ct-node', function() {
            _self._selectNode($(this));
            return false;
        });

        this.element.on('click', function () {
            _self._show();
            return false;
        });

        this.ul.on('click', '.ct-cleardata', function () {
            _self.clear();
            _self._hide();
            _self.element.val($(this).text());
            return false;
        });

        $(document).on('click', function (event) {
            _self._hide();
        });
    }
});
