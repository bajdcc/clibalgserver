(function(exporter) {
    function isFunc(fn) { return typeof fn === "function" }

    function str(s) {
        if (s == null) {
            return null;
        }
        s = s.replace(/^\s+|\s+$/g, "");
        return s.length > 0 ? s.toLowerCase() : null;
    }

    function handler() {
        var fns = [];
        var datas = [];
        this.add = function(fn, data) {
            fns.push(fn);
            datas.push(data);
        }
        this.remove = function(fn) {
            var i = fns.indexOf(fn);
            if (i >= 0) {
                fns.splice(i, 1);
                datas.splice(i, 1);
            }
        }
        this.invoke = function(sender, data) {
            fns.forEach((fn, i) => {
                try {
                    fn(sender, data, datas[i])
                } catch (error) {
                    console.error(error);
                }
            });
        }
    }

    function eventBus() {
        var handers = {}
        this.on = function(eventName, fnOrData, fn) {
            eventName = str(eventName);
            if (eventName == null) {
                throw new Error("事件名无效");
            }
            if (!isFunc(fn)) {
                var temp = fn;
                fn = fnOrData;
                fnOrData = temp;
            }
            if (!isFunc(fn)) {
                throw new Error("必须提供事件函数");
            }
            var handle = handers[eventName];
            if (handle == null) {
                handle = new handler();
                handers[eventName] = handle;
            }
            handle.add(fn, fnOrData);
        }
        this.off = function(eventName, fn) {
            eventName = str(eventName);
            if (eventName == null) {
                return;
            }
            var handle = handers[eventName];
            if (handle != null) {
                if (fn == null) {
                    delete handers[eventName];
                } else {
                    handle.remove(fn);
                }
            }
        }
        this.fire = this.emit = this.trigger =
            function(eventName, sender, data) {
                eventName = str(eventName);
                if (eventName == null) {
                    return;
                }
                var handle = handers[eventName];
                if (handle != null) {
                    handle.invoke(sender, data);
                }
            }
        var bus = this;
        this.bindTo = function(obj) {
            if (obj == null) {
                throw new Error("obj is null");
            }
            for (const key in bus) {
                if (bus.hasOwnProperty(key) && key !== "bindTo") {
                    obj[key] = bus[key];
                }
            }
        }
    }
    var instance = new eventBus();
    instance.bindTo(eventBus);
    exporter(eventBus);
})(c => window.eventBus = c)