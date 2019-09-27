layui.use('layer');
$(document).ready(function() {
    function load_text(url) {
        $.get(url, function(d) {
            editor.setValue(d);
        }).error(function() {
            editor.setValue("// 加载出现错误");
        });
    }
    var app = new Vue({
        el: '#app',
        data: {
            toutput: ""
        },
        methods: {
            compile: function() {
                layx.load('load', '正在编译中……');
                var _this = this;
                $.ajax('/api/visualize', {
                    method: 'POST',
                    contentType: 'application/json;charset=utf-8',
                    data: JSON.stringify({
                        text: editor.getValue()
                    }),
                    success: function(d) {
                        layx.destroy('load');
                        var data = JSON.parse(d);
                        if (data.code == 200) {
                            var obj = JSON.parse(data.text);
                            if (obj.code == 200) {
                                _this.toutput = data.text;
                                _this.show_alg(obj.data);
                            } else {
                                _this.toutput = "发生错误：\n" + obj.error;
                            }
                        } else
                            _this.toutput = data.text;
                    }
                }).error(function(e) {
                    layx.destroy('load');
                    _this.toutput = e.responseText;
                });
            },
            test: function(t) {
                load_text("example/" + t + ".cpp");
            },
            reload: function() {
                layx.load('reload', '重置缓存……');
                var _this = this;
                $.ajax('/api/reload', {
                    method: 'POST',
                    contentType: 'application/json;charset=utf-8',
                    data: JSON.stringify({
                        test: 123
                    }),
                    success: function(d) {
                        layx.destroy('reload');
                        layer.msg("重置缓存成功");
                    }
                }).error(function(e) {
                    layx.destroy('reload');
                    layer.msg("重置缓存失败");
                });
            },
            show_alg: function(obj) {
                var len = obj.length;
                var pro = '<p>当前步骤：{{current+"/"+total}}</p><br>';
                pro += '<div class="layui-progress layui-progress-big" lay-filter="step-pro" lay-showpercent="true"><div class="layui-progress-bar" lay-percent="0%"></div></div>';
                pro += '<br><p>当前操作：</p><br><p>{{curop}}</p>';
                var cnt = '<div style="margin: 15px;" id="step">' + pro + '</div>';
                var LTOP = layer.open({
                    type: 1,
                    offset: ['50px', '50px'],
                    id: 'step',
                    title: '算法步骤',
                    content: cnt,
                    shadeClose: false,
                    closeBtn: false,
                    fixed: true,
                    resize: false,
                    btn: ['继续', '自动', '重置', '结束'],
                    btnAlign: 'c',
                    scrollbar: false,
                    success: function() {
                        var app = new Vue({
                            el: '#step',
                            data: {
                                total: len,
                                current: 0,
                                step: obj,
                                curop: "无",
                                rapid: false,
                                autos: false
                            },
                            methods: {
                                is_rapid: function() {
                                    if (this.current > 0) {
                                        var cur = this.current;
                                        if (cur < this.total) {
                                            var ins = this.step[cur];
                                            return ins.rapid ? true : false;
                                        }
                                    }
                                    return false;
                                },
                                read_next_ins: function() {
                                    if (this.current > 0) {
                                        var cur = this.current - 1;
                                        var ins = this.step[cur];
                                        if (ins.method == "msg") {
                                            if (!$("#console").length) {
                                                var ctx = '<div id="console-app" class="layui-form" style="padding:5px;">' +
                                                    '  <table class="layui-table">' +
                                                    '    <colgroup>' +
                                                    '      <col width="50">' +
                                                    '      <col width="250">' +
                                                    '    </colgroup>' +
                                                    '    <thead>' +
                                                    '      <tr>' +
                                                    '        <th>ID</th>' +
                                                    '        <th>信息</th>' +
                                                    '      </tr> ' +
                                                    '    </thead>' +
                                                    '    <tbody>' +
                                                    '      <tr v-for="item in items">' +
                                                    '        <td>{{item.id}}</td>' +
                                                    '        <td>{{item.text}}</td>' +
                                                    '      </tr>' +
                                                    '    </tbody>' +
                                                    '  </table>' +
                                                    '</div>';
                                                var L = layer.open({
                                                    type: 1,
                                                    offset: ['50px', '400px'],
                                                    id: 'console',
                                                    title: '输出',
                                                    content: ctx,
                                                    shade: false,
                                                    shadeClose: false,
                                                    closeBtn: false,
                                                    fixed: true,
                                                    resize: false,
                                                    scrollbar: false,
                                                    success: function() {
                                                        $("#console-app").parent().css('overflow', 'hidden');
                                                        var app = new Vue({
                                                            el: '#console-app',
                                                            data: {
                                                                items: []
                                                            },
                                                            methods: {}
                                                        });
                                                        var console_id = 1;
                                                        eventBus.on("send-text", function(sender, data, obj) {
                                                            if (app.items.length >= 5) {
                                                                app.items = app.items.slice(1);
                                                            }
                                                            app.items.push({
                                                                id: console_id,
                                                                text: data
                                                            });
                                                            console_id++;
                                                        });
                                                        eventBus.emit("send-text", window, ins.value);
                                                    },
                                                    end: function() {
                                                        eventBus.off("send-text");
                                                    }
                                                });
                                                eventBus.on("close", function(sender, data, obj) {
                                                    layer.close(L);
                                                });
                                            } else {
                                                eventBus.emit("send-text", window, ins.value);
                                            }
                                        } else if (ins.method == "create") {
                                            var oname = ins.name;
                                            var name = 'trace__' + ins.name;
                                            if (!$("#" + name).length) {
                                                if (!ins.loc) {
                                                    var ctx = '<div id="' + name + '-app" style="padding:5px;text-align:center">' +
                                                        '<button type="button" class="layui-btn layui-btn-primary">{{value}}</button>' +
                                                        '</div>';
                                                    var L = layer.open({
                                                        type: 1,
                                                        offset: ['400px', '50px'],
                                                        id: name,
                                                        title: '变量跟踪：' + oname,
                                                        content: ctx,
                                                        shade: false,
                                                        shadeClose: false,
                                                        closeBtn: false,
                                                        fixed: true,
                                                        resize: false,
                                                        scrollbar: false,
                                                        success: function() {
                                                            $("#" + name + "-app").parent().css('overflow', 'hidden');
                                                            var app = new Vue({
                                                                el: "#" + name + "-app",
                                                                data: {
                                                                    value: "",
                                                                    focus: false
                                                                },
                                                                methods: {}
                                                            });
                                                            eventBus.on("modify-" + oname, function(sender, data, obj) {
                                                                $("#" + name + "-app > button").css("background-color", "#1E9FFF");
                                                                app.value = data.value;
                                                                app.focus = true;
                                                            });
                                                            eventBus.on("close-" + oname, function(sender, data, obj) {
                                                                layer.close(L);
                                                            });
                                                            this.lost_focus = function(sender, data, obj) {
                                                                if (app.focus) {
                                                                    $("#" + name + "-app > button").css("background-color", "");
                                                                    app.focus = false;
                                                                }
                                                            };
                                                            eventBus.on("lost_focus", this.lost_focus);
                                                        },
                                                        end: function() {
                                                            eventBus.off("modify-" + oname);
                                                            eventBus.off("close-" + oname);
                                                            eventBus.off("lost_focus", this.lost_focus);
                                                        }
                                                    });
                                                    eventBus.on("close", function(sender, data, obj) {
                                                        layer.close(L);
                                                    });
                                                } else if (ins.loc.length == 1) {
                                                    if (ins.chart) {
                                                        var labels = [];
                                                        var datas = [];
                                                        var backgroundColors = [];
                                                        var borderColors = [];
                                                        var chartColors = {
                                                            red: 'rgb(255, 99, 132)',
                                                            orange: 'rgb(255, 159, 64)',
                                                            yellow: 'rgb(255, 205, 86)',
                                                            green: 'rgb(75, 192, 192)',
                                                            blue: 'rgb(54, 162, 235)',
                                                            purple: 'rgb(153, 102, 255)',
                                                            grey: 'rgb(201, 203, 207)'
                                                        };
                                                        var color = Chart.helpers.color;
                                                        for (var jj = 0; jj < ins.loc[0]; jj++) {
                                                            labels.push(jj);
                                                            datas.push(0);
                                                            backgroundColors.push(color(chartColors.grey).alpha(0.5).rgbString());
                                                            borderColors.push(chartColors.grey);
                                                        }
                                                        var ctx = '<div id="' + name + '-app" class="layui-form" style="padding:5px;">' +
                                                            '	<canvas id="' + name + '-app-chart"></canvas>' +
                                                            '</div>';
                                                        var L = layer.open({
                                                            type: 1,
                                                            offset: ['400px', '50px'],
                                                            id: name,
                                                            title: '【图表】一维数组跟踪：' + oname,
                                                            content: ctx,
                                                            shade: false,
                                                            shadeClose: false,
                                                            closeBtn: false,
                                                            fixed: true,
                                                            resize: false,
                                                            scrollbar: false,
                                                            success: function() {
                                                                $("#" + name + "-app").parent().css('overflow', 'hidden');
                                                                var chart_data = {
                                                                    labels: labels,
                                                                    datasets: [{
                                                                        label: oname,
                                                                        backgroundColor: backgroundColors,
                                                                        borderColor: borderColors,
                                                                        borderWidth: 1,
                                                                        data: datas
                                                                    }]
                                                                };
                                                                var app = new Vue({
                                                                    el: "#" + name + "-app",
                                                                    data: {
                                                                        focuses: [],
                                                                        chart_data: chart_data,
                                                                        chart: null
                                                                    },
                                                                    methods: {}
                                                                });
                                                                app.chart = new Chart(document.getElementById(name + '-app-chart').getContext('2d'), {
                                                                    type: 'bar',
                                                                    data: app.chart_data,
                                                                    options: {
                                                                        responsive: true,
                                                                        legend: {
                                                                            display: false
                                                                        },
                                                                        title: {
                                                                            display: false
                                                                        }
                                                                    }
                                                                });
                                                                eventBus.on("modify-" + oname, function(sender, data, obj) {
                                                                    app.focuses.push(data.loc);
                                                                    app.chart_data.datasets[0].data[data.loc[0]] = data.value;
                                                                    app.chart_data.datasets[0].backgroundColor[data.loc[0]] = color(chartColors.blue).alpha(0.5).rgbString();
                                                                    app.chart_data.datasets[0].borderColor[data.loc[0]] = chartColors.blue;
                                                                    if (!data.rapid)
                                                                        app.chart.update();
                                                                });
                                                                eventBus.on("close-" + oname, function(sender, data, obj) {
                                                                    layer.close(L);
                                                                });
                                                                this.lost_focus = function(sender, data, obj) {
                                                                    if (app.focuses.length) {
                                                                        for (var f in app.focuses) {
                                                                            app.chart_data.datasets[0].backgroundColor[app.focuses[f][0]] = color(chartColors.grey).alpha(0.5).rgbString();
                                                                            app.chart_data.datasets[0].borderColor[app.focuses[f][0]] = chartColors.grey;
                                                                        }
                                                                        app.chart.update();
                                                                        app.focuses = [];
                                                                    }
                                                                };
                                                                eventBus.on("lost_focus", this.lost_focus);
                                                            },
                                                            end: function() {
                                                                eventBus.off("modify-" + oname);
                                                                eventBus.off("close-" + oname);
                                                                eventBus.off("lost_focus", this.lost_focus);
                                                            }
                                                        });
                                                        eventBus.on("close", function(sender, data, obj) {
                                                            layer.close(L);
                                                        });
                                                    } else {
                                                        var headers = [];
                                                        for (var jj = 0; jj < ins.loc[0]; jj++) {
                                                            headers.push({
                                                                key: jj,
                                                                value: "-"
                                                            });
                                                        }
                                                        var ctx = '<div id="' + name + '-app" class="layui-form" style="padding:5px;">' +
                                                            '  <table class="layui-table">' +
                                                            '    <colgroup>' +
                                                            '      <col v-for="header in headers">' +
                                                            '    </colgroup>' +
                                                            '    <thead>' +
                                                            '      <tr>' +
                                                            '        <th v-for="header in headers" style="text-align:center;background-color:#fff;">{{header.key}}</th>' +
                                                            '      </tr>' +
                                                            '    </thead>' +
                                                            '    <tbody>' +
                                                            '      <tr>' +
                                                            '        <td v-for="header in headers" style="text-align:center;background-color:#f2f2f2;font-weight:bold">{{header.value}}</td>' +
                                                            '      </tr>' +
                                                            '    </tbody>' +
                                                            '  </table>' +
                                                            '</div>';
                                                        var L = layer.open({
                                                            type: 1,
                                                            offset: ['400px', '50px'],
                                                            id: name,
                                                            title: '一维数组跟踪：' + oname,
                                                            content: ctx,
                                                            shade: false,
                                                            shadeClose: false,
                                                            closeBtn: false,
                                                            fixed: true,
                                                            resize: false,
                                                            scrollbar: false,
                                                            success: function() {
                                                                $("#" + name + "-app").parent().css('overflow', 'hidden');
                                                                var app = new Vue({
                                                                    el: "#" + name + "-app",
                                                                    data: {
                                                                        headers: headers,
                                                                        focuses: []
                                                                    },
                                                                    methods: {}
                                                                });
                                                                eventBus.on("modify-" + oname, function(sender, data, obj) {
                                                                    app.focuses.push(data.loc);
                                                                    $("#" + name + "-app > table > tbody > tr > td:nth(" + (data.loc[0]) + ")").css("background-color", "#1E9FFF");
                                                                    app.$set(app.headers, data.loc[0], {
                                                                        key: data.loc[0],
                                                                        value: data.value
                                                                    });
                                                                });
                                                                eventBus.on("close-" + oname, function(sender, data, obj) {
                                                                    layer.close(L);
                                                                });
                                                                this.lost_focus = function(sender, data, obj) {
                                                                    if (app.focuses.length) {
                                                                        for (var f in app.focuses)
                                                                            $("#" + name + "-app > table > tbody > tr > td:nth(" + (app.focuses[f][0]) + ")").css("background-color", "#f2f2f2");
                                                                        app.focuses = [];
                                                                    }
                                                                };
                                                                eventBus.on("lost_focus", this.lost_focus);
                                                            },
                                                            end: function() {
                                                                eventBus.off("modify-" + oname);
                                                                eventBus.off("close-" + oname);
                                                                eventBus.off("lost_focus", this.lost_focus);
                                                            }
                                                        });
                                                        eventBus.on("close", function(sender, data, obj) {
                                                            layer.close(L);
                                                        });
                                                    }
                                                } else if (ins.loc.length == 2) {
                                                    var headers = [];
                                                    for (var jj = 0; jj < ins.loc[1]; jj++) {
                                                        headers.push(jj);
                                                    }
                                                    var datas = [];
                                                    for (var jj = 0; jj < ins.loc[0]; jj++) {
                                                        var arr = [];
                                                        for (var kk = 0; kk < ins.loc[1]; kk++) {
                                                            arr.push("-");
                                                        }
                                                        datas.push(arr);
                                                    }
                                                    var ctx = '<div id="' + name + '-app" class="layui-form" style="padding:5px;">' +
                                                        '  <table class="layui-table">' +
                                                        '    <colgroup>' +
                                                        '      <col v-for="header in headers">' +
                                                        '    </colgroup>' +
                                                        '    <thead>' +
                                                        '      <tr>' +
                                                        '        <th v-for="header in headers" style="text-align:center;background-color:#fff;">{{header}}</th>' +
                                                        '      </tr>' +
                                                        '    </thead>' +
                                                        '    <tbody>' +
                                                        '      <tr v-for="rows in datas">' +
                                                        '        <td v-for="row in rows" style="text-align:center;background-color:#f2f2f2;font-weight:bold">{{row}}</td>' +
                                                        '      </tr>' +
                                                        '    </tbody>' +
                                                        '  </table>' +
                                                        '</div>';
                                                    var L = layer.open({
                                                        type: 1,
                                                        offset: ['400px', '50px'],
                                                        id: name,
                                                        title: '二维数组跟踪：' + oname,
                                                        content: ctx,
                                                        shade: false,
                                                        shadeClose: false,
                                                        closeBtn: false,
                                                        fixed: true,
                                                        resize: false,
                                                        scrollbar: false,
                                                        success: function() {
                                                            $("#" + name + "-app").parent().css('overflow', 'hidden');
                                                            var app = new Vue({
                                                                el: "#" + name + "-app",
                                                                data: {
                                                                    headers: headers,
                                                                    datas: datas,
                                                                    focuses: []
                                                                },
                                                                methods: {}
                                                            });
                                                            eventBus.on("modify-" + oname, function(sender, data, obj) {
                                                                app.focuses.push(data.loc);
                                                                $("#" + name + "-app > table > tbody > tr:nth(" + (data.loc[0]) + ") > td:nth(" + (data.loc[1]) + ")").css("background-color", "#1E9FFF");
                                                                app.$set(app.datas[data.loc[0]], data.loc[1], data.value);
                                                            });
                                                            eventBus.on("close-" + oname, function(sender, data, obj) {
                                                                layer.close(L);
                                                            });
                                                            this.lost_focus = function(sender, data, obj) {
                                                                if (app.focuses.length) {
                                                                    for (var f in app.focuses)
                                                                        $("#" + name + "-app > table > tbody > tr:nth(" + (app.focuses[f][0]) + ") > td:nth(" + (app.focuses[f][1]) + ")").css("background-color", "#f2f2f2");
                                                                    app.focuses = [];
                                                                }
                                                            };
                                                            eventBus.on("lost_focus", this.lost_focus);
                                                        },
                                                        end: function() {
                                                            eventBus.off("modify-" + oname);
                                                            eventBus.off("close-" + oname);
                                                            eventBus.off("lost_focus", this.lost_focus);
                                                        }
                                                    });
                                                    eventBus.on("close", function(sender, data, obj) {
                                                        layer.close(L);
                                                    });
                                                } else {
                                                    layer.msg("错误：不支持二维以上数组");
                                                }
                                            } else {
                                                layer.msg("错误：重复创建");
                                            }
                                        } else if (ins.method == "update") {
                                            if (!ins.loc) {
                                                eventBus.emit("modify-" + ins.name, window, {
                                                    value: ins.value,
                                                    rapid: this.is_rapid()
                                                });
                                            } else if (ins.loc.length == 1) {
                                                eventBus.emit("modify-" + ins.name, window, {
                                                    value: ins.value,
                                                    loc: ins.loc,
                                                    rapid: this.is_rapid()
                                                });
                                            } else if (ins.loc.length == 2) {
                                                eventBus.emit("modify-" + ins.name, window, {
                                                    value: ins.value,
                                                    loc: ins.loc,
                                                    rapid: this.is_rapid()
                                                });
                                            } else {
                                                layer.msg("错误：不支持二维以上数组");
                                            }
                                        } else if (ins.method == "destroy") {
                                            // eventBus.emit("close-" + ins.name, window, {});
                                        } else {}
                                    }
                                    if (this.current < this.total) {
                                        var ins = this.step[this.current];
                                        var tt = "未知类型";
                                        if (ins.type) {
                                            if (ins.type == "int") tt = "整型";
                                            else if (ins.type == "char") tt = "字符型";
                                        }
                                        if (ins.method == "msg") {
                                            this.curop = "输出：" + ins.value;
                                        } else if (ins.method == "create") {
                                            if (ins.loc && ins.loc.length) {
                                                this.curop = "创建" + tt + "数组：" + ins.name +
                                                    (ins.loc.map(a => "[" + a + "]").join(""));
                                            } else {
                                                this.curop = "创建" + tt + "变量：" + ins.name;
                                            }
                                        } else if (ins.method == "update") {
                                            if (ins.loc && ins.loc.length) {
                                                this.curop = "更新" + tt + "数组：" + ins.name +
                                                    (ins.loc.map(a => "[" + a + "]").join("")) + "，更改为：" + ins.value;
                                            } else {
                                                this.curop = "更新" + tt + "变量：" + ins.name + "，更改为：" + ins.value;
                                            }
                                        } else if (ins.method == "destroy") {
                                            this.curop = "销毁：" + ins.name;
                                        } else {
                                            this.curop = "未知指令";
                                        }
                                    } else {
                                        this.curop = "模拟结束";
                                    }
                                }
                            }
                        });
                        this.app = app;
                        layui.use('element', function() {
                            var element = layui.element;
                            element.progress('step-pro', '0%');
                            eventBus.on("progress", function(sender, data, obj) {
                                app.current = data.i;
                                app.read_next_ins();
                                element.progress('step-pro', Math.floor(100 * data.i / len) + '%');
                                if (app.is_rapid()) {
                                    var ne = app.current + 1;
                                    setTimeout(function() {
                                        eventBus.emit("progress", window, {
                                            i: ne
                                        });
                                    }, 0);
                                }
                            });
                        });
                        app.read_next_ins();
                        eventBus.on("close_all", function(sender, data, obj) {
                            layer.close(LTOP);
                        });
                    },
                    yes: function() {
                        if (this.app.rapid)
                            return;
                        if (this.app.current < this.app.total) {
                            eventBus.emit("lost_focus", window, {});
                            eventBus.emit("progress", window, {
                                i: this.app.current + 1
                            });
                        }
                    },
                    btn2: function() {
                        if (this.app.autos)
                            return false;
                        this.app.autos = true;
                        var id = setInterval(this.yes.bind(this), 300);
                        eventBus.on("close", function(sender, data, obj) {
                            clearInterval(id);
                        });
                        return false;
                    },
                    btn3: function() {
                        this.app.autos = false;
                        eventBus.emit("close", window, {});
                        eventBus.emit("progress", window, {
                            i: 0
                        });
                        return false;
                    },
                    btn4: function() {},
                    end: function() {
                        eventBus.emit("close", window, {});
                        eventBus.emit("close_all", window, {});
                        eventBus.offAll();
                        return false;
                    }
                });
            }
        }
    });
    var editor = ace.edit("editor");
    ace.require("ace/ext/language_tools");
    editor.setTheme("ace/theme/chrome");
    editor.session.setMode("ace/mode/c_cpp");
    editor.setShowPrintMargin(true);
    editor.setFontSize(18);
    editor.setOptions({
        enableBasicAutocompletion: true,
        enableSnippets: true,
        enableLiveAutocompletion: true
    });
    load_text("example/test_var.cpp");
});