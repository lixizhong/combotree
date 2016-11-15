/**
 * Created by lixizhong on 2016/11/15.
 */
$.widget('ui.comboTree', {
    options: {
        maxHeight: 250,
        onlyLeafSelect: false, //只有末端节点可以选择
        expandLevel: 0,        //默认展开级别，从0开始
        onselect: function (event, data) {}
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

        this.ul = $('<ul>').appendTo(this.wapper).addClass('ct-list')
            .css({
                'maxHeight': this.options.maxHeight,
                'width': this.element.outerWidth() - 8
            });

        this._loadData();
    },

    _show: function () {
        this.wapper.show();
    },

    _hide: function () {
        this.wapper.hide();
    },

    _loadData: function () {
        var _self = this;
        $.ajax({
            url: this.options.url,
            method: 'post',
            dataType: 'json'
        }).done(function (list) {
            if( ! list || ! list instanceof Array) {
                alert('comboTree:数据格式不对');
                return;
            }

            _self._createTree(_self.ul, list, 0);
            _self._bindEvent();
        }).fail(function () {
            alert("comboTree:加载数据发生错误");
        });
    },

    _createTree: function (ul, list, level) {
        for(var i=0; i<list.length; i++) {
            var item = list[i];
            var li = $('<li>').appendTo(ul);
            var node = $('<div>').appendTo(li).addClass('ct-node');

            for(key in item) {
                if(key != "children" && key != "text" && item.hasOwnProperty(key)) {
                    node.attr("data-" + key, item[key]);
                }
            }

            $('<span>').appendTo(node).text(item.text).addClass('ct-node-text');

            if(item.children && item.children.length > 0) {
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

                this._createTree(childs, item.children, level + 1);
            }else{
                $('<span>').prependTo(node).addClass('ct-indent');
                node.addClass('ct-node ct-node-child');
            }

            for(var j=0; j<level; j++) {
                $('<span>').prependTo(node).addClass('ct-indent');
            }
        }
    },

    _bindEvent: function () {
        var _self = this;
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

        this.ul.on('click', '.ct-node', function() {
            if(_self.options.onlyLeafSelect && $(this).hasClass('ct-node-parent')) {
                $(this).find('.ct-hit').click();
                return;
            }

            _self.ul.find('.ct-node-selected').removeClass('ct-node-selected');
            $(this).addClass('ct-node-selected');

            var _value = $(this).attr('data-item-val');
            var _text = $(this).children('.ct-node-text').text();

            _self.element.val(_text);
            _self._trigger("onselect", null, $(this).data());
            _self._hide();
            return false;
        });

        this.element.on('click', function () {
            _self._show();
            return false;
        });

        $(document).on('click', function (event) {
            _self._hide();
        });
    }
});
