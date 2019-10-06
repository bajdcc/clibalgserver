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
                                            var get_show_color = function(idx) {
                                                const sel_colors = [
                                                    chartColors.blue,
                                                    chartColors.red,
                                                    chartColors.green,
                                                    chartColors.purple,
                                                    chartColors.yellow,
                                                    chartColors.orange,
                                                ];
                                                return sel_colors[idx % sel_colors.length];
                                            };
                                            var trans = '-webkit-transition:background-color .5s ease-in;' +
                                                '-moz-transition:background-color .5s ease-in;' +
                                                'transition:background-color .5s ease-in;';
                                            if (!$("#" + name).length) {
                                                if (!ins.loc) {
                                                    var ctx = '<div id="' + name + '-app" style="padding:5px;text-align:center">' +
                                                        '<button type="button" class="layui-btn layui-btn-primary" style="' + trans + '">{{value}}</button>' +
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
                                                                $("#" + name + "-app > button").css("background-color", chartColors.blue);
                                                                app.value = data.value;
                                                                app.focus = true;
                                                            });
                                                            eventBus.on("close-" + oname, function(sender, data, obj) {
                                                                layer.close(L);
                                                            });
                                                            this.lost_focus = function(sender, data, obj) {
                                                                if (app.focus) {
                                                                    $("#" + name + "-app > button").css("background-color", color(chartColors.grey).alpha(0.6).rgbString());
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
                                                    if (ins.chart == 1) {
                                                        var labels = [];
                                                        var datas = [];
                                                        var backgroundColors = [];
                                                        var borderColors = [];
                                                        for (var jj = 0; jj < ins.loc[0]; jj++) {
                                                            labels.push(jj);
                                                            datas.push(0);
                                                            backgroundColors.push(color(chartColors.grey).alpha(0.6).rgbString());
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
                                                                        data: datas,
                                                                        datalabels: {
                                                                            anchor: 'end',
                                                                            align: 'start',
                                                                        }
                                                                    }]
                                                                };
                                                                var app = new Vue({
                                                                    el: "#" + name + "-app",
                                                                    data: {
                                                                        focuses: [],
                                                                        chart_data: chart_data,
                                                                        chart: null,
                                                                        max_number: null,
                                                                        min_number: null,
                                                                    },
                                                                    methods: {}
                                                                });
                                                                var check_over = function(kk) {
                                                                    if (kk == 0) return false;
                                                                    if (app.max_number == null) { app.max_number = kk; return true; }
                                                                    if (app.min_number == null) { app.min_number = kk; return true; }
                                                                    app.max_number = Math.max(app.max_number, kk);
                                                                    app.min_number = Math.min(app.min_number, kk);
                                                                    return (kk - app.min_number) * 6 > (app.max_number - app.min_number);
                                                                };
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
                                                                        },
                                                                        showTooltips: false,
                                                                        plugins: {
                                                                            datalabels: {
                                                                                color: '#666',
                                                                                display: function(context) {
                                                                                    return check_over(context.dataset.data[context.dataIndex]);
                                                                                },
                                                                                font: {
                                                                                    weight: 'bold'
                                                                                },
                                                                                formatter: Math.round
                                                                            }
                                                                        },
                                                                    }
                                                                });
                                                                eventBus.on("modify-" + oname, function(sender, data, obj) {
                                                                    app.chart_data.datasets[0].data[data.loc[0]] = data.value;
                                                                    var clr = get_show_color(app.focuses.length);
                                                                    app.focuses.push(data.loc);
                                                                    app.chart_data.datasets[0].backgroundColor[data.loc[0]] = color(clr).alpha(0.5).rgbString();
                                                                    app.chart_data.datasets[0].borderColor[data.loc[0]] = clr;
                                                                    //if (!data.rapid)
                                                                    app.chart.update();
                                                                });
                                                                eventBus.on("close-" + oname, function(sender, data, obj) {
                                                                    layer.close(L);
                                                                });
                                                                this.lost_focus = function(sender, data, obj) {
                                                                    if (app.focuses.length) {
                                                                        for (var f in app.focuses) {
                                                                            app.chart_data.datasets[0].backgroundColor[app.focuses[f][0]] = color(chartColors.grey).alpha(0.6).rgbString();
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
                                                            '        <td v-for="header in headers" style="min-width:20px;text-align:center;background-color:' + color(chartColors.grey).alpha(0.6).rgbString() + ';font-weight:bold;' + trans + '">{{header.value}}</td>' +
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
                                                                    $("#" + name + "-app > table > tbody > tr > td:nth(" + (data.loc[0]) + ")").css("background-color", get_show_color(app.focuses.length));
                                                                    app.focuses.push(data.loc);
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
                                                                            $("#" + name + "-app > table > tbody > tr > td:nth(" + (app.focuses[f][0]) + ")").css("background-color", color(chartColors.grey).alpha(0.6).rgbString());
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
                                                    if (ins.chart == 2) {
                                                        var ctx = '<div id="' + name + '-app" style="padding:5px;text-align:center;">' +
                                                            '<div id="' + name + '-app-diagram" style="width: 600px; height: 400px">' +
                                                            '</div></div>';
                                                        var L = layer.open({
                                                            type: 1,
                                                            offset: ['400px', '50px'],
                                                            area: ['610px', '450px'],
                                                            id: name,
                                                            title: '图跟踪：' + oname,
                                                            content: ctx,
                                                            shade: false,
                                                            shadeClose: false,
                                                            closeBtn: false,
                                                            fixed: true,
                                                            resize: false,
                                                            scrollbar: false,
                                                            success: function() {
                                                                $("#" + name + "-app").parent().css('overflow', 'hidden');
                                                                $("#" + name + "-app").parent().css('height', '400px');
                                                                var app = new Vue({
                                                                    el: "#" + name + "-app",
                                                                    data: {
                                                                        value: "",
                                                                        focuses: [],
                                                                        inf: ins.loc[1]
                                                                    },
                                                                    methods: {}
                                                                });
                                                                eventBus.on("modify-" + oname, function(sender, data, obj) {
                                                                    if (data.value >= app.inf) return;
                                                                    var v = "" + data.value;
                                                                    var dir = false;
                                                                    app.focuses.push(data.loc);
                                                                    var aa = myDiagram.findLinksByExample({ "from": data.loc[0], "to": data.loc[1] });
                                                                    if (aa.count > 0) {
                                                                        myDiagram.findNodeForKey(data.loc[0]).isHighlighted = true;
                                                                        myDiagram.findNodeForKey(data.loc[1]).isHighlighted = true;
                                                                        if (aa.first().data.text == v) {
                                                                            myDiagram.findNodeForKey(data.loc[0]).findLinksOutOf()
                                                                                .filter(function(l) { return l.data.to == data.loc[1] }).each(function(l) { l.isHighlighted = true; });
                                                                            return;
                                                                        } else {
                                                                            myDiagram.findNodeForKey(data.loc[0]).findLinksOutOf()
                                                                                .filter(function(l) { return l.data.to == data.loc[1] }).each(function(l) {
                                                                                    l.isHighlighted = true;
                                                                                    l.data.dir = true;
                                                                                    l.data.text = v;
                                                                                });
                                                                            dir = true;
                                                                        }
                                                                    }
                                                                    var bb = myDiagram.findLinksByExample({ "from": data.loc[1], "to": data.loc[0] });
                                                                    if (bb.count > 0) {
                                                                        myDiagram.findNodeForKey(data.loc[0]).isHighlighted = true;
                                                                        myDiagram.findNodeForKey(data.loc[1]).isHighlighted = true;
                                                                        if (bb.first().data.text == v) {
                                                                            myDiagram.findNodeForKey(data.loc[1]).findLinksOutOf()
                                                                                .filter(function(l) { return l.data.to == data.loc[0] }).each(function(l) { l.isHighlighted = true; });
                                                                            return;
                                                                        } else {
                                                                            myDiagram.findNodeForKey(data.loc[1]).findLinksOutOf()
                                                                                .filter(function(l) { return l.data.to == data.loc[0] }).each(function(l) {
                                                                                    l.isHighlighted = true;
                                                                                    l.data.dir = true;
                                                                                    l.data.text = v;
                                                                                });
                                                                            dir = true;
                                                                        }
                                                                    }
                                                                    myDiagram.startTransaction("modify");
                                                                    myDiagram.model.addLinkData({ "from": data.loc[0], "to": data.loc[1], "text": v, "color": go.Brush.randomColor(0, 127), "dir": dir });
                                                                    myDiagram.commitTransaction("modify");
                                                                });
                                                                eventBus.on("close-" + oname, function(sender, data, obj) {
                                                                    layer.close(L);
                                                                });
                                                                this.lost_focus = function(sender, data, obj) {
                                                                    if (app.focuses.length) {
                                                                        //for (var f in app.focuses)
                                                                        myDiagram.startTransaction("clear highlight");
                                                                        myDiagram.clearHighlighteds();
                                                                        myDiagram.commitTransaction("clear highlight");
                                                                        app.focuses = [];
                                                                    }
                                                                };
                                                                eventBus.on("lost_focus", this.lost_focus);

                                                                var $$ = go.GraphObject.make; // for conciseness in defining templates

                                                                myDiagram =
                                                                    $$(go.Diagram, name + '-app-diagram', // must be the ID or reference to div
                                                                        {
                                                                            initialAutoScale: go.Diagram.UniformToFill,
                                                                            padding: 5,
                                                                            contentAlignment: go.Spot.Center,
                                                                            layout: $$(go.ForceDirectedLayout, { defaultSpringLength: 5 }),
                                                                            maxSelectionCount: 1,
                                                                        });

                                                                // define the Node template
                                                                myDiagram.nodeTemplate =
                                                                    $$(go.Node, "Horizontal", {
                                                                            locationSpot: go.Spot.Center, // Node.location is the center of the Shape
                                                                            locationObjectName: "SHAPE"
                                                                        },
                                                                        $$(go.Panel, "Auto",
                                                                            $$(go.Shape, "Ellipse", {
                                                                                    name: "SHAPE",
                                                                                    fill: "lightgray", // default value, but also data-bound
                                                                                    stroke: "transparent", // modified by highlighting
                                                                                    strokeWidth: 2,
                                                                                    desiredSize: new go.Size(30, 30),
                                                                                    portId: ""
                                                                                }, // so links will go to the shape, not the whole node
                                                                                new go.Binding("fill", "isHighlighted", function(s, obj) { return s ? "red" : obj.part.data.color; }).ofObject())),
                                                                        $$(go.TextBlock, {
                                                                                textAlign: "center",
                                                                                font: "24pt helvetica, arial, sans-serif",
                                                                                stroke: "#555555",
                                                                                margin: 4
                                                                            },
                                                                            new go.Binding("text")));

                                                                // define the Link template
                                                                myDiagram.linkTemplate =
                                                                    $$(go.Link, {
                                                                            selectable: true, // links cannot be selected by the user
                                                                            curve: go.Link.Bezier,
                                                                            layerName: "Background" // don't cross in front of any nodes
                                                                        },
                                                                        $$(go.Shape, // this shape only shows when it isHighlighted
                                                                            { isPanelMain: true, stroke: null, strokeWidth: 5 },
                                                                            new go.Binding("stroke", "isHighlighted", function(h) { return h ? "red" : null; }).ofObject()),
                                                                        $$(go.Shape,
                                                                            // mark each Shape to get the link geometry with isPanelMain: true
                                                                            { isPanelMain: true, stroke: "black", strokeWidth: 1 },
                                                                            new go.Binding("stroke", "color")),
                                                                        $$(go.Shape, { toArrow: "Standard", fill: null, stroke: null },
                                                                            new go.Binding("stroke", "dir", function(s, obj) { return s ? obj.part.data.color : null; }).ofObject(),
                                                                            new go.Binding("fill", "dir", function(s, obj) { return s ? obj.part.data.color : null; }).ofObject()),
                                                                        $$(go.Panel, "Auto",
                                                                            $$(go.Shape, { // the label background, which becomes transparent around the edges
                                                                                fill: $$(go.Brush, "Radial", { 0: "rgb(240, 240, 240)", 0.3: "rgb(240, 240, 240)", 1: "rgba(240, 240, 240, 0)" }),
                                                                                stroke: null
                                                                            }),
                                                                            $$(go.TextBlock, { // the label text
                                                                                    textAlign: "center",
                                                                                    font: "18pt helvetica, arial, sans-serif",
                                                                                    stroke: "#555555",
                                                                                    margin: 4
                                                                                },
                                                                                new go.Binding("text", "text"))
                                                                        )
                                                                    );

                                                                var names = JSON.parse(ins.value);

                                                                var nodeDataArray = [];
                                                                for (var i = 0; i < names.length; i++) {
                                                                    nodeDataArray.push({ key: i, text: names[i], color: go.Brush.randomColor(128, 240) });
                                                                }

                                                                var linkDataArray = [];
                                                                /*var num = nodeDataArray.length;
                                                                for (var i = 0; i < num * 2; i++) {
                                                                    var a = Math.floor(Math.random() * num);
                                                                    var b = Math.floor(Math.random() * num / 4) + 1;
                                                                    linkDataArray.push({ from: a, to: (a + b) % num, color: go.Brush.randomColor(0, 127) });
                                                                }*/

                                                                myDiagram.model = new go.GraphLinksModel(nodeDataArray, linkDataArray);
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
                                                        var headers = [''];
                                                        for (var jj = 0; jj < ins.loc[1]; jj++) {
                                                            headers.push(jj);
                                                        }
                                                        var datas = [];
                                                        for (var jj = 0; jj < ins.loc[0]; jj++) {
                                                            var arr = ["" + jj];
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
                                                            '        <td v-for="row in rows" style="min-width:20px;text-align:center;background-color:' + color(chartColors.grey).alpha(0.6).rgbString() + ';font-weight:bold;' + trans + '">{{row}}</td>' +
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
                                                                    methods: {},
                                                                    mounted: function() {
                                                                        for (var ii = 0; ii < this.datas.length; ii++) {
                                                                            $("#" + name + "-app > table > tbody > tr:nth(" + ii + ") > td:nth(0)").css("background-color", '#fff');
                                                                            $("#" + name + "-app > table > tbody > tr:nth(" + ii + ") > td:nth(0)").css("font-weight", '');
                                                                        }
                                                                    }
                                                                });
                                                                eventBus.on("modify-" + oname, function(sender, data, obj) {
                                                                    $("#" + name + "-app > table > tbody > tr:nth(" + (data.loc[0]) + ") > td:nth(" + (data.loc[1] + 1) + ")").css("background-color", get_show_color(app.focuses.length));
                                                                    app.focuses.push(data.loc);
                                                                    app.$set(app.datas[data.loc[0]], data.loc[1] + 1, data.value);
                                                                });
                                                                eventBus.on("close-" + oname, function(sender, data, obj) {
                                                                    layer.close(L);
                                                                });
                                                                this.lost_focus = function(sender, data, obj) {
                                                                    if (app.focuses.length) {
                                                                        for (var f in app.focuses)
                                                                            $("#" + name + "-app > table > tbody > tr:nth(" + (app.focuses[f][0]) + ") > td:nth(" + (app.focuses[f][1] + 1) + ")").css("background-color", color(chartColors.grey).alpha(0.6).rgbString());
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
                                                } else {
                                                    layer.msg("错误：不支持二维以上数组");
                                                }
                                            } else {
                                                layer.msg("错误：重复创建");
                                            }
                                        } else if (ins.method == "update") {
                                            if (ins.type == "char" && typeof(ins.value) == 'number')
                                                ins.value = String.fromCharCode(ins.value);
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
                                        } else if (ins.method == "delay") {} else {}
                                    }
                                    if (this.current < this.total) {
                                        var ins = this.step[this.current];
                                        if (ins.type == "char" && typeof(ins.value) == 'number')
                                            ins.value = String.fromCharCode(ins.value);
                                        var tt = "未知类型";
                                        if (ins.type) {
                                            if (ins.type == "int") tt = "整型";
                                            else if (ins.type == "char") tt = "字符型";
                                        }
                                        if (ins.method == "msg") {
                                            this.curop = "输出：" + ins.value;
                                        } else if (ins.method == "delay") {
                                            this.curop = "等待";
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
                        if (this.app.autos) {
                            this.app.autos = false;
                            //console.info("stop timer: ", this.app.auto_id);
                            clearInterval(this.app.auto_id);
                            return false;
                        }
                        this.app.autos = true;
                        this.app.auto_id = setInterval(this.yes.bind(this), 300);
                        //console.info("timer: ", this.app.auto_id);
                        var _app = this.app;
                        eventBus.on("close", function(sender, data, obj) {
                            //console.info("stop timer: ", _app.auto_id);
                            clearInterval(_app.auto_id);
                            _app.autos = false;
                        });
                        return false;
                    },
                    btn3: function() {
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