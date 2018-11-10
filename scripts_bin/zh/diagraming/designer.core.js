Schema.init(true);
Schema.initMarkers();
$(function() {
    Designer.init();
    if (typeof isView != "undefined") {
        return
    }
    if (role == "trial") {
        Designer.status = "demo"
    } else {
        if (role == "viewer") {
            Designer.status = "readonly"
        }
    }
    if (Designer.status == "readonly") {
        if (localRuntime == false) {
            Designer.setReadonly(true)
        }
    } else {
        UI.init();
        Dock.init();
        Navigator.init()
    }
    if (tutorial) {
        createdTip = true;
        UI.gettingStart()
    }
    if (!showToolbar) {
        var a = $("#bar_collapse").children("div");
        a.attr("class", "ico expand");
        $(".titlebar").hide();
        $("#bar_return").show();
        $(".layout").height($(window).height() - 73)
    }
    $("#load_mask").remove()
});
var Designer = {
    defaults: {
        linkerBeginArrowStyle: null,
        linkerEndArrowStyle: null
    },
    config: {
        panelItemWidth: 30,
        panelItemHeight: 30,
        pageMargin: 1000,
        anchorSize: 8,
        rotaterSize: 9,
        anchorColor: "#833",
        selectorColor: "#833",
        scale: 1
    },
    status: "",
    initialize: {
        initialized: false,
        initLayout: function() {
            $(window).bind("resize.designer", function() {
                var a = $(window).height() - $("#designer_header").outerHeight() - $("#designer_footer").outerHeight();
                $(".layout").height(a);
                if ($("#demo_signup").length) {
                    $("#designer_layout").height(a - $("#demo_signup").outerHeight())
                }
            });
            $(window).trigger("resize.designer")
        },
        initModel: function() {
            Model.define = {
                page: Utils.copy(Schema.pageDefaults),
                elements: {}
            };
            Model.persistence = {
                page: Utils.copy(Schema.pageDefaults),
                elements: {}
            }
        },
        initCanvas: function() {
            var l = Model.define.page.width.toScale();
            var f = Model.define.page.height.toScale();
            if (l > 20000) {
                l = 20000
            }
            if (f > 20000) {
                f = 20000
            }
            if (Model.define.page.orientation == "landscape") {
                var n = l;
                l = f;
                f = n
            }
            var a = Model.define.page.backgroundColor;
            if (a == "transparent") {
                a = "255,255,255"
            }
            var j = Utils.getDarkerColor(a);
            var b = Utils.getDarkestColor(a);
            $("#designer_canvas").css({
                "background-color": "rgb(" + j + ")"
            });
            var e = $("#designer_grids");
            if (e.length > 0) {
                e.attr({
                    width: l,
                    height: f
                });
                var o = e[0].getContext("2d");
                o.clearRect(0, 0, l, f);
                var k = Model.define.page.padding.toScale();
                var c = l - k * 2;
                var m = f - k * 2;
                o.fillStyle = "rgb(" + a + ")";
                o.beginPath();
                o.rect(k, k, c, m);
                o.fill();
                var d = Math.round(Model.define.page.gridSize.toScale());
                if (d < 10) {
                    d = 10
                }
                if (Model.define.page.showGrid) {
                    o.translate(k, k);
                    o.lineWidth = 1;
                    o.save();
                    var i = 0.5;
                    var g = 0;
                    while (i <= m) {
                        o.restore();
                        if (g % 4 == 0) {
                            o.strokeStyle = "rgb(" + b + ")"
                        } else {
                            o.strokeStyle = "rgb(" + j + ")"
                        }
                        o.beginPath();
                        o.moveTo(0, i);
                        o.lineTo(c, i);
                        i += d;
                        g++;
                        o.stroke()
                    }
                    i = 0.5;
                    g = 0;
                    while (i <= c) {
                        o.restore();
                        if (g % 4 == 0) {
                            o.strokeStyle = "rgb(" + b + ")"
                        } else {
                            o.strokeStyle = "rgb(" + j + ")"
                        }
                        o.beginPath();
                        o.moveTo(i, 0);
                        o.lineTo(i, m);
                        i += d;
                        g++;
                        o.stroke()
                    }
                }
            }
            $("#canvas_container").css({
                width: l,
                height: f,
                padding: Designer.config.pageMargin
            });
            if (!this.initialized) {
                $("#designer_layout").scrollTop(Designer.config.pageMargin - 10);
                $("#designer_layout").scrollLeft(Designer.config.pageMargin - 10)
            }
        },
        initShapes: function() {
            $("#shape_panel").empty();
            $("#shape_panel").append("<div class='panel_container panel_collapsed'><h3 class='panel_title search'><input id='shape_search' placeholder='搜索'  title='搜索ProcessOn图形和网络图标，搜索网络图标建议使用英文单词，搜索更精准。' title_pos='right'/></h3><div id='panel_search' class='content'></div></div>");
            for (var f = 0; f < Schema.categories.length; f++) {
                var g = Schema.categories[f];
                if (g.name == "standard") {
                    continue
                }
                $("#shape_panel").append("<div class='panel_container'><h3 class='panel_title'><div class='ico ico_accordion'></div>" + g.text + "</h3><div id='panel_" + g.name + "' class='content'></div></div>")
            }
            $(".panel_title").unbind().bind("click", function() {
                if (!$(this).hasClass("search")) {
                    $(this).parent().toggleClass("panel_collapsed")
                }
            });
            for (var b in Schema.shapes) {
                var j = Schema.shapes[b];
                if (j.attribute.visible && j.category != "standard") {
                    if (!j.groupName) {
                        e(j)
                    } else {
                        var k = SchemaGroup.getGroup(j.groupName);
                        if (k[0] == b) {
                            e(j, j.groupName)
                        }
                    }
                }
            }
            function e(l, o) {
                l = Utils.copy(l);
                var n = "<div class='panel_box' shapeName='" + l.name + "'><canvas class='panel_item' width='" + (Designer.config.panelItemWidth) + "' height='" + (Designer.config.panelItemHeight) + "'></canvas></div>";
                var i = $(n).appendTo("#panel_" + l.category);
                if (o) {
                    i.append("<div class='group_icon' onmousedown='Designer.op.showPanelGroup(\"" + o + "\", event, this)'></div>")
                }
                var m = i.children()[0];
                i.bind("mouseenter", function() {
                    if ($(this).hasClass("readonly")) {
                        return
                    }
                    var q = $("#shape_thumb");
                    q.children("div").html(l.title);
                    var p = q.children("canvas")[0].getContext("2d");
                    q.attr("current", l.name);
                    var r = {
                        x: 0,
                        y: 0,
                        w: l.props.w,
                        h: l.props.h,
                        angle: l.props.angle
                    };
                    var t = 160;
                    var s = 160;
                    p.clearRect(0, 0, t, s);
                    if (l.props.w >= l.props.h) {
                        if (l.props.w > t) {
                            r.w = t;
                            r.h = parseInt(l.props.h / l.props.w * r.w)
                        }
                    } else {
                        if (l.props.h > s) {
                            r.h = s;
                            r.w = parseInt(l.props.w / l.props.h * r.h)
                        }
                    }
                    q.children("canvas").attr({
                        width: t + 20,
                        height: r.h + 20
                    });
                    q.show();
                    l.props = r;
                    p.save();
                    p.lineJoin = "round";
                    p.globalAlpha = l.shapeStyle.alpha;
                    var w = (t + 20 - r.w) / 2;
                    var v = 10;
                    p.translate(w, v);
                    p.translate(r.w / 2, r.h / 2);
                    p.rotate(r.angle);
                    p.translate(-(r.w / 2), -(r.h / 2));
                    Designer.painter.renderShapePath(p, l, false, function() {
                        if ($("#shape_thumb[current=" + l.name + "]:visible").length > 0) {
                            i.trigger("mouseenter")
                        }
                    });
                    Designer.painter.renderMarkers(p, l, false);
                    p.restore();
                    p.translate(w, v);
                    var u = i.offset().top - $("#designer_header").outerHeight() + i.height() / 2 - q.outerHeight() / 2;
                    if (u < 5) {
                        u = 5
                    } else {
                        if (u + q.outerHeight() > $("#designer_viewport").height() - 5) {
                            u = $("#designer_viewport").height() - 5 - q.outerHeight()
                        }
                    }
                    q.css("top", u)
                }).bind("mouseleave", function() {
                    $("#shape_thumb").hide()
                });
                Designer.painter.drawPanelItem(m, l.name)
            }
            c();
            function c() {
                $(".panel_box").die().live("mousedown", function(s) {
                    var p = $(this);
                    if (p.hasClass("readonly")) {
                        return
                    }
                    var i = p.attr("shapeName");
                    var r = [];
                    Designer.op.changeState("creating_from_panel");
                    var l = null;
                    var q = null;
                    var o = $("#designer_canvas");
                    var m = a(i);
                    $("#designer").bind("mousemove.creating", function(t) {
                        h(m, t)
                    });
                    $("#canvas_container").bind("mousemove.create", function(A) {
                        var v = Utils.getRelativePos(A.pageX, A.pageY, o);
                        if (l == null) {
                            l = d(i, v.x, v.y);
                            q = $("#" + l.id);
                            q.attr("class", "shape_box_creating")
                        }
                        q.css({
                            left: v.x - q.width() / 2 + "px",
                            top: v.y - q.height() / 2 + "px",
                            "z-index": Model.orderList.length
                        });
                        l.props.x = v.x.restoreScale() - l.props.w / 2;
                        l.props.y = v.y.restoreScale() - l.props.h / 2;
                        var z = l.props;
                        var y = Designer.op.snapLine(z, [l.id], true, l);
                        if (y.attach) {
                            l.attachTo = y.attach.id
                        } else {
                            delete l.attachTo
                        }
                        if (y.container) {
                            j.container = y.container.id
                        } else {
                            delete j.container
                        }
                        q.css({
                            left: (l.props.x - 10).toScale() + "px",
                            top: (l.props.y - 10).toScale() + "px",
                            "z-index": Model.orderList.length
                        });
                        r = Utils.getShapeAnchorInLinker(l);
                        Designer.op.hideLinkPoint();
                        for (var w = 0; w < r.length; w++) {
                            var u = r[w];
                            for (var t = 0; t < u.anchors.length; t++) {
                                var x = u.anchors[t];
                                Designer.op.showLinkPoint(Utils.toScale(x))
                            }
                        }
                    });
                    var n = false;
                    $("#canvas_container").bind("mouseup.create", function(t) {
                        n = true
                    });

                    //Frida Test
                    $(document).bind("mouseup.create", function() {
                        $(this).unbind("mouseup.create");
                        $("#designer").unbind("mousemove.creating");
                        $("#creating_shape_container").hide();
                        Designer.op.hideLinkPoint();
                        Designer.op.hideSnapLine();
                        $("#canvas_container").unbind("mouseup.create").unbind("mousemove.create");
                        if (l != null) {
                            if (n == false) {
                                q.remove()
                            } else {
                                MessageSource.beginBatch();
                                if (l.onCreated) {
                                    var J = l.onCreated();
                                    if (J == false) {
                                        q.remove();
                                        MessageSource.commit();
                                        return
                                    }
                                }
                                q.attr("class", "shape_box");
                                Designer.events.push("created", l);
                                Model.add(l);
                                var w = Utils.getShapeContext(l.id);
                                var x = q.position();
                                var C = 7;
                                for (var z = 0; z < r.length; z++) {
                                    var u = r[z];
                                    var A = u.linker;
                                    if (u.type == "line") {
                                        var t = Utils.copy(A);
                                        var E = Utils.copy(A);
                                        E.id = Utils.newId();
                                        if (u.anchors.length == 1) {
                                            var y = u.anchors[0];
                                            var v = Utils.getPointAngle(l.id, y.x, y.y, C);
                                            A.to = {
                                                id: l.id,
                                                x: y.x,
                                                y: y.y,
                                                angle: v
                                            };
                                            E.from = {
                                                id: l.id,
                                                x: y.x,
                                                y: y.y,
                                                angle: v
                                            }
                                        } else {
                                            if (u.anchors.length == 2) {
                                                var I = u.anchors[0];
                                                var H = u.anchors[1];
                                                var D = Utils.measureDistance(A.from, I);
                                                var B = Utils.measureDistance(A.from, H);
                                                var F, G;
                                                if (D < B) {
                                                    F = I;
                                                    G = H
                                                } else {
                                                    F = H;
                                                    G = I
                                                }
                                                var v = Utils.getPointAngle(l.id, F.x, F.y, C);
                                                A.to = {
                                                    id: l.id,
                                                    x: F.x,
                                                    y: F.y,
                                                    angle: v
                                                };
                                                v = Utils.getPointAngle(l.id, G.x, G.y, C);
                                                E.from = {
                                                    id: l.id,
                                                    x: G.x,
                                                    y: G.y,
                                                    angle: v
                                                }
                                            }
                                        }
                                        if (u.anchors.length <= 2) {
                                            Designer.painter.renderLinker(A, true);
                                            Model.update(A);
                                            Designer.painter.renderLinker(E, true);
                                            E.props.zindex = Model.maxZIndex + 1;
                                            Model.add(E);
                                            Designer.events.push("linkerCreated", E)
                                        }
                                    } else {
                                        var y = u.anchors[0];
                                        var v = Utils.getPointAngle(l.id, y.x, y.y, C);
                                        if (u.type == "from") {
                                            A.from = {
                                                id: l.id,
                                                x: y.x,
                                                y: y.y,
                                                angle: v
                                            }
                                        } else {
                                            A.to = {
                                                id: l.id,
                                                x: y.x,
                                                y: y.y,
                                                angle: v
                                            }
                                        }
                                        Designer.painter.renderLinker(A, true);
                                        Model.update(A)
                                    }
                                }
                                Utils.unselect();
                                Utils.selectShape(l.id);
                                MessageSource.commit();
                                Designer.op.editShapeText(l)
                            }
                        }
                        p.css({
                            left: "0px",
                            top: "0px"
                        });
                        Designer.op.resetState()
                    })
                })
            }
            function a(m) {
                var l = $("#creating_shape_canvas");
                var i = $("#creating_shape_container");
                if (l.length == 0) {
                    i = $("<div id='creating_shape_container'></div>").appendTo("#designer");
                    l = $("<canvas id='creating_shape_canvas' width='" + (Designer.config.panelItemWidth) + "' height='" + (Designer.config.panelItemHeight) + "'></canvas>").appendTo(i)
                }
                i.css({
                    left: "0px",
                    top: "0px",
                    width: $(".panel_container").width(),
                    height: $("#shape_panel").outerHeight()
                });
                Designer.painter.drawPanelItem(l[0], m);
                return l
            }
            function h(l, m) {
                $("#creating_shape_container").show();
                var i = Utils.getRelativePos(m.pageX, m.pageY, $("#creating_shape_container"));
                l.css({
                    left: i.x - Designer.config.panelItemWidth / 2,
                    top: i.y - Designer.config.panelItemHeight / 2
                })
            }
            function d(o, q, p) {
                var n = Utils.newId();
                var l = Schema.shapes[o];
                var i = q.restoreScale() - l.props.w / 2;
                var r = p.restoreScale() - l.props.h / 2;
                var m = Model.create(o, i, r);
                Designer.painter.renderShape(m);
                return m
            }
            $("#shape_search").unbind("keydown").bind("keydown", function(q) {
                if (q.keyCode == 13) {
                    $("#panel_search").empty();
                    var n = $(this).val().toLowerCase();
                    if (n.trim() != "") {
                        $("#panel_search").parent().removeClass("panel_collapsed");
                        for (var m in Schema.shapes) {
                            if (m.indexOf("image_search_") >= 0) {
                                delete Schema.shapes[m]
                            }
                        }
                        for (var m in SchemaGroup.groups) {
                            if (m.indexOf("image_search_") >= 0) {
                                delete SchemaGroup.groups[m]
                            }
                        }
                        var p = false;
                        for (var m in Schema.shapes) {
                            var l = Schema.shapes[m];
                            if (l.title && l.title.toLowerCase().indexOf(n) >= 0 && l.attribute.visible && l.category != "standard") {
                                p = true;
                                var r = Utils.copy(l);
                                r.category = "search";
                                e(r)
                            }
                        }
                        if (p) {
                            $("#panel_search").prepend("<div class='search_panel_title'>ProcessOn图形</div>")
                        }
                        $("#panel_search").append("<div class='search_panel_title'>网络图标</div>");
                        var o = 0;
                        function i() {
                            $("#panel_search").append("<div class='search_panel_loading'>正在搜索网络图标...</div>");
                            $(".search_panel_btn").remove();
                            var s = Schema.shapes.standardImage;
                            $.getJSON("https://api.iconfinder.com/v2/icons/search?query=" + n + "&offset=" + o + "&count=24&minimum_size=64&vector=false&premium=false", function(w) {
                                if (w.total_count == 0) {
                                    $(".search_panel_loading").text("没有搜索到网络图标，建议使用常用英文单词进行搜索。");
                                    return
                                }
                                $(".search_panel_loading").remove();
                                var D = w.icons;
                                for (var x = 0; x < D.length; x++) {
                                    var y = D[x];
                                    var F = y.raster_sizes;
                                    F.sort(function(H, G) {
                                        if (H.size == 128) {
                                            return -1
                                        }
                                        return H.size - G.size
                                    });
                                    var B = "image_search_" + Utils.newId();
                                    var z = false;
                                    var A = y.tags.join(", ");
                                    for (var v = 0; v < F.length; v++) {
                                        var E = F[v];
                                        var t = E.formats[0].preview_url;
                                        if (typeof s == "undefined") {
                                            continue
                                        }
                                        var C = Utils.copy(s);
                                        C.props = {
                                            w: E.size_width,
                                            h: E.size_height
                                        };
                                        C.fillStyle = {
                                            type: "image",
                                            fileId: t,
                                            display: "stretch",
                                            imageW: E.size_width,
                                            imageH: E.size_height
                                        };
                                        C.attribute.visible = true;
                                        C.name = "image_search_" + Utils.newId();
                                        C.category = "search";
                                        C.title = A + "<br/>" + E.size_width + "x" + E.size_height;
                                        C.groupName = B;
                                        Schema.shapes[C.name] = C;
                                        SchemaGroup.addGroupShape(B, C.name);
                                        if ((E.size == 128 || v == F.length - 1) && z == false) {
                                            e(C, C.groupName);
                                            z = true
                                        }
                                    }
                                }
                                o += 24;
                                if (o < w.total_count) {
                                    var u = $("<div class='toolbar_button active search_panel_btn'>加载更多</div>").appendTo("#panel_search");
                                    u.bind("click", function() {
                                        i()
                                    })
                                }
                            })
                        }
                        i()
                    } else {
                        $("#panel_search").parent().addClass("panel_collapsed")
                    }
                }
            })
        }
    },
    hotkey: {
        init: function() {
            var a = null;
            $(window).unbind("keydown.hotkey").bind("keydown.hotkey", function(j) {
                if ((j.ctrlKey || j.metaKey) && j.keyCode == 83) {
                    j.preventDefault()
                } else {
                    if ((j.ctrlKey || j.metaKey) && j.keyCode == 65) {
                        Designer.selectAll();
                        j.preventDefault()
                    } else {
                        if (j.keyCode == 46 || j.keyCode == 8) {
                            Designer.op.removeShape();
                            j.preventDefault()
                        } else {
                            if ((j.ctrlKey || j.metaKey) && j.keyCode == 90) {
                                MessageSource.undo();
                                j.preventDefault()
                            } else {
                                if ((j.ctrlKey || j.metaKey) && j.keyCode == 89) {
                                    MessageSource.redo();
                                    j.preventDefault()
                                } else {
                                    if ((j.ctrlKey || j.metaKey) && !j.shiftKey && j.keyCode == 67) {
                                        Designer.clipboard.copy();
                                        j.preventDefault()
                                    } else {
                                        if ((j.ctrlKey || j.metaKey) && j.keyCode == 88) {
                                            Designer.clipboard.cut();
                                            j.preventDefault()
                                        } else {
                                            if ((j.ctrlKey || j.metaKey) && j.keyCode == 86) {
                                                Designer.clipboard.paste();
                                                j.preventDefault()
                                            } else {
                                                if ((j.ctrlKey || j.metaKey) && j.keyCode == 68) {
                                                    Designer.clipboard.duplicate();
                                                    j.preventDefault()
                                                } else {
                                                    if ((j.ctrlKey || j.metaKey) && j.shiftKey && j.keyCode == 66) {
                                                        Designer.clipboard.brush();
                                                        j.preventDefault()
                                                    } else {
                                                        if ((j.altKey || j.metaKey) && (j.keyCode == 187 || j.keyCode == 107)) {
                                                            Designer.zoomIn();
                                                            j.preventDefault()
                                                        } else {
                                                            if ((j.altKey || j.metaKey) && (j.keyCode == 189 || j.keyCode == 109)) {
                                                                Designer.zoomOut();
                                                                j.preventDefault()
                                                            } else {
                                                                if (j.keyCode >= 37 && j.keyCode <= 40) {
                                                                    if (a == null || Utils.getSelected().length > 0) {
                                                                        var d = Utils.getSelected();
                                                                        var m = Utils.getFamilyShapes(d);
                                                                        d = d.concat(m);
                                                                        var g = Utils.getContainedShapes(d);
                                                                        d = d.concat(g);
                                                                        var f = Utils.getAttachedShapes(d);
                                                                        d = d.concat(f);
                                                                        var k = Utils.getCollapsedShapes(d);
                                                                        d = d.concat(k);
                                                                        var n = Utils.getOutlinkers(d);
                                                                        a = d.concat(n)
                                                                    }
                                                                    if (a.length > 0) {
                                                                        j.preventDefault();
                                                                        var b = 10;
                                                                        if (j.ctrlKey || j.shiftKey) {
                                                                            b = 1
                                                                        }
                                                                        Utils.hideLinkerCursor();
                                                                        UI.hideShapeOptions();
                                                                        if (j.keyCode == 37) {
                                                                            Designer.op.moveShape(a, {
                                                                                x: -b,
                                                                                y: 0
                                                                            })
                                                                        } else {
                                                                            if (j.keyCode == 38) {
                                                                                Designer.op.moveShape(a, {
                                                                                    x: 0,
                                                                                    y: -b
                                                                                });
                                                                                j.preventDefault()
                                                                            } else {
                                                                                if (j.keyCode == 39) {
                                                                                    Designer.op.moveShape(a, {
                                                                                        x: b,
                                                                                        y: 0
                                                                                    })
                                                                                } else {
                                                                                    if (j.keyCode == 40) {
                                                                                        Designer.op.moveShape(a, {
                                                                                            x: 0,
                                                                                            y: b
                                                                                        });
                                                                                        j.preventDefault()
                                                                                    }
                                                                                }
                                                                            }
                                                                        }
                                                                        $(document).unbind("keyup.moveshape").bind("keyup.moveshape", function() {
                                                                            Model.updateMulti(a);
                                                                            a = null;
                                                                            $(document).unbind("keyup.moveshape");
                                                                            Designer.op.hideTip();
                                                                            Utils.showLinkerCursor();
                                                                            UI.showShapeOptions()
                                                                        })
                                                                    }
                                                                } else {
                                                                    if ((j.ctrlKey || j.metaKey) && j.keyCode == 221) {
                                                                        var l = "front";
                                                                        if (j.shiftKey) {
                                                                            l = "forward"
                                                                        }
                                                                        Designer.layerShapes(l)
                                                                    } else {
                                                                        if ((j.ctrlKey || j.metaKey) && j.keyCode == 219) {
                                                                            var l = "back";
                                                                            if (j.shiftKey) {
                                                                                l = "backward"
                                                                            }
                                                                            Designer.layerShapes(l)
                                                                        } else {
                                                                            if ((j.ctrlKey || j.metaKey) && j.keyCode == 71) {
                                                                                j.preventDefault();
                                                                                if (j.shiftKey) {
                                                                                    Designer.ungroup()
                                                                                } else {
                                                                                    Designer.group()
                                                                                }
                                                                            } else {
                                                                                if ((j.ctrlKey || j.metaKey) && j.keyCode == 76) {
                                                                                    j.preventDefault();
                                                                                    if (j.shiftKey) {
                                                                                        Designer.unlockShapes()
                                                                                    } else {
                                                                                        Designer.lockShapes()
                                                                                    }
                                                                                } else {
                                                                                    if (j.keyCode == 18) {
                                                                                        Designer.op.changeState("drag_canvas")
                                                                                    } else {
                                                                                        if (j.keyCode == 27) {
                                                                                            if (!Designer.op.state) {
                                                                                                Utils.unselect();
                                                                                                $(".options_menu").hide();
                                                                                                $(".color_picker").hide()
                                                                                            } else {
                                                                                                if (Designer.op.state == "creating_free_text" || Designer.op.state == "creating_free_linker") {
                                                                                                    Designer.op.resetState()
                                                                                                }
                                                                                            }
                                                                                        } else {
                                                                                            if (j.keyCode == 84 && !(j.ctrlKey || j.metaKey)) {
                                                                                                $(".options_menu").hide();
                                                                                                $(".color_picker").hide();
                                                                                                Designer.op.changeState("creating_free_text")
                                                                                            } else {
                                                                                                if (j.keyCode == 73 && !(j.ctrlKey || j.metaKey)) {
                                                                                                    $(".options_menu").hide();
                                                                                                    $(".color_picker").hide();
                                                                                                    UI.showImageSelect(function(o, e, p) {
                                                                                                        UI.insertImage(o, e, p)
                                                                                                    });
                                                                                                    $("#designer_contextmenu").hide()
                                                                                                } else {
                                                                                                    if (j.keyCode == 76 && !(j.ctrlKey || j.metaKey)) {
                                                                                                        $(".options_menu").hide();
                                                                                                        $(".color_picker").hide();
                                                                                                        Designer.op.changeState("creating_free_linker")
                                                                                                    } else {
                                                                                                        if (j.keyCode == 66 && (j.ctrlKey || j.metaKey)) {
                                                                                                            var i = Utils.getSelectedIds();
                                                                                                            if (i.length > 0) {
                                                                                                                var h = Model.getShapeById(i[0]);
                                                                                                                var c = Utils.getShapeFontStyle(h.fontStyle);
                                                                                                                Designer.setFontStyle({
                                                                                                                    bold: !c.bold
                                                                                                                });
                                                                                                                UI.update()
                                                                                                            }
                                                                                                            j.preventDefault()
                                                                                                        } else {
                                                                                                            if (j.keyCode == 73 && (j.ctrlKey || j.metaKey)) {
                                                                                                                var i = Utils.getSelectedIds();
                                                                                                                if (i.length > 0) {
                                                                                                                    var h = Model.getShapeById(i[0]);
                                                                                                                    var c = Utils.getShapeFontStyle(h.fontStyle);
                                                                                                                    Designer.setFontStyle({
                                                                                                                        italic: !h.fontStyle.italic
                                                                                                                    });
                                                                                                                    UI.update()
                                                                                                                }
                                                                                                                j.preventDefault()
                                                                                                            } else {
                                                                                                                if (j.keyCode == 85 && (j.ctrlKey || j.metaKey)) {
                                                                                                                    var i = Utils.getSelectedIds();
                                                                                                                    if (i.length > 0) {
                                                                                                                        var h = Model.getShapeById(i[0]);
                                                                                                                        var c = Utils.getShapeFontStyle(h.fontStyle);
                                                                                                                        Designer.setFontStyle({
                                                                                                                            underline: !c.underline
                                                                                                                        });
                                                                                                                        UI.update()
                                                                                                                    }
                                                                                                                    j.preventDefault()
                                                                                                                } else {
                                                                                                                    if (j.keyCode == 32 && !(j.ctrlKey || j.metaKey)) {
                                                                                                                        var i = Utils.getSelectedIds();
                                                                                                                        if (i.length == 1) {
                                                                                                                            var h = Model.getShapeById(i[0]);
                                                                                                                            Designer.op.editShapeText(h)
                                                                                                                        }
                                                                                                                        j.preventDefault()
                                                                                                                    } else {
                                                                                                                        if (j.keyCode == 121) {
                                                                                                                            j.preventDefault();
                                                                                                                            Dock.enterPresentation()
                                                                                                                        } else {
                                                                                                                            if (j.keyCode == 91) {
                                                                                                                                Designer.op.isMetaKey = true;
                                                                                                                                j.preventDefault();
                                                                                                                                return false
                                                                                                                            }
                                                                                                                        }
                                                                                                                    }
                                                                                                                }
                                                                                                            }
                                                                                                        }
                                                                                                    }
                                                                                                }
                                                                                            }
                                                                                        }
                                                                                    }
                                                                                }
                                                                            }
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            });
            $("input,textarea,select").die().live("keydown.hotkey", function(b) {
                b.stopPropagation()
            });
            $(window).unbind("keyup.hotkey").bind("keyup.hotkey", function(b) {
                if (b.keyCode == 91) {
                    b.preventDefault();
                    Designer.op.isMetaKey = false;
                    return false
                }
            })
        },
        cancel: function() {
            $(window).unbind("keydown.hotkey")
        }
    },
    contextMenu: {
        init: function() {
            $("#designer_contextmenu").unbind("mousedown").bind("mousedown", function(a) {
                a.stopPropagation()
            });
            $("#designer_contextmenu").find("li:not(.devider)").unbind("click").bind("click", function() {
                var a = $(this);
                if (!a.menuitem("isDisabled") && a.children(".extend_menu").length == 0) {
                    Designer.contextMenu.execAction(a);
                    Designer.contextMenu.hide()
                }
            });
            $("#canvas_container").unbind("contextmenu").bind("contextmenu", function(b) {
                b.preventDefault();
                if (!b.ctrlKey) {
                    var a = $("#designer_canvas");
                    var c = Utils.getRelativePos(b.pageX, b.pageY, a);
                    Designer.contextMenu.show(c.x, c.y)
                }
            })
        },
        destroy: function() {
            $("#canvas_container").unbind("contextmenu");
            this.hide()
        },
        menuPos: {
            x: 0,
            y: 0,
            shape: null
        },
        show: function(i, h) {
            this.menuPos.x = i;
            this.menuPos.y = h;
            var c = $("#designer_contextmenu");
            var a = Utils.getShapeByPosition(i, h, false);
            c.children().hide();
            c.children("li[ac=selectall]").show();
            c.children(".devi_selectall").show();
            c.children("li[ac=drawline]").show();
            var b = Designer.clipboard.elements.length;
            if (b == 0) {
                if (localStorage.clipboard) {
                    var d = JSON.parse(localStorage.clipboard);
                    b = d.length
                }
            }
            if (a == null) {
                if (b > 0) {
                    c.children("li[ac=paste]").show();
                    c.children(".devi_clip").show()
                }
            } else {
                var f = a.shape;
                this.menuPos.shape = f;
                if (f.locked) {
                    if (b > 0) {
                        c.children("li[ac=paste]").show();
                        c.children(".devi_clip").show()
                    }
                    c.children("li[ac=unlock]").show();
                    c.children(".devi_shape").show()
                } else {
                    c.children("li[ac=cut]").show();
                    c.children("li[ac=copy]").show();
                    c.children("li[ac=duplicate]").show();
                    c.children("li[ac=replace]").show();
                    if (b > 0) {
                        c.children("li[ac=paste]").show()
                    }
                    c.children(".devi_clip").show();
                    c.children("li[ac=front]").show();
                    c.children("li[ac=back]").show();
                    c.children("li[ac=lock]").show();
                    var g = Utils.getSelectedIds();
                    var e = g.length;
                    if (e >= 2) {
                        c.children("li[ac=group]").show();
                        $("#ctxmenu_align").show()
                    }
                    var j = Utils.getSelectedGroups().length;
                    if (j >= 1) {
                        c.children("li[ac=ungroup]").show()
                    }
                    c.children(".devi_shape").show();
                    if (e == 1 && f.name != "linker" && f.link) {
                        c.children("li[ac=changelink]").show()
                    }
                    if (f.name == "linker" || (f.textBlock && f.textBlock.length > 0)) {
                        c.children("li[ac=edit]").show()
                    }
                    c.children("li[ac=delete]").show();
                    c.children(".devi_del").show()
                }
            }
            c.css({
                display: "block",
                "z-index": Model.orderList.length + 3,
                left: i,
                top: h
            });
            $(document).bind("mousedown.ctxmenu", function() {
                Designer.contextMenu.hide()
            })
        },
        hide: function() {
            $("#designer_contextmenu").hide();
            $(document).unbind("mousedown.ctxmenu")
        },
        execAction: function(b) {
            var c = b.attr("ac");
            if (c == "cut") {
                Designer.clipboard.cut()
            } else {
                if (c == "copy") {
                    Designer.clipboard.copy()
                } else {
                    if (c == "paste") {
                        Designer.clipboard.paste(this.menuPos.x, this.menuPos.y)
                    } else {
                        if (c == "duplicate") {
                            Designer.clipboard.duplicate()
                        } else {
                            if (c == "front") {
                                Designer.layerShapes("front")
                            } else {
                                if (c == "back") {
                                    Designer.layerShapes("back")
                                } else {
                                    if (c == "lock") {
                                        Designer.lockShapes()
                                    } else {
                                        if (c == "unlock") {
                                            Designer.unlockShapes()
                                        } else {
                                            if (c == "group") {
                                                Designer.group()
                                            } else {
                                                if (c == "ungroup") {
                                                    Designer.ungroup()
                                                } else {
                                                    if (c == "align_shape") {
                                                        var d = b.attr("al");
                                                        Designer.alignShapes(d)
                                                    } else {
                                                        if (c == "edit") {
                                                            Designer.op.editShapeText(this.menuPos.shape, this.menuPos)
                                                        } else {
                                                            if (c == "delete") {
                                                                Designer.op.removeShape()
                                                            } else {
                                                                if (c == "selectall") {
                                                                    Designer.selectAll()
                                                                } else {
                                                                    if (c == "drawline") {
                                                                        Designer.op.changeState("creating_free_linker")
                                                                    } else {
                                                                        if (c == "changelink") {
                                                                            UI.showInsertLink()
                                                                        } else {
                                                                            if (c == "replace") {
                                                                                var a = Utils.getSelectedIds();
                                                                                Designer.op.linkDashboard(a[0])
                                                                            }
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    init: function() {
        this.initialize.initLayout();
        this.initialize.initModel();
        if (localRuntime == false) {
            this.initialize.initCanvas()
        }
        this.initialize.initShapes();
        this.hotkey.init();
        this.contextMenu.init();
        Designer.op.init();
        this.initialize.initialized = true;
        Designer.events.push("initialized");
        $("#designer_layout").on("scroll", function() {
            $(document).trigger("mouseup.multiselect")
        })
    },
    op: {
        init: function(){
			var canvas = $("#designer_canvas");
			var container = $("#canvas_container");
			//绑定在画布上鼠标移动时，显示移动、连线，还是框选
			container.unbind("mousemove.operate").bind("mousemove.operate", function(hoverEvent){
				if(Designer.op.state != null){
					return;
				}
				//鼠标移动一下，就重新初始化鼠标操作
				Designer.op.destroy();
				var relativePos = Utils.getRelativePos(hoverEvent.pageX, hoverEvent.pageY, canvas);
				var focus = Utils.getShapeByPosition(relativePos.x, relativePos.y);
				if(focus != null){
					if(focus.type == "dataAttribute"){
						Designer.op.linkClickable(focus.attribute.value, relativePos);
					}else if(focus.type == "linker"){
						container.css("cursor", "pointer");
						Designer.op.shapeSelectable(focus.shape);
						var linker = focus.shape;
						var index = focus.pointIndex; //鼠标在第几个拐点之间，由此来判断是否可重置折线
						if(linker.linkerType == "broken" && index > 1 && index <= linker.points.length){
							//在折线拐线上，可以拖动
							Designer.op.brokenLinkerChangable(linker, index - 1);
						}else if(linker.from.id == null && linker.to.id == null){
							container.css("cursor", "move");
							Designer.op.shapeDraggable();
						}
						Designer.op.linkerEditable(linker);
					}else if(focus.type == "linker_point"){
						container.css("cursor", "move");
						Designer.op.shapeSelectable(focus.shape);
						Designer.op.linkerDraggable(focus.shape, focus.point);
						Designer.op.linkerEditable(focus.shape);
					}else if(focus.type == "linker_text"){
						container.css("cursor", "text");
						Designer.op.shapeSelectable(focus.shape);
						Designer.op.linkerEditable(focus.shape);
					}else{
						if(focus.type == "shape"){
							if(focus.shape.locked){
								container.css("cursor", "default");
								Designer.op.shapeSelectable(focus.shape);
							}else{
								container.css("cursor", "move");
								Designer.op.shapeSelectable(focus.shape);
								Designer.op.shapeEditable(focus.shape);
								Designer.op.shapeDraggable();
								if(focus.shape.link){
									Designer.op.linkClickable(focus.shape.link, relativePos);
								}
							}
						}else{
							//在边界上，可连线 
							container.css("cursor", "crosshair");
							Designer.op.shapeSelectable(focus.shape);
							Designer.op.shapeLinkable(focus.shape, focus.linkPoint);
						}
						if(focus.shape.parent){
							Utils.showAnchors(Model.getShapeById(focus.shape.parent));
						}else{
							Utils.showAnchors(focus.shape);
						}
					}
				}else{
					//如果鼠标坐标下没有图形，则可以进行多图形的选择
					container.css("cursor", "default");
					Designer.op.shapeMultiSelectable();
				}
			});
		},
        cancel: function() {
            $("#canvas_container").unbind("mousemove.operate").css("cursor", "default");
            this.destroy()
        },
        destroy: function() {
            $("#designer_canvas").unbind("mousedown.drag").unbind("dblclick.edit").unbind("mousedown.draglinker").unbind("mousedown.select").unbind("mousedown.brokenLinker").unbind("dblclick.edit_linker");
            $("#canvas_container").unbind("mousedown.link").unbind("mousedown.create_text").unbind("mousedown.drag_canvas");
            $("#designer_layout").unbind("mousedown.multiselect");
            Utils.hideAnchors();
            $("#link_spot").hide()
        },
        state: null,
        changeState: function(a) {
            this.state = a;
            if (a == "creating_free_text") {
                this.destroy();
                $("#canvas_container").css("cursor", "crosshair");
                this.textCreatable()
            } else {
                if (a == "creating_free_linker") {
                    this.destroy();
                    $("#canvas_container").css("cursor", "crosshair");
                    this.shapeLinkable()
                } else {
                    if (a == "drag_canvas") {
                        this.destroy();
                        this.canvasDraggable()
                    } else {
                        if (a == "changing_curve") {
                            this.destroy()
                        }
                    }
                }
            }
        },
        resetState: function() {
            this.state = null;
            $("#canvas_container").css("cursor", "default")
        },
        /**
		 * 选中图形
		 */
		shapeSelectable: function(shape){
			var canvas = $("#designer_canvas");
			canvas.bind("mousedown.select", function(downE){
				Designer.op.changeState("seelcting_shapes");
				var shapeId = shape.id;
				var selectIds = [];
				if(downE.ctrlKey){
					//如果按着ctrl，可以多选
					var selectIds = Utils.getSelectedIds();
					if(Utils.isSelected(shapeId)){
						//如果选中了，取消选择
						Utils.removeFromArray(selectIds, shapeId);
					}else{
						selectIds.push(shapeId);
					}
					Utils.unselect();
					if(selectIds.length > 0){
						Utils.selectShape(selectIds);
					}
				}else if(Utils.selectIds.indexOf(shapeId) < 0){
					Utils.unselect();
					Utils.selectShape(shapeId);
				}
				$(document).bind("mouseup.select", function(){
					Designer.op.resetState();
					canvas.unbind("mousedown.select");
					$(document).unbind("mouseup.select");
				});
			});
		},
        isMetaKey: false,
        /**
		 * 形状拖动
		 */
		shapeDraggable: function(){
			var canvas = $("#designer_canvas");
			var container = $("#canvas_container");
			canvas.bind("mousedown.drag", function(downE){
				Utils.hideLinkerCursor();
				Utils.hideLinkerControls();
                Designer.op.changeState("dragging");
                




				//初始坐标，要取相对画布的坐标
				var begin = Utils.getRelativePos(downE.pageX, downE.pageY, canvas);
				var selected = Utils.getSelected();
                
                



                //拖动图形时，是否显示对齐线
                // var snap = true;
                var snap = false;
				if(selected.length == 1 && selected[0].name == "linker"){
					snap = false;
				}
				var bounding = null;
				if(snap){
					bounding = Utils.getShapesBounding(selected);
                }


				//先获取形状的家族图形，一起移动，父级、子级、兄弟
				var familyShapes = Utils.getFamilyShapes(selected);
				selected = selected.concat(familyShapes);
                
                //获取包含的图形，一起移动
				var containedShapes = Utils.getContainedShapes(selected);
                selected = selected.concat(containedShapes);
                
				//获取吸附的图形，一起移动
				var attachedShapes = Utils.getAttachedShapes(selected);
				selected = selected.concat(attachedShapes);
                
                var exclude = []; //对齐时需要排除的id
				if(snap){
					for(var i = 0; i < selected.length; i++){
						var shape = selected[i];
						if(shape.name == "linker"){
							if(shape.from.id && exclude.indexOf(shape.from.id) < 0){
								exclude.push(shape.from.id);
							}
							if(shape.to.id && exclude.indexOf(shape.to.id) < 0){
								exclude.push(shape.to.id);
							}
						}
						if(exclude.indexOf(shape.id) < 0){
							exclude.push(shape.id);
						}
					}
                }

				//获取选中形状上的连接线
				var outlinkers = Utils.getOutlinkers(selected);
                selected = selected.concat(outlinkers);

                var selectedShape = selected;
                // console.log("Frida Test selectedShape", selectedShape)






				container.bind("mousemove.drag", function(moveE){
					$("#link_spot").hide();
					UI.hideShapeOptions();
					var now = Utils.getRelativePos(moveE.pageX, moveE.pageY, canvas);
					//计算和开始时候的偏移量
					var offset = {
						x: now.x - begin.x, y: now.y - begin.y
					};
					if(snap){
						var copy = Utils.copy(bounding);
						copy.x += offset.x;
						copy.y += offset.y;
						var snaped = Designer.op.snapLine(copy, exclude);
						offset = {
							x: copy.x - bounding.x, y: copy.y - bounding.y 
						};
						now = {
							x: begin.x + offset.x, y: begin.y + offset.y
						};
						bounding.x += offset.x;
						bounding.y += offset.y;
						if(selectedShape.length == 1 && selectedShape[0].groupName == "boundaryEvent"){
							if(snaped.attach){
								selectedShape[0].attachTo = snaped.attach.id;
							}else{
								delete selected[0].attachTo;
							}
						}
					}
					if(offset.x == 0 && offset.y == 0){
						return;
                    }
                    

					Designer.op.moveShape(selected, offset);
                    
                    
                    begin = now;
					//在mousemove里绑定一个mouseup，目的是为了当鼠标发生了拖动之后，才认为是进行了拖动事件
					$(document).unbind("mouseup.drop").bind("mouseup.drop", function(){
						//发生了拖动，修改定义
						Model.updateMulti(selected);
						$(document).unbind("mouseup.drop");
					});
                });
                




				$(document).bind("mouseup.drag", function(){
					UI.showShapeOptions();
					Designer.op.resetState();
					container.unbind("mousemove.drag");
					canvas.unbind("mousedown.drag");
					$(document).unbind("mouseup.drag");
					Designer.op.hideTip();
					Designer.op.hideSnapLine();
					Utils.showLinkerCursor();
					Utils.showLinkerControls();
				});
			});
		},
        shapeDraggable_deprecated: function() {
            var c = $("#designer_canvas");
            var b = $("#canvas_container");
            var a = false;
            c.bind("mousedown.drag", function(f) {
                Utils.hideLinkerCursor();
                Utils.hideLinkerControls();
                Designer.op.changeState("dragging");
                var t = Utils.getSelected();
                var w = Utils.getRelativePos(f.pageX, f.pageY, c);
                var s = true;
                if (t.length == 1 && t[0].name == "linker") {
                    s = false
                }
                var l = null;
                if (s) {
                    l = Utils.getShapesBounding(t)
                }
                var q = Utils.getFamilyShapes(t);
                t = t.concat(q);
                var n = Utils.getContainedShapes(t);
                t = t.concat(n);
                var z = Utils.getAttachedShapes(t);
                t = t.concat(z);
                var j = Utils.getCollapsedShapes(t);
                t = t.concat(j);
                var d = [];
                if (s) {
                    for (var v = 0; v < t.length; v++) {
                        var h = t[v];
                        if (h.name == "linker") {
                            if (h.from.id && d.indexOf(h.from.id) < 0) {
                                d.push(h.from.id)
                            }
                            if (h.to.id && d.indexOf(h.to.id) < 0) {
                                d.push(h.to.id)
                            }
                        }
                        if (d.indexOf(h.id) < 0) {
                            d.push(h.id)
                        }
                    }
                }
                var y = t;
                if (t.length == 0) {
                    c.unbind("mousedown.drag");
                    return
                }
                var e = Utils.getOutlinkers(t);
                t = t.concat(e);
                var u = [];
                for (var x = 0; x < t.length; x++) {
                    var h = t[x];
                    u.push(h.id)
                }
                var g = Model.define.page.width.toScale();
                var m = Model.define.page.height.toScale();
                var k = y[0].props.w;
                var p = y[0].props.h;
                Designer.op.initScrollPos();
                var r = f.pageX
                  , o = f.pageY;
                b.bind("mousemove.drag", function(D) {
                    if ((Designer.op.isMetaKey || D.ctrlKey) && (Math.abs(D.pageX - r) > 6 || Math.abs(D.pageY - o) > 6)) {
                        if (a == false) {
                            Designer.clipboard.copy();
                            Designer.clipboard.paste();
                            t = Utils.getSelected();
                            a = true
                        }
                    }
                    UI.hideShapeOptions();
                    var C = Utils.getRelativePos(D.pageX, D.pageY, c);
                    var F = {
                        x: C.x - w.x,
                        y: C.y - w.y
                    };
                    var i = null;
                    if (s) {
                        var G = Utils.copy(l);
                        G.x += F.x;
                        G.y += F.y;
                        var E = Designer.op.snapLine(G, d);
                        F = {
                            x: G.x - l.x,
                            y: G.y - l.y
                        };
                        C = {
                            x: w.x + F.x,
                            y: w.y + F.y
                        };
                        l.x += F.x;
                        l.y += F.y;
                        if (y.length == 1 && y[0].groupName == "boundaryEvent") {
                            if (E.attach) {
                                y[0].attachTo = E.attach.id
                            } else {
                                delete t[0].attachTo
                            }
                        }
                        if (E.container) {
                            i = E.container
                        }
                    }
                    if (F.x == 0 && F.y == 0) {
                        return
                    }
                    for (var B = 0; B < t.length; B++) {
                        var A = t[B];
                        if (A.name == "linker") {
                            continue
                        } else {
                            if (A.container && u.indexOf(A.container) >= 0) {
                                continue
                            }
                        }
                        if (i) {
                            A.container = i.id
                        } else {
                            delete A.container
                        }
                    }
                    Designer.op.moveShape(t, F);
                    w = C;
                    $(document).unbind("mouseup.drop").bind("mouseup.drop", function() {
                        Model.updateMulti(t);
                        $(document).unbind("mouseup.drop")
                    });
                    Designer.op.isScroll(D.pageX, D.pageY)
                });
                $(document).bind("mouseup.drag", function() {
                    Designer.op.isMetaKey = false;
                    a = false;
                    UI.showShapeOptions();
                    Designer.op.resetState();
                    b.unbind("mousemove.drag");
                    c.unbind("mousedown.drag");
                    $(document).unbind("mouseup.drag");
                    Designer.op.hideTip();
                    Designer.op.hideSnapLine();
                    Utils.showLinkerCursor();
                    Utils.showLinkerControls();
                    if (Model.define.page.orientation == "portrait" && Designer.config.scale == 1) {
                        if (w.x + k / 2 > g) {
                            Designer.setPageStyle({
                                width: g + 120
                            })
                        }
                        if (w.y + p / 2 > m) {
                            Designer.setPageStyle({
                                height: m + 120
                            })
                        }
                    }
                    Designer.op.stopScroll()
                })
            })
        },
        changeSpacing: function(n, c) {
            var j = Utils.getSelectedIds();
            var r = Utils.getSelected();
            Utils.hideLinkerCursor();
            var l = $("#canvas_container");
            var f = $("#designer_canvas");
            var q = Utils.getControlBox(j);
            var y = n.attr("resizeDir");
            var x = {};
            if (y.indexOf("l") >= 0) {
                x.x = q.x + q.w
            } else {
                if (y.indexOf("r") >= 0) {
                    x.x = q.x
                } else {
                    x.x = q.x + q.w / 2
                }
            }
            if (y.indexOf("t") >= 0) {
                x.y = q.y + q.h
            } else {
                if (y.indexOf("b") >= 0) {
                    x.y = q.y
                } else {
                    x.y = q.y + q.h / 2
                }
            }
            function v(i, C) {
                if (i.id == null) {
                    if (C) {
                        return {
                            type: "box",
                            x: (i.x - q.x) / q.w,
                            y: (i.y - q.y) / q.h
                        }
                    } else {
                        return {
                            type: "fixed"
                        }
                    }
                } else {
                    if (Utils.isSelected(i.id)) {
                        var A = Model.getShapeById(i.id);
                        var B = {
                            x: A.props.x + A.props.w / 2,
                            y: A.props.y + A.props.h / 2
                        };
                        var p = Utils.getRotated(B, i, -A.props.angle);
                        return {
                            type: "shape",
                            x: (p.x - A.props.x) / A.props.w,
                            y: (p.y - A.props.y) / A.props.h
                        }
                    } else {
                        return {
                            type: "fixed"
                        }
                    }
                }
            }
            var h = [];
            var a = {};
            var e = [];
            var z = Utils.getAttachedShapes(r);
            r = r.concat(z);
            var s = [];
            var b = {
                w: 20,
                h: 20
            };
            for (var u = 0; u < r.length; u++) {
                var d = r[u];
                s.push(d.id);
                if (d.parent) {
                    s.push(d.parent)
                }
                if (d.name == "linker") {
                    if (e.indexOf(d.id) == -1) {
                        e.push(d.id)
                    }
                } else {
                    h.push(d);
                    if (d.props.w > b.w) {
                        b.w = d.props.w
                    }
                    if (d.props.h > b.h) {
                        b.h = d.props.h
                    }
                    if (d.attachTo && !Utils.isSelected(d.id)) {
                        a[d.id] = {
                            type: "attached",
                            x: (d.props.x + d.props.w / 2 - q.x) / q.w,
                            y: (d.props.y + d.props.h / 2 - q.y) / q.h
                        }
                    } else {
                        a[d.id] = {
                            x: (d.props.x - q.x) / q.w,
                            y: (d.props.y - q.y) / q.h
                        }
                    }
                    var t = Model.getShapeLinkers(d.id);
                    if (t && t.length > 0) {
                        for (var k = 0; k < t.length; k++) {
                            var o = t[k];
                            if (e.indexOf(o) == -1) {
                                e.push(o)
                            }
                        }
                    }
                }
            }
            for (var u = 0; u < e.length; u++) {
                var o = e[u];
                var m = Model.getShapeById(o);
                h.push(m);
                var r = Utils.isSelected(o);
                a[m.id] = {
                    from: v(m.from, r),
                    to: v(m.to, r)
                }
            }
            var g = n.css("cursor");
            l.css("cursor", g);
            var w = [];
            Designer.events.push("beforeResize", {
                minSize: b,
                shapes: h,
                dir: y
            });
            l.bind("mousemove.resize", function(A) {
                UI.hideShapeOptions();
                w = [];
                var B = Utils.getRelativePos(A.pageX, A.pageY, f);
                B = Utils.restoreScale(B);
                var D = Utils.copy(q);
                if (y.indexOf("r") >= 0) {
                    D.w = B.x - x.x
                } else {
                    if (y.indexOf("l") >= 0) {
                        D.w = x.x - B.x
                    }
                }
                if (y.indexOf("b") >= 0) {
                    D.h = B.y - x.y
                } else {
                    if (y.indexOf("t") >= 0) {
                        D.h = x.y - B.y
                    }
                }
                if (D.w < b.w) {
                    D.w = b.w
                }
                if (D.h < b.h) {
                    D.h = b.h
                }
                if (y.indexOf("l") >= 0) {
                    D.x = x.x - D.w
                }
                if (y.indexOf("t") >= 0) {
                    D.y = x.y - D.h
                }
                Utils.removeAnchors();
                for (var E = 0; E < h.length; E++) {
                    var H = h[E];
                    var G = a[H.id];
                    if (H.name != "linker") {
                        if (G.type == "attached") {
                            H.props.x = D.x + D.w * G.x - H.props.w / 2;
                            H.props.y = D.y + D.h * G.y - H.props.h / 2
                        } else {
                            H.props.x = D.x + D.w * G.x;
                            H.props.y = D.y + D.h * G.y;
                            Designer.painter.renderShape(H);
                            Utils.showAnchors(H)
                        }
                    } else {
                        if (G.from.type == "box") {
                            H.from.x = D.x + D.w * G.from.x;
                            H.from.y = D.y + D.h * G.from.y
                        } else {
                            if (G.from.type == "shape") {
                                var p = Model.getShapeById(H.from.id);
                                var J = {
                                    x: p.props.x + p.props.w * G.from.x,
                                    y: p.props.y + p.props.h * G.from.y
                                };
                                var F = {
                                    x: p.props.x + p.props.w / 2,
                                    y: p.props.y + p.props.h / 2
                                };
                                var C = Utils.getRotated(F, J, p.props.angle);
                                H.from.x = C.x;
                                H.from.y = C.y
                            }
                        }
                        if (G.to.type == "box") {
                            H.to.x = D.x + D.w * G.to.x;
                            H.to.y = D.y + D.h * G.to.y
                        } else {
                            if (G.to.type == "shape") {
                                var p = Model.getShapeById(H.to.id);
                                var J = {
                                    x: p.props.x + p.props.w * G.to.x,
                                    y: p.props.y + p.props.h * G.to.y
                                };
                                var F = {
                                    x: p.props.x + p.props.w / 2,
                                    y: p.props.y + p.props.h / 2
                                };
                                var C = Utils.getRotated(F, J, p.props.angle);
                                H.to.x = C.x;
                                H.to.y = C.y
                            }
                        }
                        Designer.painter.renderLinker(H, true)
                    }
                }
                Designer.painter.drawControls(j);
                var I = "W: " + Math.round(D.w) + "&nbsp;&nbsp;H: " + Math.round(D.h);
                if (D.x != q.x) {
                    I = "X: " + Math.round(D.x) + "&nbsp;&nbsp;Y: " + Math.round(D.y) + "<br/>" + I
                }
                Designer.op.showTip(I);
                $(document).unbind("mouseup.resize_ok").bind("mouseup.resize_ok", function() {
                    if (w.length > 0) {
                        h = h.concat(w)
                    }
                    if (y.indexOf("t") >= 0 || y.indexOf("l") >= 0) {
                        for (var M = 0; M < h.length; M++) {
                            var L = h[M];
                            if (L.attribute && L.attribute.collapsed) {
                                var O = Utils.getCollapsedShapesById(L.id);
                                if (O.length > 0) {
                                    var N = Utils.getOutlinkers(O);
                                    O = O.concat(N);
                                    var K = Model.getPersistenceById(L.id);
                                    var i = L.props.x - K.props.x;
                                    var P = L.props.y - K.props.y;
                                    Designer.op.moveShape(O, {
                                        x: i,
                                        y: P
                                    }, true);
                                    h = h.concat(O)
                                }
                            }
                        }
                        Designer.painter.drawControls(j)
                    }
                    Model.updateMulti(h);
                    $(document).unbind("mouseup.resize_ok")
                })
            });
            $(document).bind("mouseup.resize", function() {
                UI.showShapeOptions();
                l.css("cursor", "default");
                Designer.op.resetState();
                l.unbind("mousemove.resize");
                $(document).unbind("mouseup.resize");
                Designer.op.hideTip();
                Utils.showLinkerCursor();
                Designer.op.hideSnapLine()
            })
        },
        shapeResizable: function() {
            $(".shape_controller").bind("mousedown", function(c) {
                c.stopPropagation();
                Designer.op.changeState("resizing");
                var j = Utils.getSelectedIds();
                var r = Utils.getSelected();
                if ($("#shape_text_edit").length > 0) {
                    if (r[0].name != "cls" && r[0].name != "interface") {
                        var v = $("#shape_text_edit").val();
                        r[0].textBlock[0].text = v
                    }
                }
                Utils.hideLinkerCursor();
                var l = $("#canvas_container");
                var f = $("#designer_canvas");
                var n = $(this);
                var q;
                if (j.length == 1) {
                    var d = Model.getShapeById(j[0]);
                    q = Utils.copy(d.props)
                } else {
                    q = Utils.getControlBox(j);
                    q.angle = 0
                }
                var z = {
                    x: q.x + q.w / 2,
                    y: q.y + q.h / 2
                };
                var A = n.attr("resizeDir");
                var y = {};
                if (A.indexOf("l") >= 0) {
                    y.x = q.x + q.w
                } else {
                    if (A.indexOf("r") >= 0) {
                        y.x = q.x
                    } else {
                        y.x = q.x + q.w / 2
                    }
                }
                if (A.indexOf("t") >= 0) {
                    y.y = q.y + q.h
                } else {
                    if (A.indexOf("b") >= 0) {
                        y.y = q.y
                    } else {
                        y.y = q.y + q.h / 2
                    }
                }
                y = Utils.getRotated(z, y, q.angle);
                function w(i, E) {
                    if (i.id == null) {
                        if (E) {
                            return {
                                type: "box",
                                x: (i.x - q.x) / q.w,
                                y: (i.y - q.y) / q.h
                            }
                        } else {
                            return {
                                type: "fixed"
                            }
                        }
                    } else {
                        if (Utils.isSelected(i.id)) {
                            var C = Model.getShapeById(i.id);
                            var D = {
                                x: C.props.x + C.props.w / 2,
                                y: C.props.y + C.props.h / 2
                            };
                            var p = Utils.getRotated(D, i, -C.props.angle);
                            return {
                                type: "shape",
                                x: (p.x - C.props.x) / C.props.w,
                                y: (p.y - C.props.y) / C.props.h
                            }
                        } else {
                            return {
                                type: "fixed"
                            }
                        }
                    }
                }
                var h = [];
                var b = {};
                var e = [];
                var B = Utils.getAttachedShapes(r);
                r = r.concat(B);
                var s = [];
                for (var u = 0; u < r.length; u++) {
                    var d = r[u];
                    s.push(d.id);
                    if (d.parent) {
                        s.push(d.parent)
                    }
                    if (d.name == "linker") {
                        if (e.indexOf(d.id) == -1) {
                            e.push(d.id)
                        }
                    } else {
                        h.push(d);
                        if (d.attachTo && !Utils.isSelected(d.id)) {
                            b[d.id] = {
                                type: "attached",
                                x: (d.props.x + d.props.w / 2 - q.x) / q.w,
                                y: (d.props.y + d.props.h / 2 - q.y) / q.h
                            }
                        } else {
                            b[d.id] = {
                                x: (d.props.x - q.x) / q.w,
                                y: (d.props.y - q.y) / q.h,
                                w: d.props.w / q.w,
                                h: d.props.h / q.h
                            }
                        }
                        var t = Model.getShapeLinkers(d.id);
                        if (t && t.length > 0) {
                            for (var k = 0; k < t.length; k++) {
                                var o = t[k];
                                if (e.indexOf(o) == -1) {
                                    e.push(o)
                                }
                            }
                        }
                    }
                }
                for (var u = 0; u < e.length; u++) {
                    var o = e[u];
                    var m = Model.getShapeById(o);
                    h.push(m);
                    var r = Utils.isSelected(o);
                    b[m.id] = {
                        from: w(m.from, r),
                        to: w(m.to, r)
                    }
                }
                var g = n.css("cursor");
                l.css("cursor", g);
                var x = [];
                var a = {
                    w: 20,
                    h: 20
                };
                Designer.events.push("beforeResize", {
                    minSize: a,
                    shapes: h,
                    dir: A
                });
                l.bind("mousemove.resize", function(X) {
                    UI.hideShapeOptions();
                    x = [];
                    var G = Utils.getRelativePos(X.pageX, X.pageY, f);
                    G = Utils.restoreScale(G);
                    var O = Utils.getRotated(y, G, -q.angle);
                    var D = Utils.copy(q);
                    if (A.indexOf("r") >= 0) {
                        D.w = O.x - y.x
                    } else {
                        if (A.indexOf("l") >= 0) {
                            D.w = y.x - O.x
                        }
                    }
                    if (A.indexOf("b") >= 0) {
                        D.h = O.y - y.y
                    } else {
                        if (A.indexOf("t") >= 0) {
                            D.h = y.y - O.y
                        }
                    }
                    if (X.ctrlKey && A.length == 2) {
                        if (q.w >= q.h) {
                            D.h = q.h / q.w * D.w;
                            if (D.h < a.h) {
                                D.h = a.h;
                                D.w = q.w / q.h * D.h
                            }
                        } else {
                            D.w = q.w / q.h * D.h;
                            if (D.w < a.w) {
                                D.w = a.w;
                                D.h = q.h / q.w * D.w
                            }
                        }
                    } else {
                        if (D.w < a.w) {
                            D.w = a.w
                        }
                        if (D.h < a.h) {
                            D.h = a.h
                        }
                    }
                    var U = {};
                    if (A.indexOf("r") >= 0) {
                        U.x = y.x + D.w
                    } else {
                        if (A.indexOf("l") >= 0) {
                            U.x = y.x - D.w
                        } else {
                            U.x = y.x
                        }
                    }
                    if (A.indexOf("b") >= 0) {
                        U.y = y.y + D.h
                    } else {
                        if (A.indexOf("t") >= 0) {
                            U.y = y.y - D.h
                        } else {
                            U.y = y.y
                        }
                    }
                    var K = Utils.getRotated(y, U, q.angle);
                    var M = {
                        x: 0.5 * y.x + 0.5 * K.x,
                        y: 0.5 * y.y + 0.5 * K.y
                    };
                    var S = Utils.getRotated(M, y, -q.angle);
                    if (A.indexOf("r") >= 0) {
                        D.x = S.x
                    } else {
                        if (A.indexOf("l") >= 0) {
                            D.x = S.x - D.w
                        } else {
                            D.x = S.x - D.w / 2
                        }
                    }
                    if (A.indexOf("b") >= 0) {
                        D.y = S.y
                    } else {
                        if (A.indexOf("t") >= 0) {
                            D.y = S.y - D.h
                        } else {
                            D.y = S.y - D.h / 2
                        }
                    }
                    if (D.angle == 0) {
                        var p = h[0];
                        var Q = Designer.op.snapResizeLine(D, s, A)
                    }
                    Utils.removeAnchors();
                    for (var T = 0; T < h.length; T++) {
                        var F = h[T];
                        var P = b[F.id];
                        if (F.name == "linker") {
                            if (P.from.type == "box") {
                                F.from.x = D.x + D.w * P.from.x;
                                F.from.y = D.y + D.h * P.from.y
                            } else {
                                if (P.from.type == "shape") {
                                    var V = Model.getShapeById(F.from.id);
                                    var R = {
                                        x: V.props.x + V.props.w * P.from.x,
                                        y: V.props.y + V.props.h * P.from.y
                                    };
                                    var W = {
                                        x: V.props.x + V.props.w / 2,
                                        y: V.props.y + V.props.h / 2
                                    };
                                    var H = Utils.getRotated(W, R, V.props.angle);
                                    F.from.x = H.x;
                                    F.from.y = H.y
                                }
                            }
                            if (P.to.type == "box") {
                                F.to.x = D.x + D.w * P.to.x;
                                F.to.y = D.y + D.h * P.to.y
                            } else {
                                if (P.to.type == "shape") {
                                    var V = Model.getShapeById(F.to.id);
                                    var R = {
                                        x: V.props.x + V.props.w * P.to.x,
                                        y: V.props.y + V.props.h * P.to.y
                                    };
                                    var W = {
                                        x: V.props.x + V.props.w / 2,
                                        y: V.props.y + V.props.h / 2
                                    };
                                    var H = Utils.getRotated(W, R, V.props.angle);
                                    F.to.x = H.x;
                                    F.to.y = H.y
                                }
                            }
                            Designer.painter.renderLinker(F, true)
                        } else {
                            if (P.type == "attached") {
                                F.props.x = D.x + D.w * P.x - F.props.w / 2;
                                F.props.y = D.y + D.h * P.y - F.props.h / 2
                            } else {
                                var C = Utils.copy(F.props);
                                F.props.x = D.x + D.w * P.x;
                                F.props.y = D.y + D.h * P.y;
                                F.props.w = D.w * P.w;
                                F.props.h = D.h * P.h;
                                var E = Model.getShapeById(F.id).props;
                                E.x = D.x + D.w * P.x;
                                E.y = D.y + D.h * P.y;
                                E.w = D.w * P.w;
                                E.h = D.h * P.h;
                                var J = {
                                    x: F.props.x - C.x,
                                    y: F.props.y - C.y,
                                    w: F.props.w - C.w,
                                    h: F.props.h - C.h
                                };
                                var N = {
                                    shape: F,
                                    offset: J,
                                    dir: A
                                };
                                var L = Designer.events.push("resizing", N);
                                if (L) {
                                    x = x.concat(L)
                                }
                            }
                            Designer.painter.renderShape(F);
                            Utils.showAnchors(F)
                        }
                    }
                    Designer.painter.drawControls(j);
                    var I = "W: " + Math.round(D.w) + "&nbsp;&nbsp;H: " + Math.round(D.h);
                    if (D.x != q.x) {
                        I = "X: " + Math.round(D.x) + "&nbsp;&nbsp;Y: " + Math.round(D.y) + "<br/>" + I
                    }
                    Designer.op.showTip(I);
                    $(document).unbind("mouseup.resize_ok").bind("mouseup.resize_ok", function() {
                        if (x.length > 0) {
                            h = h.concat(x)
                        }
                        if (A.indexOf("t") >= 0 || A.indexOf("l") >= 0) {
                            for (var aa = 0; aa < h.length; aa++) {
                                var Z = h[aa];
                                if (Z.attribute && Z.attribute.collapsed) {
                                    var ac = Utils.getCollapsedShapesById(Z.id);
                                    if (ac.length > 0) {
                                        var ab = Utils.getOutlinkers(ac);
                                        ac = ac.concat(ab);
                                        var Y = Model.getPersistenceById(Z.id);
                                        var i = Z.props.x - Y.props.x;
                                        var ad = Z.props.y - Y.props.y;
                                        Designer.op.moveShape(ac, {
                                            x: i,
                                            y: ad
                                        }, true);
                                        h = h.concat(ac)
                                    }
                                }
                            }
                            Designer.painter.drawControls(j)
                        }
                        Model.updateMulti(h);
                        $(document).unbind("mouseup.resize_ok")
                    })
                });
                $(document).bind("mouseup.resize", function() {
                    UI.showShapeOptions();
                    l.css("cursor", "default");
                    Designer.op.resetState();
                    l.unbind("mousemove.resize");
                    $(document).unbind("mouseup.resize");
                    Designer.op.hideTip();
                    Utils.showLinkerCursor();
                    Designer.op.hideSnapLine()
                })
            })
        },
        shapeRotatable: function() {
            $(".shape_rotater").bind("mousemove", function(d) {
                var c = $(this);
                var a = d.pageX - c.offset().left;
                var f = d.pageY - c.offset().top;
                var b = c[0].getContext("2d");
                c.unbind("mousedown");
                c.removeClass("rotate_enable");
                if (b.isPointInPath(a, f)) {
                    c.addClass("rotate_enable");
                    c.bind("mousedown", function(p) {
                        Utils.hideLinkerCursor();
                        if ($("#shape_text_edit").length) {
                            $("#shape_text_edit").trigger("blur")
                        }
                        p.stopPropagation();
                        Designer.op.changeState("rotating");
                        var l = Utils.getSelectedIds();
                        var o;
                        var k;
                        if (l.length == 1) {
                            var m = Model.getShapeById(l[0]);
                            o = m.props;
                            k = m.props.angle
                        } else {
                            o = Utils.getControlBox(l);
                            k = 0
                        }
                        var e = {
                            x: o.x + o.w / 2,
                            y: o.y + o.h / 2
                        };
                        var n = Utils.toScale(e);
                        var g = $("#designer_canvas");
                        var i = Utils.getSelected();
                        var j = Utils.getAttachedShapes(i);
                        i = i.concat(j);
                        var q = Utils.getOutlinkers(i);
                        i = i.concat(q);
                        var h = k;
                        $(document).bind("mousemove.rotate", function(r) {
                            UI.hideShapeOptions();
                            var C = Utils.getRelativePos(r.pageX, r.pageY, g);
                            var v = Math.atan(Math.abs(C.x - n.x) / Math.abs(n.y - C.y));
                            if (C.x >= n.x && C.y >= n.y) {
                                v = Math.PI - v
                            } else {
                                if (C.x <= n.x && C.y >= n.y) {
                                    v = Math.PI + v
                                } else {
                                    if (C.x <= n.x && C.y <= n.y) {
                                        v = Math.PI * 2 - v
                                    }
                                }
                            }
                            v = v % (Math.PI * 2);
                            var D = Math.PI / 36;
                            var A = Math.round(v / D);
                            v = D * A;
                            if (v == h) {
                                return
                            }
                            h = v;
                            Designer.op.showTip(A * 5 % 360 + "°");
                            Designer.painter.rotateControls(o, v);
                            Utils.removeAnchors();
                            var E = v - k;
                            for (var w = 0; w < i.length; w++) {
                                var y = i[w];
                                var u = Model.getPersistenceById(y.id);
                                if (y.name != "linker") {
                                    y.props.angle = Math.abs((E + u.props.angle) % (Math.PI * 2));
                                    var x = {
                                        x: u.props.x + u.props.w / 2,
                                        y: u.props.y + u.props.h / 2
                                    };
                                    var B = Utils.getRotated(e, x, E);
                                    y.props.x = B.x - y.props.w / 2;
                                    y.props.y = B.y - y.props.h / 2;
                                    Designer.painter.renderShape(y);
                                    Utils.showAnchors(y)
                                } else {
                                    var z = false;
                                    if ((Utils.isSelected(y.id) && y.from.id == null) || Utils.isSelected(y.from.id)) {
                                        var s = Utils.getRotated(e, u.from, E);
                                        y.from.x = s.x;
                                        y.from.y = s.y;
                                        if (y.from.angle != null) {
                                            y.from.angle = Math.abs((u.from.angle + E) % (Math.PI * 2))
                                        }
                                        z = true
                                    }
                                    var t = false;
                                    if ((Utils.isSelected(y.id) && y.to.id == null) || Utils.isSelected(y.to.id)) {
                                        var s = Utils.getRotated(e, u.to, E);
                                        y.to.x = s.x;
                                        y.to.y = s.y;
                                        if (y.to.angle != null) {
                                            y.to.angle = Math.abs((u.to.angle + E) % (Math.PI * 2))
                                        }
                                        t = true
                                    }
                                    if (z || t) {
                                        Designer.painter.renderLinker(y, true)
                                    }
                                }
                            }
                        }).bind("mouseup.rotate", function() {
                            UI.showShapeOptions();
                            $(document).unbind("mousemove.rotate").unbind("mouseup.rotate");
                            Designer.op.resetState();
                            Model.updateMulti(i);
                            Designer.painter.drawControls(l);
                            Designer.op.hideTip();
                            Utils.showLinkerCursor()
                        })
                    })
                } else {
                    c.removeClass("rotate_enable");
                    c.unbind("mousedown")
                }
            })
        },
        groupShapeChangable: function() {
            $(".change_shape_icon").bind("mousedown", function(f) {
                f.stopPropagation();
                var a = Utils.getSelected()[0];
                var h = a.groupName;
                var d = $(this).parent();
                var g = d.position();
                var c = g.left + d.width();
                var b = g.top + d.height() + 10;
                Designer.op.groupDashboard(h, c, b, function(e) {
                    if (a.name != e) {
                        var i = Designer.events.push("shapeChanged", {
                            shape: a,
                            name: e
                        });
                        Model.changeShape(a, e);
                        var j = [a];
                        if (i && i.length > 0) {
                            j = j.concat(i)
                        }
                        Model.updateMulti(j)
                    }
                })
            })
        },
        shapeMultiSelectable: function() {
            var a = $("#designer_canvas");
            var b = $("#designer_layout");
            b.unbind("mousedown.multiselect").bind("mousedown.multiselect", function(e) {
                var d = null;
                if (!e.ctrlKey) {
                    Utils.unselect()
                }
                var c = Utils.getRelativePos(e.pageX, e.pageY, a);
                Designer.op.changeState("multi_selecting");
                b.bind("mousemove.multiselect", function(g) {
                    if (d == null) {
                        d = $("<div id='selecting_box'></div>").appendTo(a)
                    }
                    var f = Utils.getRelativePos(g.pageX, g.pageY, a);
                    var h = {
                        "z-index": Model.orderList.length,
                        left: f.x,
                        top: f.y
                    };
                    if (f.x > c.x) {
                        h.left = c.x
                    }
                    if (f.y > c.y) {
                        h.top = c.y
                    }
                    h.width = Math.abs(f.x - c.x);
                    h.height = Math.abs(f.y - c.y);
                    d.css(h)
                });
                $(document).unbind("mouseup.multiselect").bind("mouseup.multiselect", function(h) {
                    if (d != null) {
                        var f = {
                            x: d.position().left.restoreScale(),
                            y: d.position().top.restoreScale(),
                            w: d.width().restoreScale(),
                            h: d.height().restoreScale()
                        };
                        var i = Utils.getShapesByRange(f);
                        if (h.ctrlKey) {
                            var g = Utils.getSelectedIds();
                            Utils.mergeArray(i, g)
                        }
                        Utils.unselect();
                        Utils.selectShape(i);
                        d.remove()
                    }
                    Designer.op.resetState();
                    $(document).unbind("mouseup.multiselect");
                    b.unbind("mousemove.multiselect")
                });
                b.unbind("mousedown.multiselect")
            })
        },
        shapeEditable: function(a) {
            var b = $("#designer_canvas");
            b.unbind("dblclick.edit").bind("dblclick.edit", function(c) {
                b.unbind("dblclick.edit");
                var d = Utils.getRelativePos(c.pageX, c.pageY, b);
                Designer.op.editShapeText(a, d)
            })
        },
        editShapeText: function(a, h) {
            if (a.name == "linker") {
                this.editLinkerText(a);
                return
            }
            if (!a.textBlock || a.textBlock.length == 0) {
                return
            }
            var g = a.getTextBlock();
            var j = 0;
            if (h) {
                h.x = h.x.restoreScale();
                h.y = h.y.restoreScale();
                if (a.props.angle != 0) {
                    var s = {
                        x: a.props.x + a.props.w / 2,
                        y: a.props.y + a.props.h / 2
                    };
                    h = Utils.getRotated(s, h, -a.props.angle)
                }
                var f = h.x - a.props.x;
                var e = h.y - a.props.y;
                for (var o = 0; o < g.length; o++) {
                    var l = g[o];
                    if (Utils.pointInRect(f, e, l.position)) {
                        j = o;
                        break
                    }
                }
            }
            Designer.contextMenu.hide();
            var n = $("#shape_text_edit");
            if (n.length == 0) {
                n = $("<textarea id='shape_text_edit'></textarea>").appendTo("#designer_canvas")
            }
            var m = $("#shape_text_ruler");
            if (m.length == 0) {
                m = $("<textarea id='shape_text_ruler'></textarea>").appendTo("#designer_canvas")
            }
            $(".text_canvas[forshape=" + a.id + "][ind=" + j + "]").hide();
            var r = g[j];
            var t = a.textBlock[j];
            var b = Utils.getShapeFontStyle(a.fontStyle);
            b = $.extend({}, b, r.fontStyle);
            var p = r.position;
            if (b.orientation == "horizontal") {
                var k = {
                    x: p.x + p.w / 2,
                    y: p.y + p.h / 2
                };
                p = {
                    x: k.x - p.h / 2,
                    y: k.y - p.w / 2,
                    w: p.h,
                    h: p.w
                }
            }
            var q = {
                width: p.w + "px",
                "z-index": Model.orderList.length + 2,
                "line-height": Math.round(b.size * 1.25) + "px",
                "font-size": b.size + "px",
                "font-family": b.fontFamily,
                "font-weight": b.bold ? "bold" : "normal",
                "font-style": b.italic ? "italic" : "normal",
                "text-align": b.textAlign,
                color: "rgb(" + b.color + ")",
                "text-decoration": b.underline ? "underline" : "none"
            };
            n.css(q);
            m.css(q);
            n.show();
            p.x += a.props.x;
            p.y += a.props.y;
            n.val(r.text);
            var d = 0;
            $("#shape_text_edit").unbind().bind("keyup", function() {
                var B = $(this).val();
                m.val(B);
                m.scrollTop(99999);
                d = m.scrollTop();
                n.css({
                    height: d
                });
                var v = {
                    x: p.x + p.w / 2,
                    y: p.y + p.h / 2
                };
                var w = 0;
                var y = 0;
                var D = p.h;
                if (b.vAlign == "middle") {
                    if (d > D) {
                        D = d;
                        w = (v.y - D / 2);
                        y = 0
                    } else {
                        w = (v.y - p.h / 2);
                        y = (p.h - d) / 2;
                        D = p.h - y
                    }
                } else {
                    if (b.vAlign == "bottom") {
                        if (d > D) {
                            D = d;
                            w = (v.y + p.h / 2 - D);
                            y = 0
                        } else {
                            w = (v.y - p.h / 2);
                            y = p.h - d;
                            D = p.h - y
                        }
                    } else {
                        w = (v.y - p.h / 2);
                        y = 0;
                        if (d > D) {
                            D = d
                        } else {
                            D = p.h
                        }
                    }
                }
                var C = y + D;
                var A = {
                    x: p.x + p.w / 2,
                    y: w + C / 2
                };
                var z = a.props.angle;
                if (z != 0) {
                    var i = {
                        x: a.props.x + a.props.w / 2,
                        y: a.props.y + a.props.h / 2
                    };
                    A = Utils.getRotated(i, A, z)
                }
                if (b.orientation == "horizontal") {
                    z = (Math.PI * 1.5 + z) % (Math.PI * 2)
                }
                var u = Math.round(z / (Math.PI * 2) * 360);
                var x = "rotate(" + u + "deg) scale(" + Designer.config.scale + ")";
                n.css({
                    width: p.w,
                    height: D,
                    "padding-top": y,
                    left: A.x.toScale() - p.w / 2 - 2,
                    top: A.y.toScale() - C / 2 - 2,
                    "-webkit-transform": x,
                    "-ms-transform": x,
                    "-o-transform": x,
                    "-moz-transform": x,
                    transform: x
                })
            }).bind("keydown", function(w) {
                var i = $(this);
                if (w.keyCode == 13 && w.ctrlKey) {
                    c();
                    return false
                } else {
                    if (w.keyCode == 27) {
                        i.unbind().remove();
                        $(".text_canvas[forshape=" + a.id + "][ind=" + j + "]").show()
                    } else {
                        if (w.keyCode == 66 && w.ctrlKey) {
                            var u = !b.bold;
                            if (a.textBlock.length == 1) {
                                a.fontStyle.bold = u
                            } else {
                                t.fontStyle = $.extend(t.fontStyle, {
                                    bold: u
                                })
                            }
                            b.bold = u;
                            Model.update(a);
                            var v = u ? "bold" : "normal";
                            $(this).css("font-weight", v);
                            m.css("font-weight", v);
                            UI.update();
                            w.preventDefault()
                        } else {
                            if (w.keyCode == 73 && w.ctrlKey) {
                                var u = !b.italic;
                                if (a.textBlock.length == 1) {
                                    a.fontStyle.italic = u
                                } else {
                                    t.fontStyle = $.extend(t.fontStyle, {
                                        italic: u
                                    })
                                }
                                b.italic = u;
                                Model.update(a);
                                var v = u ? "italic" : "normal";
                                $(this).css("font-style", v);
                                m.css("font-style", v);
                                UI.update();
                                w.preventDefault()
                            } else {
                                if (w.keyCode == 85 && w.ctrlKey) {
                                    var u = !b.underline;
                                    if (a.textBlock.length == 1) {
                                        a.fontStyle.underline = u
                                    } else {
                                        t.fontStyle = $.extend(t.fontStyle, {
                                            underline: u
                                        })
                                    }
                                    b.underline = u;
                                    Model.update(a);
                                    var v = u ? "underline" : "none";
                                    $(this).css("text-decoration", v);
                                    m.css("text-decoration", v);
                                    w.preventDefault();
                                    UI.update();
                                    w.preventDefault()
                                }
                            }
                        }
                    }
                }
            }).bind("blur", function(i) {
                c()
            }).bind("mousemove", function(i) {
                i.stopPropagation()
            }).bind("mousedown", function(i) {
                i.stopPropagation()
            }).bind("mouseenter", function(i) {
                Designer.op.destroy()
            });
            $("#shape_text_edit").trigger("keyup");
            n.select();
            function c() {
                var i = $("#shape_text_edit").val();
                if ($("#shape_text_edit").length && $("#shape_text_edit").is(":visible")) {
                    if (i != t.text) {
                        t.text = i;
                        if (a.name == "interface" || a.name == "cls") {
                            Designer.op.shapeChangeHeight(a, j, d, i)
                        }
                        Model.update(a)
                    }
                    Designer.painter.renderShape(a);
                    $("#shape_text_edit").remove()
                }
            }
        },
        shapeReplace: function(c, d) {
            var b = Schema.shapes[c];
            var a = Utils.copy(Model.getShapeById(d));
            Model.changeShape(a, c);
            Model.update(a)
        },
        shapeChangeHeight: function(f, d, a, i) {
            if (f.name == "interface") {
                if (d == 1) {
                    a = a < 30 ? 30 : a;
                    var b = f.props.h - f.textBlock[0].position.h;
                    f.props.h += a - b
                } else {
                    if (d == 0) {
                        a = a < 30 ? 30 : a;
                        var c = "h-" + a;
                        f.props.h += (a - f.path[1].actions[0].y);
                        f.path[1].actions[0].y = a;
                        f.path[1].actions[1].y = a;
                        f.textBlock[0].position.h = a;
                        f.textBlock[1].position.y = a;
                        f.textBlock[1].position.h = c
                    }
                }
                Schema.initShapeFunctions(f)
            } else {
                if (f.name == "cls") {
                    var h = Number(f.textBlock[0].position.h);
                    var g = f.textBlock[1].position.h + "";
                    var e = f.textBlock[2].position.h + "";
                    if (g.indexOf("h") >= 0) {
                        g = (f.props.h - h) / 2
                    }
                    if (e.indexOf("h") >= 0) {
                        e = (f.props.h - h) / 2
                    }
                    g = Number(g);
                    e = Number(e);
                    a = a < 30 ? 30 : a;
                    if (d == 0) {
                        var j = a - h;
                        if (j == 0) {
                            return
                        }
                        f.props.h = a + g + e;
                        f.textBlock[0].position.h = a;
                        f.textBlock[1].position.y = a;
                        f.textBlock[1].position.h = (f.props.h - a) / 2;
                        f.textBlock[2].position.y = (f.props.h - a) / 2 + a;
                        f.textBlock[2].position.h = (f.props.h - a) / 2;
                        f.path[1].actions[0].y = a;
                        f.path[1].actions[1].y = a;
                        f.path[1].actions[2].y = f.props.h / 2 + a / 2;
                        f.path[1].actions[3].y = f.props.h / 2 + a / 2
                    }
                    if (d == 1) {
                        var j = a - g;
                        if (j == 0) {
                            return
                        }
                        f.props.h += j;
                        f.textBlock[1].position.h = a;
                        f.textBlock[1].position.y = h;
                        f.textBlock[2].position.y = h + a + 2;
                        f.textBlock[2].position.h = f.props.h - a - h;
                        f.path[1].actions[0].y = h;
                        f.path[1].actions[1].y = h;
                        f.path[1].actions[2].y = h + a + 2;
                        f.path[1].actions[3].y = h + a + 2
                    } else {
                        if (d == 2) {
                            var j = a - e;
                            if (j == 0) {
                                return
                            }
                            f.props.h = a + g + h;
                            f.textBlock[1].position.h = g;
                            f.path[1].actions[2].y = h + g;
                            f.path[1].actions[3].y = h + g;
                            f.textBlock[2].position.y = Number(h) + Number(g);
                            f.textBlock[2].position.h = a
                        }
                    }
                    Schema.initShapeFunctions(f)
                }
            }
        },
        shapeLinkable: function(shape, linkPoint){
			var canvas = $("#designer_canvas");
			var container = $("#canvas_container");
			container.unbind("mousedown.link").bind("mousedown.link", function(downE){
				Designer.op.changeState("linking_from_shape");
				var linkCanvas = null;
				var createdLinker = null;
				var from;
				if(!shape){
					//当不存在shape的情况，为创建自由连接线
					var pos = Utils.getRelativePos(downE.pageX, downE.pageY, canvas);
					from = {
						x: pos.x.restoreScale(),
						y: pos.y.restoreScale(),
						id: null,
						angle: null
					};
				}else{
					from = linkPoint;
					from.id = shape.id;
				}
				//计算连接点的角度
				container.bind("mousemove.link", function(moveE){
                    // console.log('Frida Test1');


					container.css("cursor", "default");
                    var now = Utils.getRelativePos(moveE.pageX, moveE.pageY, canvas);

					if(createdLinker == null){
                        createdLinker = createLinker(from, now);
						Designer.events.push("linkerCreating", createdLinker);
                    }
                    

                    Designer.op.moveLinker(createdLinker, "to", now.x, now.y);
                    






					//在mousemove里绑定一个mouseup，目的是为了当鼠标发生了拖动之后，才认为是进行了拖动事件
					$(document).unbind("mouseup.droplinker").bind("mouseup.droplinker", function(){
						//发生了拖动，修改定义
						if(Math.abs(now.x - from.x) > 20 || Math.abs(now.y - from.y) > 20){
							Model.add(createdLinker);
							Designer.events.push("linkerCreated", createdLinker);
							//连线创建后，是否应该选中
//							Utils.unselect();
//							Utils.selectShape(createdLinker.id);
							if(createdLinker.to.id == null && createdLinker.from.id != null){
								//如果创建的连接线，终点没有连接形状，则显示出画板
								Designer.op.linkDashboard(createdLinker);
							}
							Utils.showLinkerCursor();
						}else{
							//拖动没超过20*20，删除
							$("#" + createdLinker.id).remove();
						}
						$(document).unbind("mouseup.droplinker");
					});
				});
				$(document).bind("mouseup.link", function(){
					Designer.op.hideLinkPoint();
					Designer.op.resetState();
					container.unbind("mousedown.link");
					container.unbind("mousemove.link");
					$(document).unbind("mouseup.link");
				});
			});
			
			/**
			 * 创建形状
			 * @param schemaName
			 * @param centerX
			 * @param centerY
			 * @returns
			 */
			function createLinker(from, to){
				var newId = Utils.newId();
				var linker = Utils.copy(Schema.linkerDefaults);
				linker.from = from;
				linker.to = {
					id: null,
					x: to.x,
					y: to.y,
					angle: null
				};
				linker.props = {
					zindex: Model.maxZIndex + 1
				};
				linker.id = newId;
				return linker;
			}
		},
        /**
		 * 编辑连接线文本
		 * @param {} linker
		 */
		linkerEditable: function(linker){
			var canvas = $("#designer_canvas");
			canvas.unbind("dblclick.edit_linker").bind("dblclick.edit_linker", function(){
				Designer.op.editLinkerText(linker);
				canvas.unbind("dblclick.edit_linker");
			});
		},
        /**
		 * 编辑连接线的文本
		 */
		editLinkerText: function(linker){
			Designer.contextMenu.hide();
			var midpoint = Designer.painter.getLinkerMidpoint(linker);
			var ruler = $("#" + linker.id).find(".text_canvas");
			var textarea = $("#linker_text_edit");
			if(textarea.length == 0){
				textarea = $("<textarea id='linker_text_edit'></textarea>").appendTo("#designer_canvas");
			}
			//隐藏原有文本，全透明
			$("#" + linker.id).find(".text_canvas").hide();
			var fontStyle = linker.fontStyle;
			var scale = "scale("+Designer.config.scale+")";
			var lineH = Math.round(fontStyle.size * 1.25);
			//先给输入框设置一些基本样式
			textarea.css({
				"z-index": Model.orderList.length,
				"line-height": lineH + "px",
				"font-size": fontStyle.size + "px",
				"font-family": fontStyle.fontFamily,
				"font-weight": fontStyle.bold ? "bold" : "normal",
				"font-style": fontStyle.italic ? "italic" : "normal",
				"text-align": fontStyle.textAlign,
				"color": "rgb(" + fontStyle.color + ")",
				"text-decoration": fontStyle.underline ? "underline" : "none",
				"-webkit-transform": scale,
				"-ms-transform": scale,
				"-o-transform": scale,
				"-moz-transform": scale,
				"transform": scale
			});
			//修改坐标
			textarea.val(linker.text).show().select();
			textarea.unbind().bind("keyup", function(){
				var newText = $(this).val();
				var text = newText.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br/>");
				ruler.html(text + "<br/>");
				var textW = ruler.width();
				if(textW < 50){
					textW = 50;
				}
				var textH = ruler.height();
				if(textH < lineH){
					textH = lineH;
				}
				textarea.css({
					left: midpoint.x.toScale() - textW/2 - 2,
					top: midpoint.y.toScale() - textH/2 - 2,
					width: textW,
					height: textH
				});
			}).bind("mousedown", function(e){
				e.stopPropagation();
			}).bind("keydown", function(e){
				if(e.keyCode == 13 && e.ctrlKey){
					//执行保存
					saveText();
					return false;
				}else if(e.keyCode == 27){
					//Esc取消
					textarea.unbind().remove();
					Designer.painter.renderLinkerText(linker);
				}else if(e.keyCode == 66 && e.ctrlKey){
					//Ctrl + B，加粗
					var newVal = !linker.fontStyle.bold;
					linker.fontStyle.bold = newVal;
					Model.update(linker);
					var css = newVal ? "bold" : "normal";
					$(this).css("font-weight", css);
					ruler.css("font-weight", css);
					UI.update();
				}else if(e.keyCode == 73 && e.ctrlKey){
					//Ctrl + I，斜体
					var newVal = !linker.fontStyle.italic;
					linker.fontStyle.italic = newVal;
					Model.update(linker);
					var css = newVal ? "italic" : "normal";
					$(this).css("font-style", css);
					ruler.css("font-style", css);
					UI.update();
				}else if(e.keyCode == 85 && e.ctrlKey){
					//Ctrl + U，下划线
					var newVal = !linker.fontStyle.underline;
					linker.fontStyle.underline = newVal;
					Model.update(linker);
					var css = newVal ? "underline" : "none";
					$(this).css("text-decoration", css);
					ruler.css("text-decoration", css);
					e.preventDefault();
					UI.update();
				}
			}).bind("blur", function(){
				saveText();
			});
			textarea.trigger("keyup");
			/**
			 * 保存文本
			 */
			function saveText(){
				var textarea = $("#linker_text_edit");
				if(textarea.length && textarea.is(":visible")){
					var newText = textarea.val();
					if(newText != linker.text){
						linker.text = newText;
						Model.update(linker);
					}
					Designer.painter.renderLinker(linker);
					textarea.remove();
				}
				
			}
		},
        linkerDraggable: function(d, a) {
            if (d.locked) {
                return
            }
            var c = $("#designer_canvas");
            var b = $("#canvas_container");
            c.bind("mousedown.draglinker", function(f) {
                Utils.hideLinkerControls();
                Designer.op.changeState("dragging_linker");
                var e = Utils.getSelectedIds();
                var g = false;
                if (e.length > 1) {
                    g = true
                }
                Designer.op.initScrollPos();
                b.bind("mousemove.draglinker", function(i) {
                    b.css("cursor", "default");
                    var h = Utils.getRelativePos(i.pageX, i.pageY, c);
                    Designer.op.moveLinker(d, a, h.x, h.y);
                    if (g) {
                        Designer.painter.drawControls(e)
                    }
                    $(document).unbind("mouseup.droplinker").bind("mouseup.droplinker", function() {
                        $(document).unbind("mouseup.droplinker");
                        Model.update(d);
                        Utils.showLinkerControls();
                        Designer.op.hideSnapLine()
                    });
                    Designer.op.isScroll(i.pageX, i.pageY)
                });
                $(document).bind("mouseup.draglinker", function() {
                    Designer.op.hideLinkPoint();
                    Designer.op.resetState();
                    c.unbind("mousedown.draglinker");
                    b.unbind("mousemove.draglinker");
                    $(document).unbind("mouseup.draglinker");
                    Utils.showLinkerControls();
                    Designer.op.stopScroll()
                })
            })
        },
        linkClickable: function(a, c) {
            var b = $("#link_spot");
            if (b.length == 0) {
                b = $("<a id='link_spot' target='_blank' style='cursor: pointer'></a>").appendTo("#designer_canvas");
                b.bind("dragstart", function() {
                    return false
                })
            }
            if (a.trim().toLowerCase().indexOf("http") == -1) {
                a = "http://" + a
            }
            b.attr("href", a);
            b.show().css({
                left: c.x - 50,
                top: c.y - 50,
                "z-index": Model.orderList.length + 3
            })
        },
        textCreatable: function() {
            var b = $("#designer_canvas");
            var a = $("#canvas_container");
            a.unbind("mousedown.create_text").bind("mousedown.create_text", function(f) {
                var d = null;
                if (!f.ctrlKey) {
                    Utils.unselect()
                }
                var c = Utils.getRelativePos(f.pageX, f.pageY, b);
                var e = null;
                a.bind("mousemove.create_text", function(g) {
                    if (d == null) {
                        d = $("<div id='texting_box'></div>").appendTo(b)
                    }
                    var h = Utils.getRelativePos(g.pageX, g.pageY, b);
                    e = {
                        "z-index": Model.orderList.length,
                        left: h.x - 1,
                        top: h.y - 1
                    };
                    if (h.x > c.x) {
                        e.left = c.x - 1
                    }
                    if (h.y > c.y) {
                        e.top = c.y - 1
                    }
                    e.width = Math.abs(h.x - c.x - 2);
                    e.height = Math.abs(h.y - c.y - 2);
                    d.css(e)
                });
                $(document).unbind("mouseup.create_text").bind("mouseup.create_text", function(h) {
                    if (e != null && e.width >= 20 && e.height >= 20) {
                        var g = Model.create("standardText", e.left.restoreScale(), e.top.restoreScale());
                        g.props.w = e.width.restoreScale();
                        g.props.h = e.height.restoreScale();
                        Model.add(g);
                        Designer.painter.renderShape(g);
                        Designer.op.editShapeText(g);
                        Utils.unselect();
                        Utils.selectShape(g.id)
                    }
                    d.remove();
                    Designer.op.resetState();
                    $(document).unbind("mouseup.create_text");
                    a.unbind("mousemove.create_text")
                });
                a.unbind("mousedown.create_text")
            })
        },
        canvasDragTimeout: null,
        canvasDraggable: function() {
            var a = $("#canvas_container");
            a.css("cursor", "url(/themes/default/images/diagraming/cursor_hand.png) 8 8, auto");
            a.off("mousedown.drag_canvas").on("mousedown.drag_canvas", function(d) {
                var c = $("#designer_layout").scrollTop();
                var b = $("#designer_layout").scrollLeft();
                a.on("mousemove.drag_canvas", function(f) {
                    var e = f.pageX - d.pageX;
                    var g = f.pageY - d.pageY;
                    $("#designer_layout").scrollLeft(b - e);
                    $("#designer_layout").scrollTop(c - g)
                });
                $(document).off("mouseup.drag_canvas").on("mouseup.drag_canvas", function(e) {
                    a.off("mousemove.drag_canvas");
                    $(document).off("mouseup.drag_canvas")
                })
            });
            $(document).off("keyup.drag_canvas").on("keyup.drag_canvas", function(b) {
                a.off("mousedown.drag_canvas");
                Designer.op.resetState();
                $(document).off("mouseup.drag_canvas");
                b.preventDefault();
                a.off("mousemove.drag_canvas")
            })
        },
        canvasFreeDraggable: function() {
            var a = $("#canvas_container");
            a.css("cursor", "url(/themes/default/images/diagraming/cursor_hand.png) 8 8, auto");
            a.unbind("mousedown.drag_canvas").bind("mousedown.drag_canvas", function(d) {
                var c = $("#designer_layout").scrollTop();
                var b = $("#designer_layout").scrollLeft();
                a.bind("mousemove.drag_canvas", function(f) {
                    var e = f.pageX - d.pageX;
                    var g = f.pageY - d.pageY;
                    $("#designer_layout").scrollLeft(b - e);
                    $("#designer_layout").scrollTop(c - g)
                });
                $(document).unbind("mouseup.drag_canvas").bind("mouseup.drag_canvas", function(e) {
                    a.unbind("mousemove.drag_canvas");
                    $(document).unbind("mouseup.drag_canvas")
                })
            })
        },


        /**
		 * 移动图形
		 * @param {} offset 偏移量
		 */
		moveShape: function(shapes, offset){
			var ids = [];
			for(var i = 0; i < shapes.length; i++){
				var shape = shapes[i];
				ids.push(shape.id);
			}
			var restored = Utils.restoreScale(offset);
			for(var i = 0; i < shapes.length; i++){
				var shape = shapes[i];
				if(shape.name == "linker"){
					var linker = shape;
					var from = linker.from;
					var to = linker.to;
					var fromChanged = false;
					var toChanged = false;
					if(!Utils.isSelected(linker.id)){
						if(from.id != null && ids.indexOf(from.id) >= 0){
                            // console.log('Frida Test3')
							//当起点无连接，或者起点形状也被选中了
							linker.from.x += restored.x;
							linker.from.y += restored.y;
							fromChanged = true;
						}
						if(to.id != null && ids.indexOf(to.id) >= 0){
							linker.to.x += restored.x;
							linker.to.y += restored.y;
							toChanged = true;
						}
					}else{
						if(from.id == null || ids.indexOf(from.id) >= 0){
							//当起点无连接，或者起点形状也被选中了
							linker.from.x += restored.x;
							linker.from.y += restored.y;
							fromChanged = true;
						}
						if(to.id == null || ids.indexOf(to.id) >= 0){
							linker.to.x += restored.x;
							linker.to.y += restored.y;
							toChanged = true;
						}
					}
					if(fromChanged && toChanged){
						for(var pi = 0; pi < linker.points.length; pi++){
							var p = linker.points[pi];
							p.x += restored.x;
							p.y += restored.y;
						}
						var shapeBox = $("#" + shape.id);
						var oriPos = shapeBox.position();
						shapeBox.css({
							left: oriPos.left += offset.x,
							top: oriPos.top += offset.y
						});
					}else if(fromChanged || toChanged){
                        // console.log('Frida Test4')
						Designer.painter.renderLinker(linker, true);
					}
				}else{
					relocateShape(shape);
					$(".shape_contour[forshape="+shape.id+"]").css({
						left: shape.props.x.toScale(),
						top: shape.props.y.toScale()
					});
				}
			}



			var linkerIds = Utils.getSelectedLinkerIds();
			//如果选择中只包含一个连接线，不移动选择框
			if(shapes.length == 1 && linkerIds.length == 1){
				return;
			}
			if(linkerIds.length > 0){
				var selectedIds = Utils.getSelectedIds();
				Designer.painter.drawControls(selectedIds);
			}else{
				var controls = $("#shape_controls");
				controls.css({
					left: parseFloat(controls.css("left")) + offset.x,
					top: parseFloat(controls.css("top")) + offset.y
				});
			}
			var controlPos = $("#shape_controls").position();
			Designer.op.showTip("X: " + Math.round(controlPos.left.restoreScale()) + "&nbsp;&nbsp;Y: " + Math.round(controlPos.top.restoreScale()));
			/**
			 * 重新放置图形
			 */
			function relocateShape(shape){
				shape.props.x += restored.x;
				shape.props.y += restored.y;
				var shapeBox = $("#" + shape.id);
				shapeBox.css({
					left: parseFloat(shapeBox.css("left")) + offset.x,
					top: parseFloat(shapeBox.css("top")) + offset.y
				});
			}
		},

        /**
		 * 移动连接线，拖动端点
		 * @param {} linker
		 * @param {} point
		 * @param {} pageX
		 * @param {} pageY
		 */
		moveLinker: function(linker, point, x, y){
            

			var newPos = null;
			var linkedShape = null;
            var focus = Utils.getShapeByPosition(x, y, true);
            console.log('Frida Test focus: ', focus);
            

			Designer.op.hideLinkPoint();
			if(focus != null){
				var shape = focus.shape;
				Utils.showAnchors(shape);
                linkedShape = shape.id;
                
                //frida test. how to define focus.type?
				if(focus.type == "bounding"){
					newPos = focus.linkPoint;
					Designer.op.showLinkPoint(Utils.toScale(newPos));
				}else if(focus.type == "shape"){
					//如果鼠标移动到了某一个图形上
					var fixedPoint; //固定点，起点or终点
					var fixedId;
					if(point == "from"){
						fixedPoint = {x: linker.to.x, y: linker.to.y};
						fixedId = linker.to.id;
					}else{
						fixedPoint = {x: linker.from.x, y: linker.from.y};
						fixedId = linker.from.id;
					}
					if(shape.id == fixedId){
						//如果鼠标悬浮的形状为另一端点连接的图形，不自动连接
						Designer.op.hideLinkPoint();
						newPos = {x: x.restoreScale(), y: y.restoreScale()};
						newPos.angle = null;
						linkedShape = null;
					}else{
						var anchors = shape.getAnchors();
						var minDistance = -1;
						var nearestAnchor;
						var shapeCenter = {x: shape.props.x + shape.props.w/2, y: shape.props.y + shape.props.h/2};
						//循环所有锚点，取距离固定点最近的一点
						for ( var ai = 0; ai < anchors.length; ai++) {
							var an = anchors[ai];
							var anchorPos = Utils.getRotated(shapeCenter, {x: shape.props.x + an.x, y: shape.props.y + an.y}, shape.props.angle);
							var anchorDistance = Utils.measureDistance(anchorPos, fixedPoint);
							if(minDistance == -1 || anchorDistance < minDistance){
								minDistance = anchorDistance;
								nearestAnchor = anchorPos;
							}
						}
						var anchorAngle = Utils.getPointAngle(shape.id, nearestAnchor.x, nearestAnchor.y, 7);
						newPos = {
							x: nearestAnchor.x,
							y: nearestAnchor.y,
							angle: anchorAngle
						};
						Designer.op.showLinkPoint(Utils.toScale(newPos));
					}
				}
			}else{

                // console.log('Frida Test 2');
				Designer.op.hideLinkPoint();
				Utils.hideAnchors();
				newPos = {x: x.restoreScale(), y: y.restoreScale()};
				newPos.angle = null;
                linkedShape = null;
            }
            


			if(point == "from"){
				linker.from.id = linkedShape;
				linker.from.x = newPos.x;
				linker.from.y = newPos.y;
				linker.from.angle = newPos.angle;
				if(linkedShape == null){
					if(newPos.x >= linker.to.x -6 && newPos.x <= linker.to.x + 6){
						linker.from.x = linker.to.x;
					}
					if(newPos.y >= linker.to.y -6 && newPos.y <= linker.to.y + 6){
						linker.from.y = linker.to.y;
					}
				}
			}else{




                //Frida Test: here
				linker.to.x = newPos.x;
				linker.to.y = newPos.y;
				linker.to.id = linkedShape;
				linker.to.angle = newPos.angle;
				if(linkedShape == null){
					if(newPos.x >= linker.from.x -6 && newPos.x <= linker.from.x + 6){
						linker.to.x = linker.from.x;
					}
					if(newPos.y >= linker.from.y -6 && newPos.y <= linker.from.y + 6){
						linker.to.y = linker.from.y;
					}
				}
			}
			Designer.painter.renderLinker(linker, true);
        },
        
        showLinkPoint: function(a) {
            var c = $("<canvas class='link_point_canvas' width=32 height=32></canvas>").appendTo($("#designer_canvas"));
            var b = c[0].getContext("2d");
            b.translate(1, 1);
            b.lineWidth = 1;
            b.globalAlpha = 0.3;
            b.strokeStyle = Designer.config.anchorColor;
            b.fillStyle = Designer.config.anchorColor;
            b.beginPath();
            b.moveTo(0, 15);
            b.bezierCurveTo(0, -5, 30, -5, 30, 15);
            b.bezierCurveTo(30, 35, 0, 35, 0, 15);
            b.closePath();
            b.fill();
            b.stroke();
            c.css({
                left: a.x - 16,
                top: a.y - 16,
                "z-index": Model.orderList.length
            }).show()
        },
        hideLinkPoint: function() {
            $(".link_point_canvas").hide()
        },
        brokenLinkerChangable: function(linker, index){
			var container = $("#canvas_container");
			var canvas = $("#designer_canvas");
			var p1 = linker.points[index - 1];
			var p2 = linker.points[index];
			if(p1.x == p2.x){
				container.css("cursor", "e-resize");
				//可左右拖动
			}else{
				container.css("cursor", "n-resize");
				//可上下拖动
			}
			canvas.bind("mousedown.brokenLinker", function(downE){
				Designer.op.changeState("changing_broken_linker");
				//初始坐标，要取相对画布的坐标
				var begin = Utils.getRelativePos(downE.pageX, downE.pageY, canvas);
				var selectedIds = Utils.getSelectedIds();
				container.bind("mousemove.brokenLinker", function(moveE){
					var now = Utils.getRelativePos(moveE.pageX, moveE.pageY, canvas);
					//计算和开始时候的偏移量
					var offset = {
						x: now.x - begin.x, y: now.y - begin.y
					};
					offset = Utils.restoreScale(offset);
					if(p1.x == p2.x){
						p1.x += offset.x;
						p2.x += offset.x;
					}else{
						p1.y += offset.y;
						p2.y += offset.y;
					}
					Designer.painter.renderLinker(linker);
					if(selectedIds.length > 1){
						Designer.painter.drawControls(selectedIds);
					}
					begin = now;
					//在mousemove里绑定一个mouseup，目的是为了当鼠标发生了拖动之后，才认为是进行了拖动事件
					$(document).unbind("mouseup.changed").bind("mouseup.changed", function(){
						Model.update(linker);
						$(document).unbind("mouseup.changed");
					});
				});
				$(document).bind("mouseup.brokenLinker", function(){
					Designer.op.resetState();
					container.unbind("mousemove.brokenLinker");
					canvas.unbind("mousedown.brokenLinker");
					$(document).unbind("mouseup.brokenLinker");
				});
			});
		},
        removeShape: function() {
            var d = Utils.getSelected();
            if (d.length > 0) {
                Utils.unselect();
                var e = Utils.getAttachedShapes(d);
                d = d.concat(e);
                var c = [];
                for (var b = 0; b < d.length; b++) {
                    var a = Utils.getChildrenShapes(d[b]);
                    c = c.concat(a)
                }
                d = d.concat(c);
                var f = Utils.getCollapsedShapes(d);
                d = d.concat(f);
                Model.remove(d)
            }
        },
        showTip: function(c) {
            var a = $("#designer_op_tip");
            if (a.length == 0) {
                a = $("<div id='designer_op_tip'></div>").appendTo("#designer_canvas")
            }
            a.stop().html(c);
            var b = $("#shape_controls");
            var d = b.position();
            a.css({
                top: d.top + b.height() + 5,
                left: d.left + b.width() / 2 - a.outerWidth() / 2,
                "z-index": Model.orderList.length
            }).show()
        },
        hideTip: function() {
            $("#designer_op_tip").fadeOut(100)
        },
        snapLine: function(t, u, E, j) {
            var s = t.y;
            var I = t.y + t.h / 2;
            var k = t.y + t.h;
            var g = t.x;
            var D = t.x + t.w / 2;
            var B = t.x + t.w;
            var f = 2;
            var m = {
                v: null,
                h: null,
                attach: null,
                container: null
            };
            var C = null;
            if (E) {
                C = j
            } else {
                C = Model.getShapeById(u[0])
            }
            if (u.length == 1 && C.groupName == "boundaryEvent") {
                for (var x = Model.orderList.length - 1; x >= 0; x--) {
                    var F = Model.orderList[x].id;
                    var d = Model.getShapeById(F);
                    if (d.attribute && d.attribute.collapseBy) {
                        continue
                    }
                    if (d.name != "linker" && d.id != C.id) {
                        var v = d.props;
                        if (m.attach == null && v.angle == 0 && (d.groupName == "task" || d.groupName == "callActivity" || d.groupName == "subProcess")) {
                            var z = {
                                x: v.x - f,
                                y: v.y - f,
                                w: v.w + f * 2,
                                h: v.h + f * 2
                            };
                            if (Utils.pointInRect(D, I, z)) {
                                var c = v.y;
                                var l = v.y + v.h;
                                var H = v.x;
                                var w = v.x + v.w;
                                var r = false;
                                var n = false;
                                if (c >= I - f && c <= I + f) {
                                    t.y = c - t.h / 2;
                                    n = true
                                } else {
                                    if (l >= I - f && l <= I + f) {
                                        t.y = l - t.h / 2;
                                        n = true
                                    }
                                }
                                if (H >= D - f && H <= D + f) {
                                    t.x = H - t.w / 2;
                                    r = true
                                } else {
                                    if (w >= D - f && w <= D + f) {
                                        t.x = w - t.w / 2;
                                        r = true
                                    }
                                }
                                if (r || n) {
                                    m.attach = d
                                }
                            }
                        }
                    }
                }
            }
            if (m.attach == null) {
                for (var x = Model.orderList.length - 1; x >= 0; x--) {
                    var F = Model.orderList[x].id;
                    var d = Model.getShapeById(F);
                    if (d.attribute && d.attribute.collapseBy) {
                        continue
                    }
                    if (d.name == "linker" || u.indexOf(F) >= 0 || d.parent) {
                        continue
                    }
                    var v = d.props;
                    if (m.h == null) {
                        var c = v.y;
                        var b = v.y + v.h / 2;
                        var l = v.y + v.h;
                        if (b >= I - f && b <= I + f) {
                            m.h = {
                                type: "middle",
                                y: b
                            };
                            t.y = b - t.h / 2
                        } else {
                            if (c >= s - f && c <= s + f) {
                                m.h = {
                                    type: "top",
                                    y: c
                                };
                                t.y = c
                            } else {
                                if (l >= k - f && l <= k + f) {
                                    m.h = {
                                        type: "bottom",
                                        y: l
                                    };
                                    t.y = l - t.h
                                } else {
                                    if (l >= s - f && l <= s + f) {
                                        m.h = {
                                            type: "top",
                                            y: l
                                        };
                                        t.y = l
                                    } else {
                                        if (c >= k - f && c <= k + f) {
                                            m.h = {
                                                type: "bottom",
                                                y: c
                                            };
                                            t.y = c - t.h
                                        }
                                    }
                                }
                            }
                        }
                    }
                    if (m.v == null) {
                        var H = v.x;
                        var G = v.x + v.w / 2;
                        var w = v.x + v.w;
                        if (G >= D - f && G <= D + f) {
                            m.v = {
                                type: "center",
                                x: G
                            };
                            t.x = G - t.w / 2
                        } else {
                            if (H >= g - f && H <= g + f) {
                                m.v = {
                                    type: "left",
                                    x: H
                                };
                                t.x = H
                            } else {
                                if (w >= B - f && w <= B + f) {
                                    m.v = {
                                        type: "right",
                                        x: w
                                    };
                                    t.x = w - t.w
                                } else {
                                    if (w >= g - f && w <= g + f) {
                                        m.v = {
                                            type: "left",
                                            x: w
                                        };
                                        t.x = w
                                    } else {
                                        if (H >= B - f && H <= B + f) {
                                            m.v = {
                                                type: "right",
                                                x: H
                                            };
                                            t.x = H - t.w
                                        }
                                    }
                                }
                            }
                        }
                    }
                    if (m.container == null) {
                        if (d.attribute && d.attribute.container) {
                            if (Utils.rectInRect(t, d.props)) {
                                m.container = d
                            }
                        }
                    }
                    if (m.h != null && m.v != null && m.container != null) {
                        break
                    }
                }
            }
            this.hideSnapLine();
            var e = $("#designer_canvas");
            if (m.attach != null || m.container != null) {
                var q = $("#designer_op_snapline_attach");
                if (q.length == 0) {
                    q = $("<div id='designer_op_snapline_attach'></div>").appendTo(e)
                }
                var y = m.attach || m.container;
                var h = Utils.getShapeLineStyle(y.lineStyle);
                var a = h.lineWidth;
                q.css({
                    width: (y.props.w + a).toScale(),
                    height: (y.props.h + a).toScale(),
                    left: (y.props.x - a / 2).toScale() - 2,
                    top: (y.props.y - a / 2).toScale() - 2,
                    "z-index": $("#" + y.id).css("z-index")
                }).show()
            }
            if (m.h != null) {
                var A = $("#designer_op_snapline_h");
                if (A.length == 0) {
                    A = $("<div id='designer_op_snapline_h'></div>").appendTo(e)
                }
                A.css({
                    width: e.width() + Designer.config.pageMargin * 2,
                    left: -Designer.config.pageMargin,
                    top: Math.round(m.h.y.toScale()),
                    "z-index": Model.orderList.length + 1
                }).show()
            }
            if (m.v != null) {
                var o = $("#designer_op_snapline_v");
                if (o.length == 0) {
                    o = $("<div id='designer_op_snapline_v'></div>").appendTo(e)
                }
                o.css({
                    height: e.height() + Designer.config.pageMargin * 2,
                    top: -Designer.config.pageMargin,
                    left: Math.round(m.v.x.toScale()),
                    "z-index": Model.orderList.length + 1
                }).show()
            }
            return m
        },
        snapLinkerLine: function(o, m) {
            var q = {
                v: null,
                h: null
            };
            var k = 2;
            for (var h = Model.orderList.length - 1; h >= 0; h--) {
                var n = Model.orderList[h].id;
                var l = Model.getShapeById(n);
                if (l.attribute && l.attribute.collapseBy) {
                    continue
                }
                if (l.name == "linker" || l.parent) {
                    continue
                }
                var f = l.props;
                if (q.h == null) {
                    var d = f.y;
                    var j = f.y + f.h;
                    if (d >= m - k && d <= m + k) {
                        q.h = d
                    } else {
                        if (j >= m - k && j <= m + k) {
                            q.h = j
                        }
                    }
                }
                if (q.v == null) {
                    var p = f.x;
                    var e = f.x + f.w;
                    if (p >= o - k && p <= o + k) {
                        q.v = p
                    } else {
                        if (e >= o - k && e <= o + k) {
                            q.v = e
                        }
                    }
                }
                if (q.h != null && q.v != null) {
                    break
                }
            }
            this.hideSnapLine();
            var c = $("#designer_canvas");
            if (q.h != null) {
                var g = $("#designer_op_snapline_h");
                if (g.length == 0) {
                    g = $("<div id='designer_op_snapline_h'></div>").appendTo(c)
                }
                g.css({
                    width: c.width() + Designer.config.pageMargin * 2,
                    left: -Designer.config.pageMargin,
                    top: Math.round(q.h.toScale()),
                    "z-index": Model.orderList.length + 1
                }).show()
            }
            if (q.v != null) {
                var a = $("#designer_op_snapline_v");
                if (a.length == 0) {
                    a = $("<div id='designer_op_snapline_v'></div>").appendTo(c)
                }
                a.css({
                    height: c.height() + Designer.config.pageMargin * 2,
                    top: -Designer.config.pageMargin,
                    left: Math.round(q.v.toScale()),
                    "z-index": Model.orderList.length + 1
                }).show()
            }
            var b = {
                x: o,
                y: m
            };
            if (q.h != null) {
                b.y = q.h
            }
            if (q.v != null) {
                b.x = q.v
            }
            return b
        },
        snapResizeLine: function(m, o, n) {
            var l = m.y;
            var z = m.y + m.h / 2;
            var g = m.y + m.h;
            var f = m.x;
            var v = m.x + m.w / 2;
            var u = m.x + m.w;
            var e = 2;
            var j = {
                v: null,
                h: null
            };
            for (var s = Model.orderList.length - 1; s >= 0; s--) {
                var w = Model.orderList[s].id;
                var b = Model.getShapeById(w);
                if (b.attribute && b.attribute.collapseBy) {
                    continue
                }
                if (b.name == "linker" || o.indexOf(w) >= 0 || b.parent) {
                    continue
                }
                var q = b.props;
                if (j.h == null && (n.indexOf("t") >= 0 || n.indexOf("b") >= 0)) {
                    var c = q.y;
                    var a = q.y + q.h / 2;
                    var h = q.y + q.h;
                    if (a >= z - e && a <= z + e) {
                        j.h = {
                            type: "middle",
                            y: a
                        };
                        if (n.indexOf("t") >= 0) {
                            m.h = (g - a) * 2;
                            m.y = g - m.h
                        } else {
                            m.h = (a - m.y) * 2
                        }
                    } else {
                        if (n.indexOf("t") >= 0 && c >= l - e && c <= l + e) {
                            j.h = {
                                type: "top",
                                y: c
                            };
                            m.y = c;
                            m.h = g - c
                        } else {
                            if (n.indexOf("b") >= 0 && h >= g - e && h <= g + e) {
                                j.h = {
                                    type: "bottom",
                                    y: h
                                };
                                m.h = h - l
                            } else {
                                if (n.indexOf("t") >= 0 && h >= l - e && h <= l + e) {
                                    j.h = {
                                        type: "top",
                                        y: h
                                    };
                                    m.y = h;
                                    m.h = g - h
                                } else {
                                    if (n.indexOf("b") >= 0 && c >= g - e && c <= g + e) {
                                        j.h = {
                                            type: "bottom",
                                            y: c
                                        };
                                        m.h = c - m.y
                                    }
                                }
                            }
                        }
                    }
                }
                if (j.v == null && (n.indexOf("l") >= 0 || n.indexOf("r") >= 0)) {
                    var y = q.x;
                    var x = q.x + q.w / 2;
                    var r = q.x + q.w;
                    if (x >= v - e && x <= v + e) {
                        j.v = {
                            type: "center",
                            x: x
                        };
                        if (n.indexOf("l") >= 0) {
                            m.w = (u - x) * 2;
                            m.x = u - m.w
                        } else {
                            m.w = (x - m.x) * 2
                        }
                    } else {
                        if (n.indexOf("l") >= 0 && y >= f - e && y <= f + e) {
                            j.v = {
                                type: "left",
                                x: y
                            };
                            m.x = y;
                            m.w = u - y
                        } else {
                            if (n.indexOf("r") >= 0 && r >= u - e && r <= u + e) {
                                j.v = {
                                    type: "right",
                                    x: r
                                };
                                m.w = r - m.x
                            } else {
                                if (n.indexOf("l") >= 0 && r >= f - e && r <= f + e) {
                                    j.v = {
                                        type: "left",
                                        x: r
                                    };
                                    m.x = r;
                                    m.w = u - r
                                } else {
                                    if (n.indexOf("r") >= 0 && y >= u - e && y <= u + e) {
                                        j.v = {
                                            type: "right",
                                            x: y
                                        };
                                        m.w = y - m.x
                                    }
                                }
                            }
                        }
                    }
                }
                if (j.h != null && j.v != null) {
                    break
                }
            }
            this.hideSnapLine();
            var d = $("#designer_canvas");
            if (j.h != null) {
                var t = $("#designer_op_snapline_h");
                if (t.length == 0) {
                    t = $("<div id='designer_op_snapline_h'></div>").appendTo(d)
                }
                t.css({
                    width: d.width() + Designer.config.pageMargin * 2,
                    left: -Designer.config.pageMargin,
                    top: Math.round(j.h.y.toScale()),
                    "z-index": Model.orderList.length + 1
                }).show()
            }
            if (j.v != null) {
                var k = $("#designer_op_snapline_v");
                if (k.length == 0) {
                    k = $("<div id='designer_op_snapline_v'></div>").appendTo(d)
                }
                k.css({
                    height: d.height() + Designer.config.pageMargin * 2,
                    top: -Designer.config.pageMargin,
                    left: Math.round(j.v.x.toScale()),
                    "z-index": Model.orderList.length + 1
                }).show()
            }
            return j
        },
        hideSnapLine: function() {
            $("#designer_op_snapline_h").hide();
            $("#designer_op_snapline_v").hide();
            $("#designer_op_snapline_attach").hide()
        },
        linkDashboard: function(g) {
            var e = 0
              , d = 0;
            var k = null;
            var a = typeof g == "string" ? false : true;
            if (!a) {
                k = Model.getShapeById(g);
                e = k.props.x.toScale() + k.props.w;
                d = k.props.y.toScale()
            } else {
                k = Model.getShapeById(g.from.id);
                e = g.to.x.toScale();
                d = g.to.y.toScale()
            }
            var b = k.category;
            if ($("#panel_" + b).length != 0) {
                var i = $("#shape_dashboard_" + b);
                if (i.length == 0) {
                    i = $("<div id='shape_dashboard_" + b + "' class='shape_dashboard menu'></div>").appendTo("#designer_canvas");
                    function f(o, r) {
                        var q = "<div class='dashboard_box' shapeName='" + o.name + "'><canvas title='" + o.title + "' title_pos='right' class='panel_item' width='" + (Designer.config.panelItemWidth) + "' height='" + (Designer.config.panelItemHeight) + "'></canvas></div>";
                        var n = $(q).appendTo(i);
                        if (r) {
                            n.append("<div class='group_icon link_shape_icon' group='" + r + "'></div>")
                        }
                        var p = n.children()[0];
                        Designer.painter.drawPanelItem(p, o.name)
                    }
                    for (var l in Schema.shapes) {
                        var h = Schema.shapes[l];
                        if (h.category == b) {
                            var c = h.attribute;
                            if (c.visible && c.linkable) {
                                if (!h.groupName) {
                                    f(h)
                                } else {
                                    var m = SchemaGroup.getGroup(h.groupName);
                                    if (m[0] == h.name) {
                                        f(h, h.groupName)
                                    }
                                }
                            }
                        }
                    }
                    i.bind("mousemove", function(n) {
                        n.stopPropagation()
                    }).bind("mousedown", function(n) {
                        n.stopPropagation()
                    })
                }
                i.css({
                    left: e,
                    top: d,
                    "z-index": Model.orderList.length
                }).show();
                i.find(".link_shape_icon").unbind().bind("mousedown", function(q) {
                    q.stopPropagation();
                    var p = $(this).attr("group");
                    var s = $(this).parent().position();
                    var r = i.position();
                    var o = s.left + r.left + $(this).parent().outerWidth() - 10;
                    var n = s.top + r.top + $(this).parent().outerHeight();
                    Designer.op.groupDashboard(p, o, n, function(t) {
                        j(t);
                        i.hide();
                        $(document).unbind("mousedown.dashboard")
                    })
                }).bind("click", function(n) {
                    n.stopPropagation()
                });
                i.children(".dashboard_box").unbind().bind("click", function() {
                    i.hide();
                    $(document).unbind("mousedown.dashboard");
                    var o = $(this);
                    var n = o.attr("shapeName");
                    if (!a) {
                        Designer.op.shapeReplace(n, g)
                    } else {
                        j(n)
                    }
                    if ($("#hover_tip").length > 0) {
                        $("#hover_tip").remove()
                    }
                });
                $(document).bind("mousedown.dashboard", function() {
                    i.hide();
                    $(document).unbind("mousedown.dashboard")
                });
                function j(q) {
                    var y = Schema.shapes[q];
                    var r = Utils.getEndpointAngle(g, "to");
                    var t = Utils.getAngleDir(r);
                    var p = y.getAnchors();
                    var w;
                    if (t == 1) {
                        var s = null;
                        for (var z = 0; z < p.length; z++) {
                            var x = p[z];
                            if (s == null || x.y < s) {
                                s = x.y;
                                w = x
                            }
                        }
                    } else {
                        if (t == 2) {
                            var o = null;
                            for (var z = 0; z < p.length; z++) {
                                var x = p[z];
                                if (o == null || x.x > o) {
                                    o = x.x;
                                    w = x
                                }
                            }
                        } else {
                            if (t == 3) {
                                var n = null;
                                for (var z = 0; z < p.length; z++) {
                                    var x = p[z];
                                    if (n == null || x.y > n) {
                                        n = x.y;
                                        w = x
                                    }
                                }
                            } else {
                                if (t == 4) {
                                    var v = null;
                                    for (var z = 0; z < p.length; z++) {
                                        var x = p[z];
                                        if (v == null || x.x < v) {
                                            v = x.x;
                                            w = x
                                        }
                                    }
                                }
                            }
                        }
                    }
                    var A = Model.create(q, g.to.x - w.x, g.to.y - w.y);
                    Designer.painter.renderShape(A);
                    MessageSource.beginBatch();
                    if (A.onCreated) {
                        A.onCreated()
                    }
                    Designer.events.push("created", A);
                    Model.add(A);
                    var u = Utils.getPointAngle(A.id, g.to.x, g.to.y, 7);
                    g.to.id = A.id;
                    g.to.angle = u;
                    Designer.painter.renderLinker(g, true);
                    Model.update(g);
                    MessageSource.commit();
                    Utils.unselect();
                    Utils.selectShape(A.id);
                    Designer.op.editShapeText(A)
                }
            }
        },
        groupDashboard: function(k, d, j, c) {
            $(".group_dashboard").hide();
            var h = $("#shape_group_dashboard_" + k);
            if (h.length == 0) {
                h = $("<div id='shape_group_dashboard_" + k + "' class='group_dashboard menu'></div>").appendTo("#designer_canvas");
                var l = SchemaGroup.getGroup(k);
                for (var e = 0; e < l.length; e++) {
                    var a = l[e];
                    var g = Schema.shapes[a];
                    if (g.attribute.visible) {
                        var f = $("<div class='dashboard_box' shapeName='" + a + "'><canvas title='" + g.title + "' title_pos='right' width='" + (Designer.config.panelItemWidth) + "' height='" + (Designer.config.panelItemHeight) + "'></canvas></div>").appendTo(h);
                        var b = f.children("canvas")[0];
                        Designer.painter.drawPanelItem(b, g.name)
                    }
                }
                h.bind("mousedown", function(i) {
                    i.stopPropagation()
                })
            }
            h.css({
                left: d,
                top: j,
                "z-index": Model.orderList.length + 1
            }).show();
            $(".dashboard_box").unbind().bind("click", function() {
                var i = $(this).attr("shapeName");
                c(i);
                h.hide();
                $(document).unbind("mousedown.group_dashboard")
            });
            $(document).bind("mousedown.group_dashboard", function() {
                h.hide();
                $(document).unbind("mousedown.group_dashboard")
            });
            return h
        },
        showPanelGroup: function(m, a, g) {
            a.stopPropagation();
            var h = $("#group_dashboard_" + m);
            $(".group_dashboard").hide();
            if (h.length == 0) {
                h = $("<div id='group_dashboard_" + m + "' class='group_dashboard menu'></div>").appendTo("#designer");
                var n = SchemaGroup.getGroup(m);
                for (var e = 0; e < n.length; e++) {
                    var b = n[e];
                    var j = Schema.shapes[b];
                    if (j.attribute.visible) {
                        var f = $("<div class='panel_box' shapeName='" + b + "'><canvas title='" + j.title + "' title_pos='right' width='" + (Designer.config.panelItemWidth) + "' height='" + (Designer.config.panelItemHeight) + "'></canvas></div>").appendTo(h);
                        var c = f.children("canvas")[0];
                        Designer.painter.drawPanelItem(c, j.name)
                    }
                }
                h.css("position", "fixed")
            }
            var l = $(g).parent();
            var d = l.offset();
            h.show();
            var k = d.top + l.outerHeight() - 2;
            if (k + h.outerHeight() > $(window).height()) {
                k = $(window).height() - h.outerHeight()
            }
            h.css({
                left: d.left - 5,
                top: k
            });
            $(document).bind("mousedown.group_board", function() {
                h.hide();
                $(document).unbind("mousedown.group_board")
            })
        },
        changeShapeProps: function(a, d) {
            function c(i) {
                if (typeof d.x != "undefined") {
                    i.x += (d.x - a.props.x)
                }
                if (typeof d.y != "undefined") {
                    i.y += (d.y - a.props.y)
                }
                if (typeof d.w != "undefined" || typeof d.h != "undefined" || typeof d.angle != "undefined") {
                    var q = $.extend({}, a.props, d);
                    var o = {
                        x: a.props.x + a.props.w / 2,
                        y: a.props.y + a.props.h / 2
                    };
                    var l = Utils.getRotated(o, i, -a.props.angle);
                    var k = a.props.w;
                    var n = a.props.h;
                    if (typeof d.w != "undefined") {
                        i.x = a.props.x + (l.x - a.props.x) / a.props.w * d.w;
                        k = d.w
                    } else {
                        i.x = l.x
                    }
                    if (typeof d.h != "undefined") {
                        i.y = a.props.y + (l.y - a.props.y) / a.props.h * d.h;
                        n = d.h
                    } else {
                        i.y = l.y
                    }
                    var j = {
                        x: a.props.x + k / 2,
                        y: a.props.y + n / 2
                    };
                    var m = Utils.getRotated(j, i, q.angle);
                    i.x = m.x;
                    i.y = m.y
                }
                if (typeof d.angle != "undefined") {
                    i.angle += d.angle - a.props.angle
                }
            }
            var f = [];
            var g = Model.getShapeLinkers(a.id);
            if (g && g.length > 0) {
                for (var b = 0; b < g.length; b++) {
                    var h = g[b];
                    var e = Model.getShapeById(h);
                    if (a.id == e.from.id) {
                        c(e.from)
                    }
                    if (a.id == e.to.id) {
                        c(e.to)
                    }
                }
                f = g
            }
            $.extend(a.props, d);
            Designer.painter.renderShape(a);
            Utils.showLinkerCursor();
            UI.showShapeOptions();
            return f
        },
        googleImgCallback: function(e) {
            var c = e.responseData;
            var b = c.results;
            for (var a = 0; a < b.length; a++) {
                var d = b[a];
                UI.appendGoogleImage(d)
            }
            $("#google_image_items").append("<div style='clear: both'></div>");
            $(".img_gg_loading_tip").remove();
            $(".gg_img_more").remove();
            if (this.searchIndex <= 3) {
                $("#google_image_items").append("<div onclick='UI.loadGoogleImg()' class='gg_img_more toolbar_button active'>显示更多结果...</div>")
            }
        },
        scrollStv: null,
        scrollIsOver: false,
        scrollLayout: null,
        scrollPos: {},
        initScrollPos: function() {
            var a = $("#designer");
            this.scrollLayout = $("#designer_layout");
            this.scrollPos.b = a.height() + a.offset().top - 30;
            this.scrollPos.t = a.offset().top + 20;
            this.scrollPos.l = a.find("#shape_panel").width() + 20;
            this.scrollPos.r = a.width() - 20
        },
        isScroll: function(a, c) {
            var b = this;
            if (a < b.scrollPos.l) {
                b.startScroll("l")
            } else {
                if (a > b.scrollPos.r) {
                    b.startScroll("r")
                } else {
                    if (c < b.scrollPos.t) {
                        b.startScroll("t")
                    } else {
                        if (c > b.scrollPos.b) {
                            b.startScroll("b")
                        } else {
                            if (b.scrollIsOver) {
                                b.stopScroll()
                            }
                        }
                    }
                }
            }
        },
        stopScroll: function() {
            var a = this;
            window.clearInterval(a.scrollStv);
            a.scrollStv = null;
            a.scrollIsOver = false
        },
        startScroll: function(b) {
            var a = this;
            if (a.scrollIsOver) {
                return
            }
            a.scrollIsOver = true;
            a.scrollStv = setInterval(function() {
                a.scrolling(b)
            }, 20)
        },
        scrolling: function(c) {
            var b = this
              , a = b.scrollLayout;
            switch (c) {
            case "t":
                a.scrollTop(a.scrollTop() - 5);
                break;
            case "b":
                a.scrollTop(a.scrollTop() + 5);
                break;
            case "l":
                a.scrollLeft(a.scrollLeft() - 5);
                break;
            case "r":
                a.scrollLeft(a.scrollLeft() + 5);
                break
            }
        }
    },
    events: {
        push: function(c, a) {
            var b = this.listeners[c];
            if (b) {
                return b(a)
            }
            return null
        },
        listeners: {},
        addEventListener: function(b, a) {
            this.listeners[b] = a
        }
    },
    clipboard: {
        elements: [],
        presetedIds: {},
        presetIds: function() {
            this.presetedIds = {};
            for (var b = 0; b < this.elements.length; b++) {
                var a = this.elements[b];
                this.presetedIds[a.id] = Utils.newId();
                if (a.group && !this.presetedIds[a.group]) {
                    this.presetedIds[a.group] = Utils.newId()
                }
            }
            localStorage.presetedIds = JSON.stringify(this.presetedIds)
        },
        plus: true,
        copy: function() {
            this.elements = [];
            var d = Utils.getSelected();
            var c = Utils.getFamilyShapes(d);
            d = d.concat(c);
            d.sort(function e(g, f) {
                return g.props.zindex - f.props.zindex
            });
            for (var b = 0; b < d.length; b++) {
                var a = Utils.copy(d[b]);
                if (a.name == "linker") {
                    if (a.from.id != null) {
                        if (!Utils.isSelected(a.from.id)) {
                            a.from.id = null;
                            a.from.angle = null
                        }
                    }
                    if (a.to.id != null) {
                        if (!Utils.isSelected(a.to.id)) {
                            a.to.id = null;
                            a.to.angle = null
                        }
                    }
                }
                this.elements.push(a)
            }
            this.elements.sort(function e(g, f) {
                return g.props.zindex - f.props.zindex
            });
            this.presetIds();
            this.plus = true;
            Designer.events.push("clipboardChanged", this.elements.length);
            localStorage.clipboard = JSON.stringify(this.elements);
            localStorage.clientId = CLB.clientId
        },
        cut: function() {
            this.copy();
            Designer.op.removeShape();
            this.plus = false
        },
        paste: function(n, m) {
            if (localStorage.clipboard) {
                var e = JSON.parse(localStorage.clipboard);
                var c = localStorage.clientId;
                if (CLB.clientId != c) {
                    this.elements = e;
                    for (var w = 0; w < this.elements.length; w++) {
                        var a = this.elements[w];
                        if (a.name != "linker") {
                            Schema.initShapeFunctions(a)
                        }
                    }
                    this.presetedIds = JSON.parse(localStorage.presetedIds);
                    if (typeof n == "undefined") {
                        var b = $("#designer_layout").scrollTop();
                        var k = b - Designer.config.pageMargin + $("#designer_layout").height().restoreScale() / 2;
                        var t = $("#designer_layout").scrollLeft();
                        var l = t - Designer.config.pageMargin + $("#designer_layout").width().restoreScale() / 2;
                        n = l;
                        m = k
                    }
                }
            }
            if (this.elements.length == 0) {
                return
            }
            var A = 20;
            var z = 20;
            if (typeof n != "undefined") {
                var g = Utils.getShapesBounding(this.elements);
                A = n - g.x - g.w / 2;
                z = m - g.y - g.h / 2
            }
            var h = [];
            var d = [];
            for (var w = 0; w < this.elements.length; w++) {
                var a = this.elements[w];
                if (a.name != "linker") {
                    var C;
                    var a = this.elements[w];
                    a.props.zindex = Model.maxZIndex + (w + 1);
                    var q = this.presetedIds[a.id];
                    if (this.plus || typeof n != "undefined") {
                        a.props.x += A;
                        a.props.y += z
                    }
                    C = Utils.copy(a);
                    for (var v = 0; v < C.dataAttributes.length; v++) {
                        var s = C.dataAttributes[v];
                        s.id = Utils.newId()
                    }
                    C.id = q;
                    if (C.children) {
                        for (var o = 0; o < C.children.length; o++) {
                            var u = C.children[o];
                            C.children[o] = this.presetedIds[u]
                        }
                    }
                    if (C.parent) {
                        C.parent = this.presetedIds[C.parent]
                    }
                    h.push(C);
                    d.push(q);
                    if (a.group) {
                        var f = this.presetedIds[a.group];
                        C.group = f
                    }
                }
            }
            for (var w = 0; w < this.elements.length; w++) {
                var a = this.elements[w];
                if (a.name == "linker") {
                    var C;
                    a.props.zindex = Model.maxZIndex + (w + 1);
                    var q = this.presetedIds[a.id];
                    if (this.plus || typeof n != "undefined") {
                        a.from.x += A;
                        a.from.y += z;
                        a.to.x += A;
                        a.to.y += z;
                        for (var B = 0; B < a.points.length; B++) {
                            var r = a.points[B];
                            r.x += A;
                            r.y += z
                        }
                    }
                    C = Utils.copy(a);
                    if (!C.dataAttributes) {
                        C.dataAttributes = []
                    }
                    for (var v = 0; v < C.dataAttributes.length; v++) {
                        var s = C.dataAttributes[v];
                        s.id = Utils.newId()
                    }
                    if (a.from.id != null) {
                        C.from.id = this.presetedIds[a.from.id]
                    }
                    if (a.to.id != null) {
                        C.to.id = this.presetedIds[a.to.id]
                    }
                    C.id = q;
                    h.push(C);
                    d.push(q);
                    if (a.group) {
                        var f = this.presetedIds[a.group];
                        C.group = f
                    }
                }
            }
            Model.addMulti(h);
            for (var w = 0; w < h.length; w++) {
                var a = h[w];
                Designer.painter.renderShape(a)
            }
            Model.build();
            this.presetIds();
            Utils.unselect();
            Utils.selectShape(d);
            this.plus = true;
            Util.shapesCount()
        },
        duplicate: function() {
            this.copy();
            this.paste()
        },
        brush: function() {
            var d = Utils.getSelected();
            if (d.length == 0) {
                return
            }
            var a = {
                fontStyle: {},
                lineStyle: {},
                fillStyle: null,
                shapeStyle: null
            };
            for (var c = 0; c < d.length; c++) {
                var b = d[c];
                if (b.name == "linker") {
                    $.extend(a.lineStyle, b.lineStyle);
                    $.extend(a.fontStyle, b.fontStyle)
                } else {
                    if (a.fillStyle == null) {
                        a.fillStyle = {}
                    }
                    if (a.shapeStyle == null) {
                        a.shapeStyle = {}
                    }
                    $.extend(a.lineStyle, b.lineStyle);
                    $.extend(a.fontStyle, b.fontStyle);
                    $.extend(a.shapeStyle, b.shapeStyle);
                    $.extend(a.fillStyle, b.fillStyle)
                }
            }
            delete a.fontStyle.orientation;
            $("#bar_brush").button("select");
            UI.showTip("选择目标图形并使用格式刷样式，Esc取消", "left", function() {
                $("#bar_brush").button("unselect");
                $(document).unbind("keydown.cancelbrush");
                Utils.selectCallback = null;
                $("#bar_brush").button("disable")
            });
            $(document).unbind("keydown.cancelbrush").bind("keydown.cancelbrush", function(f) {
                if (f.keyCode == 27) {
                    UI.hideTip();
                    $("#bar_brush").button("unselect");
                    $(document).unbind("keydown.cancelbrush");
                    Utils.selectCallback = null;
                    $("#bar_brush").button("disable")
                }
            });
            Utils.selectCallback = function() {
                var f = Utils.getSelected();
                for (var g = 0; g < f.length; g++) {
                    var e = f[g];
                    $.extend(e.lineStyle, a.lineStyle);
                    $.extend(e.fontStyle, a.fontStyle);
                    if (e.name != "linker") {
                        e.lineStyle = a.lineStyle;
                        delete e.lineStyle.beginArrowStyle;
                        delete e.lineStyle.endArrowStyle;
                        if (a.fillStyle != null) {
                            e.fillStyle = a.fillStyle
                        }
                        if (a.shapeStyle != null) {
                            e.shapeStyle = a.shapeStyle
                        }
                    } else {
                        if (e.fontStyle) {
                            delete e.fontStyle.vAlign
                        }
                    }
                    Designer.painter.renderShape(e)
                }
                Model.updateMulti(f)
            }
        }
    },
    addFunction: function(b, a) {
        if (Designer[b]) {
            throw "Duplicate function name!"
        } else {
            this[b] = a
        }
    },
    painter: {
        actions: {
            move: function(a) {
                this.moveTo(a.x, a.y);
                this.prePoint = a;
                if (this.beginPoint == null) {
                    this.beginPoint = a
                }
            },
            line: function(d) {
                if (typeof this.webkitLineDash != "undefined" && typeof this.lineDashOffset == "undefined" && this.lineWidth != 0) {
                    var f = this.webkitLineDash;
                    var c = this.prePoint;
                    var h = Utils.measureDistance(c, d);
                    var k = 0;
                    var b = 1 / h;
                    var j = c;
                    var e = 0;
                    var g = true;
                    while (k < 1) {
                        k += b;
                        if (k > 1) {
                            k = 1
                        }
                        var i = {
                            x: (1 - k) * c.x + k * d.x,
                            y: (1 - k) * c.y + k * d.y
                        };
                        var a = Utils.measureDistance(j, i);
                        if (a >= f[e] || k >= 1) {
                            if (g) {
                                this.lineTo(i.x, i.y)
                            } else {
                                this.moveTo(i.x, i.y)
                            }
                            g = !g;
                            j = i;
                            e++;
                            if (e >= f.length) {
                                e = 0
                            }
                        }
                    }
                    this.moveTo(d.x, d.y)
                } else {
                    this.lineTo(d.x, d.y)
                }
                this.prePoint = d;
                if (this.beginPoint == null) {
                    this.beginPoint = d
                }
            },
            curve: function(e) {
                if (typeof this.webkitLineDash != "undefined" && typeof this.lineDashOffset == "undefined" && this.lineWidth != 0) {
                    var g = this.webkitLineDash;
                    var d = this.prePoint;
                    var i = Utils.measureDistance(d, e);
                    var n = 0;
                    var b = 1 / i;
                    var l = d;
                    var f = 0;
                    var h = true;
                    var c = 0;
                    while (n < 1) {
                        n += b;
                        if (n > 1) {
                            n = 1
                        }
                        var k = {
                            x: d.x * Math.pow((1 - n), 3) + e.x1 * n * Math.pow((1 - n), 2) * 3 + e.x2 * Math.pow(n, 2) * (1 - n) * 3 + e.x * Math.pow(n, 3),
                            y: d.y * Math.pow((1 - n), 3) + e.y1 * n * Math.pow((1 - n), 2) * 3 + e.y2 * Math.pow(n, 2) * (1 - n) * 3 + e.y * Math.pow(n, 3)
                        };
                        var a = Utils.measureDistance(l, k);
                        if (a >= g[f] || n >= 1) {
                            if (h) {
                                var m = c + (n - c) / 2;
                                var j = {
                                    x: d.x * Math.pow((1 - m), 3) + e.x1 * m * Math.pow((1 - m), 2) * 3 + e.x2 * Math.pow(m, 2) * (1 - m) * 3 + e.x * Math.pow(m, 3),
                                    y: d.y * Math.pow((1 - m), 3) + e.y1 * m * Math.pow((1 - m), 2) * 3 + e.y2 * Math.pow(m, 2) * (1 - m) * 3 + e.y * Math.pow(m, 3)
                                };
                                this.lineTo(j.x, j.y);
                                this.lineTo(k.x, k.y)
                            } else {
                                this.moveTo(k.x, k.y)
                            }
                            h = !h;
                            l = k;
                            c = n;
                            f++;
                            if (f >= g.length) {
                                f = 0
                            }
                        }
                    }
                    this.moveTo(e.x, e.y)
                } else {
                    this.bezierCurveTo(e.x1, e.y1, e.x2, e.y2, e.x, e.y)
                }
                this.prePoint = e;
                if (this.beginPoint == null) {
                    this.beginPoint = e
                }
            },
            quadraticCurve: function(e) {
                if (typeof this.webkitLineDash != "undefined" && typeof this.lineDashOffset == "undefined" && this.lineWidth != 0) {
                    var g = this.webkitLineDash;
                    var d = this.prePoint;
                    var i = Utils.measureDistance(d, e);
                    var n = 0;
                    var b = 1 / i;
                    var l = d;
                    var f = 0;
                    var h = true;
                    var c = 0;
                    while (n < 1) {
                        n += b;
                        if (n > 1) {
                            n = 1
                        }
                        var k = {
                            x: d.x * Math.pow((1 - n), 2) + e.x1 * n * (1 - n) * 2 + e.x * Math.pow(n, 2),
                            y: d.y * Math.pow((1 - n), 2) + e.y1 * n * (1 - n) * 2 + e.y * Math.pow(n, 2)
                        };
                        var a = Utils.measureDistance(l, k);
                        if (a >= g[f] || n >= 1) {
                            if (h) {
                                var m = c + (n - c) / 2;
                                var j = {
                                    x: d.x * Math.pow((1 - m), 2) + e.x1 * m * (1 - m) * 2 + e.x * Math.pow(m, 2),
                                    y: d.y * Math.pow((1 - m), 2) + e.y1 * m * (1 - m) * 2 + e.y * Math.pow(m, 2)
                                };
                                this.lineTo(j.x, j.y);
                                this.lineTo(k.x, k.y)
                            } else {
                                this.moveTo(k.x, k.y)
                            }
                            h = !h;
                            l = k;
                            c = n;
                            f++;
                            if (f >= g.length) {
                                f = 0
                            }
                        }
                    }
                    this.moveTo(e.x, e.y)
                } else {
                    this.quadraticCurveTo(e.x1, e.y1, e.x, e.y)
                }
                this.prePoint = e;
                if (this.beginPoint == null) {
                    this.beginPoint = e
                }
            },
            close: function() {
                if (typeof this.webkitLineDash != "undefined" && typeof this.lineDashOffset == "undefined" && this.lineWidth != 0) {
                    var f = this.webkitLineDash;
                    var c = this.prePoint;
                    var d = this.beginPoint;
                    var h = Utils.measureDistance(c, d);
                    var k = 0;
                    var b = 1 / h;
                    var j = c;
                    var e = 0;
                    var g = true;
                    while (k < 1) {
                        k += b;
                        if (k > 1) {
                            k = 1
                        }
                        var i = {
                            x: (1 - k) * c.x + k * d.x,
                            y: (1 - k) * c.y + k * d.y
                        };
                        var a = Utils.measureDistance(j, i);
                        if (a >= f[e] || k >= 1) {
                            if (g) {
                                this.lineTo(i.x, i.y)
                            } else {
                                this.moveTo(i.x, i.y)
                            }
                            g = !g;
                            j = i;
                            e++;
                            if (e >= f.length) {
                                e = 0
                            }
                        }
                    }
                }
                this.closePath()
            }
        },
        setLineDash: function(a, b) {
            if (!a.setLineDash) {
                a.setLineDash = function() {}
            }
            a.setLineDash(b);
            a.mozDash = b;
            a.webkitLineDash = b
        },
        renderShapePath: function(a, b, c, d) {
            var e;
            if (c && b.drawIcon) {
                e = b.drawIcon(b.props.w, b.props.h)
            } else {
                e = b.getPath()
            }
            this.renderPath(a, b, e, c, d)
        },
        renderPath: function(m, k, o, b, f) {
            var a = Utils.getShapeFillStyle(k.fillStyle, !b);
            var p = Utils.getShapeLineStyle(k.lineStyle, !b);
            for (var g = 0; g < o.length; g++) {
                var c = o[g];
                m.save();
                var h = $.extend({}, p, c.lineStyle);
                var l = $.extend({}, a, c.fillStyle);
                var d = false;
                if (h.lineStyle != "solid" && typeof m.lineDashOffset == "undefined" && l.type != "none") {
                    d = true
                }
                if (d) {
                    m.save();
                    m.beginPath();
                    m.lineWidth = 0;
                    delete m.webkitLineDash;
                    for (var e = 0; e < c.actions.length; e++) {
                        var n = c.actions[e];
                        this.actions[n.action].call(m, n)
                    }
                    this.fillShape(k, m, l, f);
                    m.restore()
                }
                m.beginPath();
                m.beginPoint = null;
                if (h.lineWidth) {
                    m.lineWidth = h.lineWidth;
                    if (h.lineStyle == "dashed") {
                        if (b) {
                            this.setLineDash(m, [h.lineWidth * 3, h.lineWidth * 1])
                        } else {
                            this.setLineDash(m, [h.lineWidth * 5, h.lineWidth * 2])
                        }
                    } else {
                        if (h.lineStyle == "dot") {
                            this.setLineDash(m, [h.lineWidth, h.lineWidth * 1.5])
                        } else {
                            if (h.lineStyle == "dashdot") {
                                this.setLineDash(m, [h.lineWidth * 5, h.lineWidth * 2, h.lineWidth, h.lineWidth * 2])
                            } else {
                                delete m.webkitLineDash
                            }
                        }
                    }
                } else {
                    m.lineWidth = 0;
                    delete m.webkitLineDash
                }
                for (var e = 0; e < c.actions.length; e++) {
                    var n = c.actions[e];
                    this.actions[n.action].call(m, n)
                }
                if (d == false) {
                    this.fillShape(k, m, l, f)
                }
                if (h.lineWidth) {
                    m.lineWidth = h.lineWidth;
                    m.strokeStyle = "rgb(" + h.lineColor + ")";
                    m.stroke()
                }
                m.restore()
            }
        },
        drawImage: function(a, b) {
            var c = $(".shape_img[src='" + b.image + "']");
            if (c.length == 0) {
                c = $("<img class='shape_img' loaded='0' src=''/>").appendTo("#shape_img_container");
                c.bind("load.drawshape", function() {
                    a.drawImage(c[0], b.x, b.y, b.w, b.h);
                    $(this).attr("loaded", "1")
                });
                c.attr("src", b.image)
            } else {
                if (c.attr("loaded") == "0") {
                    c.bind("load.drawshape", function() {
                        a.drawImage(c[0], b.x, b.y, b.w, b.h)
                    })
                } else {
                    a.drawImage(c[0], b.x, b.y, b.w, b.h)
                }
            }
        },
        drawPanelItem: function(d, e) {
            var b = d.getContext("2d");
            var c = Utils.copy(Schema.shapes[e]);
            var f = {
                x: 0,
                y: 0,
                w: c.props.w,
                h: c.props.h,
                angle: c.props.angle
            };
            b.clearRect(0, 0, Designer.config.panelItemWidth, Designer.config.panelItemHeight);
            if (f.w >= Designer.config.panelItemWidth || f.h >= Designer.config.panelItemWidth) {
                var a = Utils.getShapeLineStyle(c.lineStyle, false);
                if (c.props.w >= c.props.h) {
                    f.w = Designer.config.panelItemWidth - a.lineWidth * 2;
                    f.h = parseInt(c.props.h / c.props.w * f.w)
                } else {
                    f.h = Designer.config.panelItemHeight - a.lineWidth * 2;
                    f.w = parseInt(c.props.w / c.props.h * f.h)
                }
            }
            c.props = f;
            b.save();
            b.lineJoin = "round";
            b.globalAlpha = c.shapeStyle.alpha;
            var h = (Designer.config.panelItemWidth - f.w) / 2;
            var g = (Designer.config.panelItemHeight - f.h) / 2;
            b.translate(h, g);
            b.translate(f.w / 2, f.h / 2);
            b.rotate(f.angle);
            b.translate(-(f.w / 2), -(f.h / 2));
            this.renderShapePath(b, c, true, function() {
                Designer.painter.drawPanelItem(d, e)
            });
            this.renderMarkers(b, c, true);
            b.restore()
        },
        renderShape: function(j) {
            if (j.name == "linker") {
                this.renderLinker(j);
                return
            }
            var m = $("#" + j.id);
            if (m.length == 0) {
                var c = $("#designer_canvas");
                m = $("<div id='" + j.id + "' class='shape_box'><canvas class='shape_canvas'></canvas></div>").appendTo(c)
            }
            if (typeof isView != "undefined" && j.link) {
                var h = j.link;
                if (h.trim().toLowerCase().indexOf("http") == -1) {
                    h = "http://" + h
                }
                var k = $("<a title='" + j.link + "' target='_blank' href='" + h + "' class='shape_link'></a>");
                k.appendTo(m)
            }
            if (j.attribute && j.attribute.collapseBy) {
                m.hide()
            } else {
                m.show()
            }
            var e = Utils.getShapeBox(j);
            var b = (e.w + 20).toScale();
            var f = (e.h + 20).toScale();
            m.find(".shape_canvas").attr({
                width: b,
                height: f
            });
            m.css({
                left: (e.x - 10).toScale() + "px",
                top: (e.y - 10).toScale() + "px",
                width: b,
                height: f
            });
            var n = m.find(".shape_canvas")[0].getContext("2d");
            n.clearRect(0, 0, j.props.w + 20, j.props.h + 20);
            n.scale(Designer.config.scale, Designer.config.scale);
            n.translate(10, 10);
            n.translate(j.props.x - e.x, j.props.y - e.y);
            n.translate(j.props.w / 2, j.props.h / 2);
            n.rotate(j.props.angle);
            n.translate(-(j.props.w / 2), -(j.props.h / 2));
            n.globalAlpha = j.shapeStyle.alpha;
            n.lineJoin = "round";
            this.renderShapePath(n, j, false, function() {
                var q = j.id;
                var r = Model.getShapeById(q);
                Designer.painter.renderShape(r)
            });
            this.renderMarkers(n, j);
            var p = j.getPath();
            var l = Utils.copy(p[p.length - 1]);
            l.fillStyle = {
                type: "none"
            };
            l.lineStyle = {
                lineWidth: 0
            };
            var d = [l];
            this.renderPath(n, j, d);
            this.renderText(j, e);
            this.renderDataAttributes(j, e);
            m.children(".shape_comment_ico").remove();
            if (showCommentIco) {
                var i = false;
                if (Model.comments && Model.comments.length > 0) {
                    for (var o = 0; o < Model.comments.length; o++) {
                        var a = Model.comments[o];
                        if (a.shapeId == j.id) {
                            i = true;
                            break
                        }
                    }
                }
                if (i) {
                    var g = $("<div class='shape_comment_ico'></div>").appendTo(m);
                    g.bind("mousedown", function(q) {
                        q.stopPropagation();
                        Dock.showView("comment");
                        Utils.selectShape(j.id)
                    })
                }
            }
        },
        fillShape: function(c, a, b, e) {
            a.save();
            if (b.type != "none" && typeof b.alpha != "undefined") {
                a.globalAlpha = b.alpha
            }
            if (b.type == "solid") {
                a.fillStyle = "rgb(" + b.color + ")";
                a.fill()
            } else {
                if (b.type == "gradient") {
                    var h;
                    if (b.gradientType == "linear") {
                        h = GradientHelper.createLinearGradient(c, a, b)
                    } else {
                        h = GradientHelper.createRadialGradient(c, a, b)
                    }
                    a.fillStyle = h;
                    a.fill()
                } else {
                    if (b.type == "image") {
                        var d;
                        if (b.fileId.indexOf("qiniu/") >= 0) {
                            d = b.fileId.replace(/^qiniu/, "http://7xpicf.com1.z0.glb.clouddn.com")
                        } else {
                            if (b.fileId.indexOf("http") == 0) {
                                d = b.fileId
                            } else {
                                if (b.fileId.indexOf("/images/") >= 0) {
                                    d = b.fileId;
                                    if (localRuntime) {
                                        d = "http://localhost:8080" + d
                                    }
                                } else {
                                    d = "/file/id/" + b.fileId + "/diagram_user_image";
                                    if (localRuntime) {
                                        d = "http://localhost:8080" + d
                                    }
                                }
                            }
                        }
                        var g = $(".shape_img[src='" + d + "']");
                        if (g.length == 0) {
                            g = $("<img class='shape_img' loaded='0' src=''/>").appendTo("#shape_img_container");
                            g.bind("load.drawshape", function() {
                                $(this).attr("loaded", "1");
                                if (e) {
                                    e()
                                }
                            });
                            g.attr("src", d)
                        } else {
                            if (g.attr("loaded") == "0") {
                                g.bind("load.drawshape", function() {
                                    if (e) {
                                        e()
                                    }
                                })
                            } else {
                                f(g)
                            }
                        }
                    }
                }
            }
            a.restore();
            function f(j) {
                a.save();
                a.clip();
                if (b.display == "fit") {
                    var n = j.width();
                    var k = j.height();
                    var q = n / k;
                    var m = c.props.w / c.props.h;
                    if (q > m) {
                        var l = c.props.w;
                        var p = 0;
                        var i = l / q;
                        var o = c.props.h / 2 - i / 2;
                        a.drawImage(j[0], p, o, l, i)
                    } else {
                        var i = c.props.h;
                        var o = 0;
                        var l = i * q;
                        var p = c.props.w / 2 - l / 2;
                        a.drawImage(j[0], p, o, l, i)
                    }
                } else {
                    if (b.display == "stretch") {
                        a.drawImage(j[0], 0, 0, c.props.w, c.props.h)
                    } else {
                        if (b.display == "original") {
                            var n = j.width();
                            var k = j.height();
                            var p = c.props.w / 2 - n / 2;
                            var o = c.props.h / 2 - k / 2;
                            a.drawImage(j[0], p, o, n, k)
                        } else {
                            if (b.display == "tile") {
                                var p = 0;
                                var n = j.width();
                                var k = j.height();
                                while (p < c.props.w) {
                                    var o = 0;
                                    while (o < c.props.h) {
                                        a.drawImage(j[0], p, o, n, k);
                                        o += k
                                    }
                                    p += n
                                }
                            } else {
                                if (b.display == "static") {
                                    var p = 0;
                                    var n = j.width();
                                    var k = j.height();
                                    a.drawImage(j[0], b.imageX, b.imageY, n, k)
                                } else {
                                    var n = j.width();
                                    var k = j.height();
                                    var q = n / k;
                                    var m = c.props.w / c.props.h;
                                    if (q > m) {
                                        var i = c.props.h;
                                        var o = 0;
                                        var l = i * q;
                                        var p = c.props.w / 2 - l / 2;
                                        a.drawImage(j[0], p, o, l, i)
                                    } else {
                                        var l = c.props.w;
                                        var p = 0;
                                        var i = l / q;
                                        var o = c.props.h / 2 - i / 2;
                                        a.drawImage(j[0], p, o, l, i)
                                    }
                                }
                            }
                        }
                    }
                }
                a.restore()
            }
        },
        renderText: function(a, u) {
            var o = $("#" + a.id);
            var b = a.getTextBlock();
            o.find(".text_canvas").remove();
            for (var n = 0; n < b.length; n++) {
                var s = b[n];
                var l = o.find(".text_canvas[ind=" + n + "]");
                if (l.length == 0) {
                    l = $("<textarea class='text_canvas' forshape='" + a.id + "' ind='" + n + "'></textarea>").appendTo(o);
                    l.bind("focus", function() {
                        $(this).blur()
                    })
                }
                l.attr("readonly", "readonly");
                if (!s.text || s.text.trim() == "") {
                    l.css({
                        height: "0px",
                        width: "0px"
                    }).hide();
                    continue
                }
                var d = Utils.getShapeFontStyle(a.fontStyle);
                d = $.extend({}, d, s.fontStyle);
                var q = d.fontFamily;
                if (localRuntime) {
                    if (Utils.containsChinese(s.text) && !Utils.containsChinese(q)) {
                        q = "宋体"
                    }
                }
                var p = {
                    "line-height": Math.round(d.size * 1.25) + "px",
                    "font-size": d.size + "px",
                    "font-family": q,
                    "font-weight": d.bold ? "bold" : "normal",
                    "font-style": d.italic ? "italic" : "normal",
                    "text-align": d.textAlign,
                    color: "rgb(" + d.color + ")",
                    "text-decoration": d.underline ? "underline" : "none",
                    opacity: a.shapeStyle.alpha
                };
                l.css(p);
                l.show();
                var e = s.position;
                if (d.orientation == "horizontal") {
                    var h = {
                        x: e.x + e.w / 2,
                        y: e.y + e.h / 2
                    };
                    e = {
                        x: h.x - e.h / 2,
                        y: h.y - e.w / 2,
                        w: e.h,
                        h: e.w
                    }
                }
                l.css({
                    width: e.w
                });
                l.height(0);
                l.val(s.text);
                l.scrollTop(99999);
                var v = l.scrollTop();
                var m = 0;
                if (d.vAlign == "middle") {
                    m = (e.y + e.h / 2 - v / 2)
                } else {
                    if (d.vAlign == "bottom") {
                        m = (e.y + e.h - v)
                    } else {
                        m = e.y
                    }
                }
                var g = {
                    x: e.x + e.w / 2,
                    y: m + v / 2
                };
                var f = a.props.angle;
                if (f != 0) {
                    var t = {
                        x: a.props.w / 2,
                        y: a.props.h / 2
                    };
                    g = Utils.getRotated(t, g, f)
                }
                if (d.orientation == "horizontal") {
                    f = (Math.PI * 1.5 + f) % (Math.PI * 2)
                }
                var j = Math.round(f / (Math.PI * 2) * 360);
                var r = "rotate(" + j + "deg) scale(" + Designer.config.scale + ")";
                var c = e.w;
                var k = v;
                l.css({
                    width: c,
                    height: k,
                    left: (g.x + (a.props.x - u.x) + 10).toScale() - e.w / 2,
                    top: (g.y + (a.props.y - u.y) + 10).toScale() - v / 2,
                    "-webkit-transform": r,
                    "-ms-transform": r,
                    "-o-transform": r,
                    "-moz-transform": r,
                    transform: r
                })
            }
        },
        calculateTextLines: function(g, u, n) {
            var f = u.w;
            var r = u.h;
            var a = [];
            var c = g.split(/\n/);
            for (var q = 0; q < c.length; q++) {
                var l = c[q];
                var m = n.measureText(l);
                if (m.width <= f) {
                    a.push(l)
                } else {
                    var k = l.split(/\s/);
                    var e = "";
                    for (var o = 0; o < k.length; o++) {
                        var t = k[o];
                        if (o != k.length - 1) {
                            t += " "
                        }
                        var v = n.measureText(t).width;
                        if (v > f) {
                            for (var b = 0; b < t.length; b++) {
                                var s = e + t[b];
                                var d = n.measureText(s).width;
                                if (d > f) {
                                    a.push(e);
                                    e = t[b]
                                } else {
                                    e = s
                                }
                            }
                        } else {
                            var s = e + t;
                            var d = n.measureText(s).width;
                            if (d > f) {
                                a.push(e);
                                e = t
                            } else {
                                e = s
                            }
                        }
                    }
                    if (e != "") {
                        a.push(e)
                    }
                }
            }
            return a
        },
        renderMarkers: function(l, g, c) {
            if (g.attribute && g.attribute.markers && g.attribute.markers.length > 0) {
                var d = g.attribute.markers;
                var m = Schema.config.markerSize;
                var h = 4;
                if (c) {
                    m = 10
                }
                var e = g.attribute.markerOffset;
                if (c) {
                    e = 5
                }
                var b = d.length * m + (d.length - 1) * h;
                var j = g.props.w / 2 - b / 2;
                for (var f = 0; f < d.length; f++) {
                    var k = d[f];
                    l.save();
                    l.translate(j, g.props.h - m - e);
                    var a = Schema.markers[k].call(g, m);
                    this.renderPath(l, g, a);
                    l.restore();
                    j += m + h
                }
            }
        },
        renderDataAttributes: function(e, h) {
            $("#" + e.id).children(".attr_canvas").remove();
            if (!e.dataAttributes || e.dataAttributes.length == 0) {
                return
            }
            var d = {
                x: e.props.w / 2,
                y: e.props.h / 2
            };
            var a = Utils.getShapeFontStyle(e);
            for (var c = 0; c < e.dataAttributes.length; c++) {
                var f = e.dataAttributes[c];
                if (f.showType == "none") {
                    continue
                }
                var j = "";
                var g = "";
                if (f.showName) {
                    j = f.name + ": "
                }
                if (f.showType == "text") {
                    j += f.value
                } else {
                    if (f.showType == "icon") {
                        g = f.icon
                    }
                }
                if (j == "" && g == "") {
                    continue
                }
                b(f, j, g)
            }
            function b(z, r, D) {
                var E = z.horizontal;
                var k = z.vertical;
                var l = $("<canvas id='attr_canvas_" + z.id + "' class='attr_canvas'></canvas>").appendTo($("#" + e.id));
                var A = l[0].getContext("2d");
                var s = "12px ";
                var C = a.fontFamily;
                if (localRuntime) {
                    if (Utils.containsChinese(r) && !Utils.containsChinese(C)) {
                        C = "宋体"
                    }
                }
                s += C;
                A.font = s;
                var q = A.measureText(r).width;
                var B = 20;
                if (D != "") {
                    q += 20
                }
                var p, o;
                if (E == "mostleft") {
                    p = -q - 2
                } else {
                    if (E == "leftedge") {
                        p = -q / 2
                    } else {
                        if (E == "left") {
                            p = 2
                        } else {
                            if (E == "center") {
                                p = (e.props.w - q) / 2
                            } else {
                                if (E == "right") {
                                    p = e.props.w - q - 2
                                } else {
                                    if (E == "rightedge") {
                                        p = e.props.w - q / 2
                                    } else {
                                        p = e.props.w + 2
                                    }
                                }
                            }
                        }
                    }
                }
                if (k == "mosttop") {
                    o = -B
                } else {
                    if (k == "topedge") {
                        o = -B / 2
                    } else {
                        if (k == "top") {
                            o = 0
                        } else {
                            if (k == "middle") {
                                o = (e.props.h - B) / 2
                            } else {
                                if (k == "bottom") {
                                    o = e.props.h - B
                                } else {
                                    if (k == "bottomedge") {
                                        o = e.props.h - B / 2
                                    } else {
                                        o = e.props.h
                                    }
                                }
                            }
                        }
                    }
                }
                var F = {
                    x: p,
                    y: o,
                    w: q,
                    h: B
                };
                var n = Utils.getRotatedBox(F, e.props.angle, d);
                l.attr({
                    width: n.w.toScale(),
                    height: n.h.toScale()
                });
                A.font = s;
                var v = (n.x + (e.props.x - h.x) + 10).toScale();
                var u = (n.y + (e.props.y - h.y) + 10).toScale();
                l.css({
                    left: v,
                    top: u
                });
                A.scale(Designer.config.scale, Designer.config.scale);
                A.translate(n.w / 2, n.h / 2);
                A.rotate(e.props.angle);
                A.translate(-n.w / 2, -n.h / 2);
                A.translate((n.w - F.w) / 2, (n.h - F.h) / 2);
                A.globalAlpha = e.shapeStyle.alpha;
                if (z.type == "link") {
                    A.fillStyle = "#4183C4"
                } else {
                    A.fillStyle = "#333"
                }
                A.textBaseline = "middle";
                A.fillText(r, 0, B / 2);
                if (D != "") {
                    var i = "/images/data-attr/" + D + ".png";
                    if (localRuntime) {
                        i = "http://localhost:8080" + i
                    }
                    var t = $(".shape_img[src='" + i + "']");
                    if (t.length == 0) {
                        t = $("<img class='shape_img' loaded='false' src='" + i + "'/>").appendTo("#shape_img_container")
                    }
                    if (t.attr("loaded") == "true") {
                        A.drawImage(t[0], F.w - 20, 0, 20, 20)
                    } else {
                        t.bind("load.drawshape", function() {
                            $(this).attr("loaded", "true");
                            A.drawImage(t[0], F.w - 20, 0, 20, 20)
                        })
                    }
                }
                A.beginPath();
                A.rect(0, 0, q, B);
                A.closePath();
                if (z.type == "link") {
                    var m = $("<a href='" + z.value + "' target='_blank' class='attr_link'></canvas>").appendTo($("#" + e.id));
                    m.css({
                        left: v,
                        top: u,
                        width: n.w.toScale(),
                        height: n.h.toScale(),
                        position: "absolute"
                    })
                }
            }
        },
        /**
		 * 绘制连接线
		 * @param {} linker 连接线对象
		 */
		renderLinker: function(linker, pointChanged){
            // console.log('Frida Test 3')
            

			if(pointChanged){
				//如果渲染时，连接线的点发成了改变，重新查找
                linker.points = Utils.getLinkerPoints(linker);
            }
            



			//重新获取一下points，有些错误图形可能没有points
			if(linker.linkerType == "curve" || linker.linkerType == "broken"){
				if(!linker.points || linker.points.length == 0){
					linker.points = Utils.getLinkerPoints(linker);
				}
            }
            




			//找到连接线上的点
			var points = linker.points;
			var from = linker.from;
			var to = linker.to;
			//先决定矩形容器的坐标、宽高信息
			var minX = to.x;
			var minY = to.y;
			var maxX = from.x;
			var maxY = from.y;
			if(to.x < from.x){
				minX = to.x;
				maxX = from.x;
			}else{
				minX = from.x;;
				maxX = to.x;
			}
			if(to.y < from.y){
				minY = to.y;
				maxY = from.y;
			}else{
				minY = from.y;;
				maxY = to.y;
			}
			for(var i = 0; i < points.length; i++){
				var point = points[i];
				if(point.x < minX){
					minX = point.x;
				}else if(point.x > maxX){
					maxX = point.x;
				}
				if(point.y < minY){
					minY = point.y;
				}else if(point.y > maxY){
					maxY = point.y;
				}
			}
			var box = {
				x: minX,
				y: minY,
				w: maxX - minX,
				h: maxY - minY
            }
            



			var linkerBox = $("#" + linker.id);
			if(linkerBox.length == 0){
				//如果不存在，要执行创建
				var superCanvas = $("#designer_canvas");
				linkerBox = $("<div id='"+linker.id+"' class='shape_box linker_box'><canvas class='shape_canvas'></canvas></div>").appendTo(superCanvas);
            }
            

			var linkerCanvas = linkerBox.find(".shape_canvas");
			linkerCanvas.attr({
				width: (box.w + 20).toScale(),
				height: (box.h + 20).toScale()
			});
			linkerBox.css({
				left: (box.x - 10).toScale(),
				top: (box.y - 10).toScale(),
				width: (box.w + 20).toScale(),
				height: (box.h + 20).toScale()
			});
			//执行绘制连线
			var ctx = linkerCanvas[0].getContext("2d");
			ctx.scale(Designer.config.scale, Designer.config.scale);
			ctx.translate(10, 10);
			//定义绘制样式
			var style = linker.lineStyle;
			ctx.lineWidth = style.lineWidth;
			ctx.strokeStyle = "rgb("+style.lineColor+")";
			ctx.fillStyle = "rgb("+style.lineColor+")";
			ctx.save();
			var begin = {x: from.x - box.x, y: from.y - box.y};
			var end = {x: to.x - box.x, y: to.y - box.y};
			ctx.save();
			//开始绘制连线
			if(style.lineStyle == "dashed"){
				//虚线
				this.setLineDash(ctx, [style.lineWidth * 8, style.lineWidth * 4]);
			}else if(style.lineStyle == "dot"){
				//点线
				this.setLineDash(ctx, [style.lineWidth, style.lineWidth * 2]);
			}else if(style.lineStyle == "dashdot"){
				//点线
				this.setLineDash(ctx, [style.lineWidth * 8, style.lineWidth * 3, style.lineWidth, style.lineWidth * 3]);
			}
			ctx.beginPath();
			ctx.moveTo(begin.x, begin.y);
			if(linker.linkerType == "curve"){
				var cp1 = points[0];
				var cp2 = points[1];
				ctx.bezierCurveTo(cp1.x - box.x, cp1.y - box.y, cp2.x - box.x, cp2.y - box.y, end.x, end.y);
			}else{
				for(var i = 0; i < points.length; i++){
					//如果是折线，会有折点
					var linkerPoint = points[i];
					ctx.lineTo(linkerPoint.x - box.x, linkerPoint.y - box.y);
				}
				ctx.lineTo(end.x, end.y);
			}
			var selected = Utils.isSelected(linker.id);
			if(selected){
				//如果是选中了，绘制阴影
				ctx.shadowBlur = 4;
				ctx.shadowColor = "#833";
				if(linker.linkerType == "curve" && Utils.getSelectedIds().length == 1){
					//连接线为曲线，并且只选中了一条
				}
			}
			ctx.stroke();
			ctx.restore(); //还原虚线样式和阴影
			//开始绘制箭头
			var fromAngle = Utils.getEndpointAngle(linker, "from");
			drawArrow(begin, fromAngle, from.id, style.beginArrowStyle, linker, from.angle);
			var toAngle = Utils.getEndpointAngle(linker, "end");
			drawArrow(end, toAngle, to.id, style.endArrowStyle, linker, to.angle);
			ctx.restore();
			//绘制文字
			this.renderLinkerText(linker);
			/**
			 * 绘制箭头
			 */
			function drawArrow(point, pointAngle, linkShapeId, style, linker, linkerAngle){
				if(style == "normal"){
					//箭头
					var arrowLength = 12; //箭头长度
					var arrowAngle = Math.PI / 5;  //箭头角度
					var hypotenuse = arrowLength / Math.cos(arrowAngle); //箭头斜边长度
					var leftArrowX = point.x - hypotenuse * Math.cos(pointAngle - arrowAngle);
					var leftArrowY = point.y - hypotenuse * Math.sin(pointAngle - arrowAngle);
					var rightArrowX = point.x - hypotenuse * Math.sin(Math.PI / 2 - pointAngle - arrowAngle);
					var rightArrowY = point.y - hypotenuse * Math.cos(Math.PI / 2 - pointAngle - arrowAngle);
					ctx.beginPath();
					ctx.moveTo(leftArrowX, leftArrowY);
					ctx.lineTo(point.x, point.y);
					ctx.lineTo(rightArrowX, rightArrowY);
					ctx.stroke();
				}else if(style == "solidArrow"){
					//实心箭头
					var arrowLength = 12; //箭头长度
					var arrowAngle = Math.PI / 10;  //箭头角度
					var hypotenuse = arrowLength / Math.cos(arrowAngle); //箭头斜边长度
					var leftArrowX = point.x - hypotenuse * Math.cos(pointAngle - arrowAngle);
					var leftArrowY = point.y - hypotenuse * Math.sin(pointAngle - arrowAngle);
					var rightArrowX = point.x - hypotenuse * Math.sin(Math.PI / 2 - pointAngle - arrowAngle);
					var rightArrowY = point.y - hypotenuse * Math.cos(Math.PI / 2 - pointAngle - arrowAngle);
					ctx.beginPath();
					ctx.moveTo(point.x, point.y);
					ctx.lineTo(leftArrowX, leftArrowY);
					ctx.lineTo(rightArrowX, rightArrowY);
					ctx.lineTo(point.x, point.y);
					ctx.closePath();
					ctx.fill();
					ctx.stroke();
				}else if(style == "dashedArrow"){
					//空心箭头
					ctx.save();
					var arrowLength = 12; //箭头长度
					var arrowAngle = Math.PI / 10;  //箭头角度
					var hypotenuse = arrowLength / Math.cos(arrowAngle); //箭头斜边长度
					var leftArrowX = point.x - hypotenuse * Math.cos(pointAngle - arrowAngle);
					var leftArrowY = point.y - hypotenuse * Math.sin(pointAngle - arrowAngle);
					var rightArrowX = point.x - hypotenuse * Math.sin(Math.PI / 2 - pointAngle - arrowAngle);
					var rightArrowY = point.y - hypotenuse * Math.cos(Math.PI / 2 - pointAngle - arrowAngle);
					ctx.beginPath();
					ctx.moveTo(point.x, point.y);
					ctx.lineTo(leftArrowX, leftArrowY);
					ctx.lineTo(rightArrowX, rightArrowY);
					ctx.lineTo(point.x, point.y);
					ctx.closePath();
					ctx.fillStyle = "white";
					ctx.fill();
					ctx.stroke();
					ctx.restore();
				}else if(style == "solidCircle"){
					//实心圆
					ctx.save();
					var circleRadius = 4;
					var circleX = point.x - circleRadius * Math.cos(pointAngle);
					var circleY = point.y - circleRadius * Math.sin(pointAngle);
					ctx.beginPath();
					ctx.arc(circleX, circleY, circleRadius, 0, Math.PI * 2, false);
					ctx.closePath();
					ctx.fill();
					ctx.stroke();
					ctx.restore();
				}else if(style == "dashedCircle"){
					//空心圆
					ctx.save();
					var circleRadius = 4;
					var circleX = point.x - circleRadius * Math.cos(pointAngle);
					var circleY = point.y - circleRadius * Math.sin(pointAngle);
					ctx.beginPath();
					ctx.arc(circleX, circleY, circleRadius, 0, Math.PI * 2, false);
					ctx.closePath();
					ctx.fillStyle = "white";
					ctx.fill();
					ctx.stroke();
					ctx.restore();
				}else if(style == "solidDiamond"){
					//实心菱形
					ctx.save();
					var arrowLength = 8; //箭头长度
					var arrowAngle = Math.PI / 7;  //箭头角度
					var hypotenuse = arrowLength / Math.cos(arrowAngle); //箭头斜边长度
					var leftArrowX = point.x - hypotenuse * Math.cos(pointAngle - arrowAngle);
					var leftArrowY = point.y - hypotenuse * Math.sin(pointAngle - arrowAngle);
					var rightArrowX = point.x - hypotenuse * Math.sin(Math.PI / 2 - pointAngle - arrowAngle);
					var rightArrowY = point.y - hypotenuse * Math.cos(Math.PI / 2 - pointAngle - arrowAngle);
					//菱形在线上的一点的坐标
					var lineX = point.x - arrowLength * 2 * Math.cos(pointAngle);
					var lineY = point.y - arrowLength * 2 * Math.sin(pointAngle);
					ctx.beginPath();
					ctx.moveTo(point.x, point.y);
					ctx.lineTo(leftArrowX, leftArrowY);
					ctx.lineTo(lineX, lineY);
					ctx.lineTo(rightArrowX, rightArrowY);
					ctx.lineTo(point.x, point.y);
					ctx.closePath();
					ctx.fill();
					ctx.stroke();
					ctx.restore();
				}else if(style == "dashedDiamond"){
					//空心菱形
					ctx.save();
					var arrowLength = 8; //箭头长度
					var arrowAngle = Math.PI / 7;  //箭头角度
					var hypotenuse = arrowLength / Math.cos(arrowAngle); //箭头斜边长度
					var leftArrowX = point.x - hypotenuse * Math.cos(pointAngle - arrowAngle);
					var leftArrowY = point.y - hypotenuse * Math.sin(pointAngle - arrowAngle);
					var rightArrowX = point.x - hypotenuse * Math.sin(Math.PI / 2 - pointAngle - arrowAngle);
					var rightArrowY = point.y - hypotenuse * Math.cos(Math.PI / 2 - pointAngle - arrowAngle);
					//菱形在线上的一点的坐标
					var lineX = point.x - arrowLength * 2 * Math.cos(pointAngle);
					var lineY = point.y - arrowLength * 2 * Math.sin(pointAngle);
					ctx.beginPath();
					ctx.moveTo(point.x, point.y);
					ctx.lineTo(leftArrowX, leftArrowY);
					ctx.lineTo(lineX, lineY);
					ctx.lineTo(rightArrowX, rightArrowY);
					ctx.lineTo(point.x, point.y);
					ctx.closePath();
					ctx.fillStyle = "white";
					ctx.fill();
					ctx.stroke();
					ctx.restore();
				}else if(style == "cross"){
					//交叉
					var arrowW = 6; //交叉线的宽度
					var arrowL = 14;
					var offsetX = arrowW * Math.cos(Math.PI / 2 - pointAngle);
					var offsetY = arrowW * Math.sin(Math.PI / 2 - pointAngle);
					var x1 = point.x + offsetX;
					var y1 = point.y - offsetY;
					var lineX = point.x - arrowL * Math.cos(pointAngle);
					var lineY = point.y - arrowL * Math.sin(pointAngle);
					var x2 = lineX - offsetX;
					var y2 = lineY + offsetY;
					ctx.beginPath();
					ctx.moveTo(x1, y1);
					ctx.lineTo(x2, y2);
					ctx.stroke();
				}
				if(linkShapeId && style != "solidCircle" && style != "dashedCircle"){
					var linkShape = Model.getShapeById(linkShapeId);
					if(linkShape){
						ctx.save();
						ctx.translate(point.x, point.y);
						ctx.rotate(linkerAngle);
						ctx.translate(-point.x, -point.y);
						var clearX = point.x - linkShape.lineStyle.lineWidth/2;
						var clearY = point.y - linker.lineStyle.lineWidth*1.2;
						var clearW = linker.lineStyle.lineWidth * 2;
						var clearH = linker.lineStyle.lineWidth * 1.8;
						var clearSize = 1;
						var clearingX = clearX;
						while(clearingX <= clearX + clearW){
							var clearingY = clearY;
							while(clearingY <= clearY + clearH){
								ctx.clearRect(clearingX, clearingY, 1.5, 1.5);
								clearingY += clearSize;
							}
							clearingX += clearSize;
						}
						ctx.restore();
					}
				}
			}
		},
       
        renderLinkerText: function(h) {
            var g = $("#" + h.id);
            var b = g.find(".text_canvas");
            if (b.length == 0) {
                b = $("<div class='text_canvas linker_text'></div>").appendTo(g)
            }
            var e = Utils.getLinkerFontStyle(h.fontStyle);
            var c = "scale(" + Designer.config.scale + ")";
            var f = e.fontFamily;
            if (localRuntime) {
                if (Utils.containsChinese(h.text) && !Utils.containsChinese(f)) {
                    f = "宋体"
                }
            }
            var a = {
                "line-height": Math.round(e.size * 1.25) + "px",
                "font-size": e.size + "px",
                "font-family": f,
                "font-weight": e.bold ? "bold" : "normal",
                "font-style": e.italic ? "italic" : "normal",
                "text-align": e.textAlign,
                color: "rgb(" + e.color + ")",
                "text-decoration": e.underline ? "underline" : "none",
                "-webkit-transform": c,
                "-ms-transform": c,
                "-o-transform": c,
                "-moz-transform": c,
                transform: c
            };
            b.css(a);
            if (h.text == null || h.text == "") {
                b.hide();
                return
            }
            b.show();
            var i = h.text.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br/>");
            b.html(i + "<br/>");
            if (typeof h.textPos != "undefined") {
                b.css({
                    left: h.textPos.x,
                    top: h.textPos.y
                });
                return
            }
            var j = this.getLinkerMidpoint(h);
            if (j.x != null) {
                var d = g.position();
                b.css({
                    left: j.x.toScale() - d.left - b.width() / 2,
                    top: j.y.toScale() - d.top - b.height() / 2
                })
            }
        },
        /**
		 * 获取到连接线的中点坐标
		 * @param {} linker
		 */
		getLinkerMidpoint: function(linker){
			var point = {};
			if(linker.linkerType == "normal"){
				//直线时，根据公式：B(t) = (1-t)P0 + tP1，t=0.5时，在线中点
				point = {
					x: 0.5*linker.from.x + 0.5*linker.to.x,
					y: 0.5*linker.from.y + 0.5*linker.to.y
				}
			}else if(linker.linkerType == "curve"){
				//曲线时，根据公式：B(t) = P0(1-t)^3 + 3P1t(1-t)^2 + 3P2t^2(1-t) + P3t^3，t=0.5时，在线中点
				var p0 = linker.from;
				var p1 = linker.points[0];
				var p2 = linker.points[1];
				var p3 = linker.to;
				point = {
					x: p0.x*0.125 + p1.x*0.375 + p2.x*0.375 + p3.x*0.125,
					y: p0.y*0.125 + p1.y*0.375 + p2.y*0.375 + p3.y*0.125
				}
			}else{
				//折线时，计算每一笔的长度，找中点
				var points = [];
				points.push(linker.from);
				points = points.concat(linker.points);
				points.push(linker.to);
				//先求连接线的全长
				var totalLength = 0;
				for(var pi = 1; pi < points.length; pi++){
					var p1 = points[pi - 1];
					var p2 = points[pi];
					//计算一段的长
					var d = Utils.measureDistance(p1, p2);
					totalLength += d;
				}
				var halfLength = totalLength / 2; //连接线长度的一半
				var growLength = 0;
				for(var pi = 1; pi < points.length; pi++){
					var p1 = points[pi - 1];
					var p2 = points[pi];
					//计算一段的长
					var d = Utils.measureDistance(p1, p2);
					var temp = growLength + d;
					if(temp > halfLength){
						//如果某一段的长度大于一半了，则中点在此段上
						var t = (halfLength - growLength) / d;
						point = {
							x: (1-t)*p1.x + t*p2.x,
							y: (1-t)*p1.y + t*p2.y
						}
						break;
					}
					growLength = temp;
				}
			}
			return point;
		},
        controlStatus: {
            resizeDir: [],
            rotatable: true
        },
        drawControls: function(h) {
            var g = $("#shape_controls");
            if (g.length == 0) {
                var c = $("#designer_canvas");
                g = $("<div id='shape_controls'></div>").appendTo(c);
                g.append("<canvas id='controls_bounding'></canvas>");
                g.append("<div class='shape_controller' index='0' resizeDir='tl'></div>");
                g.append("<div class='shape_controller' index='1' resizeDir='tr'></div>");
                g.append("<div class='shape_controller' index='2' resizeDir='br'></div>");
                g.append("<div class='shape_controller' index='3' resizeDir='bl'></div>");
                g.append("<div class='shape_controller' resizeDir='l'></div>");
                g.append("<div class='shape_controller' resizeDir='t'></div>");
                g.append("<div class='shape_controller' resizeDir='r'></div>");
                g.append("<div class='shape_controller' resizeDir='b'></div>");
                Designer.op.shapeResizable();
                g.append("<canvas class='shape_rotater' width='41px' height='40px'></canvas>");
                Designer.op.shapeRotatable();
                g.append("<div class='group_icon change_shape_icon'></div>");
                Designer.op.groupShapeChangable();
                $(".shape_controller").css({
                    "border-color": Designer.config.anchorColor,
                    width: Designer.config.anchorSize - 2,
                    height: Designer.config.anchorSize - 2
                })
            }
            $(".shape_controller").css({
                "z-index": Model.orderList.length
            });
            $(".change_shape_icon").hide();
            g.show();
            var e = 0;
            var k;
            var d;
            if (h.length == 1) {
                var j = Model.getShapeById(h[0]);
                k = j.props;
                e = j.props.angle;
                d = j.resizeDir;
                if (j.groupName && SchemaGroup.groupExists(j.groupName)) {
                    $(".change_shape_icon").show()
                }
            } else {
                k = Utils.getControlBox(h);
                d = ["tl", "tr", "br", "bl"]
            }
            var a = true;
            for (var f = 0; f < h.length; f++) {
                var b = h[f];
                var j = Model.getShapeById(b);
                if (j.attribute && j.attribute.rotatable == false) {
                    a = false
                }
                if ((j.resizeDir && j.resizeDir.length == 0) || (j.parent && h.length > 1)) {
                    d = []
                }
            }
            this.controlStatus.rotatable = a;
            this.controlStatus.resizeDir = d;
            this.rotateControls(k, e);
            return g
        },
        rotateControls: function(g, u) {
            var k = $("#shape_controls");
            var l = Utils.getRotatedBox(g, u);
            var z = l.w.toScale();
            var h = l.h.toScale();
            k.css({
                left: l.x.toScale(),
                top: l.y.toScale(),
                width: z,
                height: h,
                "z-index": Model.orderList.length
            });
            var j = z + 20;
            var o = h + 20;
            var f = $("#controls_bounding");
            f.attr({
                width: j,
                height: o
            });
            var p = f[0].getContext("2d");
            p.lineJoin = "round";
            if (this.controlStatus.resizeDir.length == 0) {
                p.lineWidth = 2;
                p.strokeStyle = Designer.config.selectorColor;
                p.globalAlpha = 0.8
            } else {
                p.lineWidth = 1;
                p.strokeStyle = Designer.config.selectorColor;
                p.globalAlpha = 0.5
            }
            p.save();
            p.clearRect(0, 0, j, o);
            p.translate(j / 2, o / 2);
            p.rotate(u);
            p.translate(-j / 2, -o / 2);
            p.translate(9.5, 9.5);
            var b = {
                x: Math.round((g.x - l.x).toScale()),
                y: Math.round((g.y - l.y).toScale()),
                w: Math.floor(g.w.toScale() + 1),
                h: Math.floor(g.h.toScale() + 1)
            };
            p.strokeRect(b.x, b.y, b.w, b.h);
            p.restore();
            var y = 0 - Designer.config.anchorSize / 2;
            var s = {};
            g = Utils.toScale(g);
            l = Utils.toScale(l);
            var v = {
                x: (g.x + g.w / 2),
                y: g.y + g.h / 2
            };
            k.children(".shape_controller").hide();
            for (var r = 0; r < this.controlStatus.resizeDir.length; r++) {
                var n = this.controlStatus.resizeDir[r];
                var a = $(".shape_controller[resizeDir=" + n + "]");
                a.show();
                var d, c;
                if (n.indexOf("l") >= 0) {
                    d = g.x
                } else {
                    if (n.indexOf("r") >= 0) {
                        d = g.x + g.w
                    } else {
                        d = g.x + g.w / 2
                    }
                }
                if (n.indexOf("t") >= 0) {
                    c = g.y
                } else {
                    if (n.indexOf("b") >= 0) {
                        c = g.y + g.h
                    } else {
                        c = g.y + g.h / 2
                    }
                }
                var e = Utils.getRotated(v, {
                    x: d,
                    y: c
                }, u);
                a.css({
                    left: e.x - l.x + y,
                    top: e.y - l.y + y
                })
            }
            var m = Math.PI / 8;
            k.children(".shape_controller").removeClass("s n e w");
            if (u > m && u <= m * 3) {
                k.children("div[resizeDir=tl]").addClass("n");
                k.children("div[resizeDir=tr]").addClass("e");
                k.children("div[resizeDir=br]").addClass("s");
                k.children("div[resizeDir=bl]").addClass("w");
                k.children("div[resizeDir=l]").addClass("n w");
                k.children("div[resizeDir=r]").addClass("s e");
                k.children("div[resizeDir=b]").addClass("s w");
                k.children("div[resizeDir=t]").addClass("n e")
            } else {
                if (u > m * 3 && u <= m * 5) {
                    k.children("div[resizeDir=tl]").addClass("n e");
                    k.children("div[resizeDir=tr]").addClass("s e");
                    k.children("div[resizeDir=br]").addClass("s w");
                    k.children("div[resizeDir=bl]").addClass("n w");
                    k.children("div[resizeDir=l]").addClass("n");
                    k.children("div[resizeDir=r]").addClass("s");
                    k.children("div[resizeDir=b]").addClass("w");
                    k.children("div[resizeDir=t]").addClass("e")
                } else {
                    if (u > m * 5 && u <= m * 7) {
                        k.children("div[resizeDir=tl]").addClass("e");
                        k.children("div[resizeDir=tr]").addClass("s");
                        k.children("div[resizeDir=br]").addClass("w");
                        k.children("div[resizeDir=bl]").addClass("n");
                        k.children("div[resizeDir=l]").addClass("n e");
                        k.children("div[resizeDir=r]").addClass("s w");
                        k.children("div[resizeDir=b]").addClass("n w");
                        k.children("div[resizeDir=t]").addClass("s e")
                    } else {
                        if (u > m * 7 && u <= m * 9) {
                            k.children("div[resizeDir=tl]").addClass("s e");
                            k.children("div[resizeDir=tr]").addClass("s w");
                            k.children("div[resizeDir=br]").addClass("n w");
                            k.children("div[resizeDir=bl]").addClass("n e");
                            k.children("div[resizeDir=l]").addClass("e");
                            k.children("div[resizeDir=r]").addClass("w");
                            k.children("div[resizeDir=b]").addClass("n");
                            k.children("div[resizeDir=t]").addClass("s")
                        } else {
                            if (u > m * 9 && u <= m * 11) {
                                k.children("div[resizeDir=tl]").addClass("s");
                                k.children("div[resizeDir=tr]").addClass("w");
                                k.children("div[resizeDir=br]").addClass("n");
                                k.children("div[resizeDir=bl]").addClass("e");
                                k.children("div[resizeDir=l]").addClass("s e");
                                k.children("div[resizeDir=r]").addClass("n w");
                                k.children("div[resizeDir=b]").addClass("n e");
                                k.children("div[resizeDir=t]").addClass("s w")
                            } else {
                                if (u > m * 11 && u <= m * 13) {
                                    k.children("div[resizeDir=tl]").addClass("s w");
                                    k.children("div[resizeDir=tr]").addClass("n w");
                                    k.children("div[resizeDir=br]").addClass("n e");
                                    k.children("div[resizeDir=bl]").addClass("s e");
                                    k.children("div[resizeDir=l]").addClass("s");
                                    k.children("div[resizeDir=r]").addClass("n");
                                    k.children("div[resizeDir=b]").addClass("e");
                                    k.children("div[resizeDir=t]").addClass("w")
                                } else {
                                    if (u > m * 13 && u <= m * 15) {
                                        k.children("div[resizeDir=tl]").addClass("w");
                                        k.children("div[resizeDir=tr]").addClass("n");
                                        k.children("div[resizeDir=br]").addClass("e");
                                        k.children("div[resizeDir=bl]").addClass("s");
                                        k.children("div[resizeDir=l]").addClass("s w");
                                        k.children("div[resizeDir=r]").addClass("n e");
                                        k.children("div[resizeDir=b]").addClass("s e");
                                        k.children("div[resizeDir=t]").addClass("n w")
                                    } else {
                                        k.children("div[resizeDir=tl]").addClass("n w");
                                        k.children("div[resizeDir=tr]").addClass("n e");
                                        k.children("div[resizeDir=br]").addClass("s e");
                                        k.children("div[resizeDir=bl]").addClass("s w");
                                        k.children("div[resizeDir=l]").addClass("w");
                                        k.children("div[resizeDir=r]").addClass("e");
                                        k.children("div[resizeDir=b]").addClass("s");
                                        k.children("div[resizeDir=t]").addClass("n")
                                    }
                                }
                            }
                        }
                    }
                }
            }
            if (this.controlStatus.rotatable) {
                var x = k.find(".shape_rotater");
                x.show();
                var w = {
                    x: g.x + g.w / 2,
                    y: g.y - 20
                };
                var t = Utils.getRotated(v, w, u);
                x.css({
                    top: t.y - 20 - l.y,
                    left: t.x - 20.5 - l.x
                });
                var q = x[0].getContext("2d");
                q.lineWidth = 1;
                q.strokeStyle = Designer.config.selectorColor;
                q.fillStyle = "white";
                q.save();
                q.clearRect(0, 0, 41, 40);
                q.translate(20.5, 20);
                q.rotate(u);
                q.translate(-20.5, -20);
                q.beginPath();
                q.moveTo(20.5, 20);
                q.lineTo(20.5, 40);
                q.stroke();
                q.beginPath();
                q.arc(20.5, 20, Designer.config.rotaterSize / 2, 0, Math.PI * 2);
                q.closePath();
                q.fill();
                q.stroke();
                q.restore()
            } else {
                k.find(".shape_rotater").hide()
            }
        }
    }
};
var Model = {
    define: {},
    persistence: {},
    orderList: [],
    maxZIndex: 0,
    linkerMap: {
        map: {},
        add: function(b, a) {
            if (!this.map[b]) {
                this.map[b] = []
            }
            if (this.map[b].indexOf(a) < 0) {
                this.map[b].push(a)
            }
        },
        remove: function(b, a) {
            if (this.map[b]) {
                Utils.removeFromArray(this.map[b], a)
            }
        },
        empty: function() {
            this.map = {}
        }
    },
    groupMap: {
        map: {},
        add: function(a, b) {
            this.map[a] = b
        },
        push: function(a, b) {
            if (!this.map[a]) {
                this.map[a] = []
            }
            this.map[a].push(b)
        },
        remove: function(a) {
            delete this.map[a]
        },
        empty: function() {
            this.map = {}
        }
    },
    create: function(e, b, g) {
        var d = Utils.newId();
        var c = Utils.copy(Schema.shapes[e]);
        c.id = d;
        c.props.x = b;
        c.props.y = g;
        c.props.zindex = Model.maxZIndex + 1;
        c.props = $.extend(true, {}, Schema.shapeDefaults.props, c.props);
        for (var f = 0; f < c.dataAttributes.length; f++) {
            var a = c.dataAttributes[f];
            a.id = Utils.newId()
        }
        Designer.events.push("create", c);
        return c
    },
    add: function(a, b) {
        this.addMulti([a], b)
    },
    addMulti: function(b, e) {
        if (typeof e == "undefined") {
            e = true
        }
        var a = [];
        for (var d = 0; d < b.length; d++) {
            var c = b[d];
            a.push(Utils.copy(c));
            this.define.elements[c.id] = Utils.copy(c);
            this.persistence.elements[c.id] = Utils.copy(c)
        }
        this.build();
        if (e) {
            MessageSource.send("create", a);
            Util.shapesCount()
        }
    },
    update: function(a) {
        this.updateMulti([a])
    },
    updateMulti: function(c) {
        var a = [];
        var b = [];
        for (var e = 0; e < c.length; e++) {
            var d = c[e];
            if (this.define.elements[d.id]) {
                this.define.elements[d.id] = Utils.copy(d);
                b.push(Utils.copy(this.getPersistenceById(d.id)));
                a.push(Utils.copy(d));
                this.persistence.elements[d.id] = Utils.copy(d)
            }
        }
        this.build();
        var f = {
            shapes: b,
            updates: a
        };
        MessageSource.send("update", f)
    },
    remove: function(b, k) {
        if (typeof k == "undefined") {
            k = true
        }
        if (k) {
            b = Designer.events.push("beforeRemove", b)
        }
        var h = [];
        var n = [];
        var e = [];
        var o = [];
        var d = [];
        if (b.length == 0) {
            return false
        }
        for (var f = 0; f < b.length; f++) {
            var j = b[f];
            if (j.name == "linker") {
                d.push(j.id)
            } else {
                o.push(j.id)
            }
        }
        for (var f = 0; f < b.length; f++) {
            var j = b[f];
            h.push(Utils.copy(j));
            $("#" + j.id).remove();
            delete this.define.elements[j.id];
            delete this.persistence.elements[j.id];
            this.groupMap.remove(j.group);
            if (j.name == "linker") {
                if (j.from.id != null) {
                    this.linkerMap.remove(j.from.id, j.id)
                }
                if (j.to.id != null) {
                    this.linkerMap.remove(j.to.id, j.id)
                }
            } else {
                if (j.parent && o.indexOf(j.parent) < 0) {
                    var l = Model.getShapeById(j.parent);
                    if (l) {
                        Utils.removeFromArray(l.children, j.id);
                        if (n.indexOf(j.parent) < 0) {
                            n.push(j.parent);
                            e.push(l)
                        }
                    }
                }
                var p = this.getShapeLinkers(j.id);
                if (p && p.length > 0) {
                    for (var g = 0; g < p.length; g++) {
                        var a = p[g];
                        if (d.indexOf(a) < 0) {
                            var c = this.getShapeById(a);
                            if (c.from.id != null && c.from.id == j.id) {
                                c.from.id = null;
                                c.from.angle = null
                            }
                            if (c.to.id != null && c.to.id == j.id) {
                                c.to.id = null;
                                c.to.angle = null
                            }
                            if (n.indexOf(a) < 0) {
                                n.push(a);
                                e.push(c)
                            }
                        }
                    }
                }
                delete this.linkerMap.map[j.id]
            }
        }
        this.build();
        MessageSource.beginBatch();
        MessageSource.send("remove", h);
        if (k) {
            var m = Designer.events.push("removed", {
                shapes: b,
                changedIds: n,
                range: o
            });
            if (m && m.length) {
                e = e.concat(m)
            }
        }
        if (e.length > 0) {
            this.updateMulti(e)
        }
        MessageSource.commit();
        return true
    },
    updatePage: function(a, c) {
        var b = $.extend(Model.define.page, a);
        var d = {
            page: Utils.copy(Model.persistence.page),
            update: Utils.copy(b)
        };
        Model.persistence.page = Utils.copy(b);
        MessageSource.send("updatePage", d);
        Designer.initialize.initCanvas()
    },
    setTheme: function(b) {
        Model.define.theme = b;
        var c = {
            theme: Utils.copy(Model.persistence.theme),
            update: Utils.copy(b)
        };
        Model.persistence.theme = Utils.copy(b);
        MessageSource.send("setTheme", c);
        for (var d in Model.define.elements) {
            var a = Model.getShapeById(d);
            Designer.painter.renderShape(a)
        }
    },
    getShapeById: function(a) {
        return this.define.elements[a]
    },
    getPersistenceById: function(a) {
        return this.persistence.elements[a]
    },
    build: function() {
        this.orderList = [];
        this.linkerMap.empty();
        for (var e in Model.define.elements) {
            var a = Model.getShapeById(e);
            this.orderList.push({
                id: a.id,
                zindex: a.props.zindex
            });
            if (a.name == "linker") {
                if (a.from.id != null) {
                    this.linkerMap.add(a.from.id, a.id)
                }
                if (a.to.id != null) {
                    this.linkerMap.add(a.to.id, a.id)
                }
            }
            if (a.group) {
                this.groupMap.push(a.group, a.id)
            }
        }
        this.orderList.sort(function d(g, f) {
            return g.zindex - f.zindex
        });
        for (var c = 0; c < Model.orderList.length; c++) {
            var e = Model.orderList[c].id;
            $("#" + e).css("z-index", c)
        }
        var b = 0;
        if (this.orderList.length > 0) {
            b = this.orderList[this.orderList.length - 1].zindex
        }
        this.maxZIndex = b
    },
    getShapeLinkers: function(a) {
        return this.linkerMap.map[a]
    },
    getGroupShapes: function(a) {
        return this.groupMap.map[a]
    },
    changeShape: function(c, f) {
        var d = Utils.copy(Schema.shapes[f]);
        c.name = f;
        c.title = d.shapeName;
        var b = d.attribute;
        if (c.attribute && typeof c.attribute.collapsed != "undefined") {
            b.collapsed = c.attribute.collapsed
        }
        if (c.attribute && typeof c.attribute.collapseW != "undefined") {
            b.collapseW = c.attribute.collapseW
        }
        if (c.attribute && typeof c.attribute.collapseH != "undefined") {
            b.collapseH = c.attribute.collapseH
        }
        if (c.attribute && c.attribute.markers && c.attribute.markers.indexOf("expand") >= 0) {
            if (!b.markers) {
                b.markers = []
            }
            b.markers.push("expand")
        }
        c.attribute = b;
        c.dataAttributes = d.dataAttributes;
        if (c.dataAttributes) {
            for (var e = 0; e < c.dataAttributes.length; e++) {
                var b = c.dataAttributes[e];
                b.id = Utils.newId()
            }
        }
        var a = "";
        if (c.textBlock.length > 0) {
            a = c.textBlock[0].text
        }
        c.path = d.path;
        c.textBlock = d.textBlock;
        if (c.textBlock.length > 0) {
            c.textBlock[0].text = a
        }
        c.anchors = d.anchors;
        if (c.fillStyle && c.fillStyle.type == "image" && d.fillStyle && d.fillStyle.type == "image") {
            c.fillStyle = d.fillStyle
        }
        Schema.initShapeFunctions(c);
        Designer.painter.renderShape(c)
    }
};
var Utils = {
    getDomById: function(a) {
        return document.getElementById(a)
    },
    newId: function() {
        var b = Math.random();
        var a = (b + new Date().getTime());
        return a.toString(16).replace(".", "")
    },
    /**
	 * 获取某一位置下的形状容器
	 */
	getShapeByPosition: function(x, y, findLinkpoint){
		var focusShapes = [];
		for(var i = Model.orderList.length - 1; i >= 0; i--){
			var shapeId = Model.orderList[i].id;
			var shapeBox = $("#" + shapeId);
			var shape = Model.getShapeById(shapeId);
			//计算出相对于图形画布的x,y坐标
			var shapeBoxPos = shapeBox.position();
			var relativeX = x - shapeBoxPos.left;
			var relativeY = y - shapeBoxPos.top;
			var canvasRect = {x: shapeBoxPos.left, y: shapeBoxPos.top, w: shapeBox.width(), h: shapeBox.height()};
			var shapeCanvas = shapeBox.find(".shape_canvas")[0];
			var shapeCtx = shapeCanvas.getContext("2d");
			var inCanvas = this.pointInRect(x, y, canvasRect);
			if(shape.name == "linker"){
				if(!inCanvas){
					continue;
				}
				if(findLinkpoint){
					continue;
				}
				//如果图形是连接线
				//先判断是否在连线的端点上
				var radius = 10;
				radius = radius.toScale();
				var rect = {x: x - radius, y: y - radius, w: radius * 2, h: radius * 2};
				if(this.pointInRect(shape.to.x.toScale(), shape.to.y.toScale(), rect)){
					var result = {type: "linker_point", point: "end", shape: shape};
					focusShapes.push(result);
					continue;
				}else if(this.pointInRect(shape.from.x.toScale(), shape.from.y.toScale(), rect)){
					var result = {type: "linker_point", point: "from", shape: shape};
					focusShapes.push(result);
					continue;
				}else{
					//判断是否在连接线的文本上
					var textCanvas = shapeBox.find(".text_canvas");
					var textCanvasPos = textCanvas.position();
					var rect = {x: textCanvasPos.left, y: textCanvasPos.top, w: textCanvas.width(), h: textCanvas.height()};
					if(this.pointInRect(relativeX, relativeY, rect)){
						var result = {type: "linker_text", shape: shape};
						focusShapes.push(result);
						continue;
					}
					//判断是否在连接线上，判断坐标点放射出的两条直线是否与线相交
					radius = 7;
					radius = radius.toScale();
					var inLinker = this.pointInLinker({x: x.restoreScale(), y: y.restoreScale()}, shape, radius);
					if(inLinker > -1){
						var result = {type: "linker", shape: shape, pointIndex: inLinker};
						focusShapes.push(result);
						continue;
					}
				}
			}else{
				if(inCanvas && shape.locked && !findLinkpoint){
					//如果图形被锁定了，不做边界判断
					if(shapeCtx.isPointInPath(relativeX, relativeY)){
						var result = {type: "shape", shape: shape};
						focusShapes.push(result);
					}
					continue;
				}
				var radius = 7; //矩形放射半径
				if(inCanvas){
					//先判断是否在图形的锚点上
					radius = radius.toScale();
					var rect = {x: x - radius, y: y - radius, w: radius * 2, h: radius * 2};
					var shapeCenter = {x: shape.props.x + shape.props.w/2, y: shape.props.y + shape.props.h/2};
					var anchors = shape.getAnchors();
					var result = null;
					for ( var ai = 0; ai < anchors.length; ai++) {
						var an = anchors[ai];
						an = this.getRotated(shapeCenter, {x: shape.props.x + an.x, y: shape.props.y + an.y}, shape.props.angle);
						//所以在判断锚点是否在鼠标矩形范围中时
						if(Utils.pointInRect(an.x.toScale(), an.y.toScale(), rect)){
							var angle = Utils.getPointAngle(shapeId, an.x, an.y, radius);
							an.angle = angle;
							result = {type: "bounding", shape: shape, linkPoint: an};
							if(shapeCtx.isPointInPath(relativeX, relativeY)){
								result.inPath = true;
							}
							break;
						}
					}
					if(result != null){
						focusShapes.push(result);
						continue;
					}
				}
				//判断是否在数据属性上
				if(shape.dataAttributes){
					var result = null;
					for (var di = 0; di < shape.dataAttributes.length; di++) {
						var attr = shape.dataAttributes[di];
						if(attr.type == "link" && attr.showType && attr.showType != "none"){
							var attrCanvas = shapeBox.children("#attr_canvas_" + attr.id);
							if(attrCanvas.length > 0){
								var attrPos = attrCanvas.position();
								var relateToAttrX = relativeX - attrPos.left;
								var relateToAttrY = relativeY - attrPos.top;
								var attrCtx = attrCanvas[0].getContext("2d");
								if(attrCtx.isPointInPath(relateToAttrX, relateToAttrY)){
									result = {type: "dataAttribute", shape: shape, attribute: attr};
									break;
								}
							}
						}
					}
					if(result != null){
						focusShapes.push(result);
						continue;
					}
				}
				if(!inCanvas){
					continue;
				}
				//判断是否在图形内
				if(shapeCtx.isPointInPath(relativeX, relativeY)){
					//如果当前坐标在形状内，显示为移动
					if(findLinkpoint){
						var anchors = shape.getAnchors();
						if(anchors && anchors.length){
							var result = {type: "shape", shape: shape};
							focusShapes.push(result);
							continue;
						}else{
							continue;
						}
					}else{
						var result = {type: "shape", shape: shape};
						focusShapes.push(result);
						continue;
					}
				}else if(!shape.attribute || typeof shape.attribute.linkable == "undefined" || shape.attribute.linkable){
					//判断坐标是否在图形边界上
					//获取点相对于图形的角度
					var angle = Utils.getPointAngle(shapeId, x.restoreScale(), y.restoreScale(), radius);
					if(angle != null){
						var result = null;
						var linkPoint = {angle: angle};
						for(var step = 1; step <= radius; step++){
							//向角度相反方向，以半径为最长，逐渐移动
							if(angle == 0){
								//点角度在左边
								linkPoint.x = relativeX + step;
								linkPoint.y = relativeY;
							}else if(angle < Math.PI / 2){
								//点角度在左上角区域
								linkPoint.x = relativeX + step * Math.cos(angle);
								linkPoint.y = relativeY + step * Math.sin(angle);
							}else if(angle == Math.PI / 2){
								//点角度在正上方
								linkPoint.x = relativeX;
								linkPoint.y = relativeY + step;
							}else if(angle < Math.PI){
								//点角度为在右上角区域
								linkPoint.x = relativeX - step * Math.sin(angle - Math.PI / 2);
								linkPoint.y = relativeY + step * Math.cos(angle - Math.PI / 2);
							}else if(angle == Math.PI / 2){
								//点角度在正右边
								linkPoint.x = relativeX - step;
								linkPoint.y = relativeY;
							}else if(angle < Math.PI / 2 * 3){
								//点角度为在右下角区域
								linkPoint.x = relativeX - step * Math.cos(angle - Math.PI);
								linkPoint.y = relativeY - step * Math.sin(angle - Math.PI);
							}else if(angle == Math.PI / 2 * 3){
								//点角度在正右边
								linkPoint.x = relativeX;
								linkPoint.y = relativeY - step;
							}else{
								//点角度为在左下角区域
								linkPoint.x = relativeX + step * Math.sin(angle - Math.PI / 2 * 3);
								linkPoint.y = relativeY - step * Math.cos(angle - Math.PI / 2 * 3);
							}
							if(shapeCtx.isPointInPath(linkPoint.x, linkPoint.y)){
								linkPoint.x += shapeBoxPos.left;
								linkPoint.y += shapeBoxPos.top;
								linkPoint.x = linkPoint.x.restoreScale();
								linkPoint.y = linkPoint.y.restoreScale();
								result = {type: "bounding", shape: shape, linkPoint: linkPoint};
								break;
							}
						}
						if(result != null){
							focusShapes.push(result);
							continue;
						}
					}
				}
			}
		}
		var result = null;
		if(focusShapes.length == 1){
			result = focusShapes[0];
		}if(focusShapes.length > 1 && findLinkpoint){
			result = focusShapes[0];
		}else if(focusShapes.length > 1){
			//鼠标在多个图形上，需要有判断规则
			var first = focusShapes[0];
			if(first.type == "bounding" && first.type != "linker_point" && first.type != "linker"){
				//鼠标在连接线端点上，并且
				return first;
			}
			var inLinker = []; //在连线上
			var endPoint = []; //在连接线端点
			var inBounding = []; //在形状边界上
			for(var i = 0; i < focusShapes.length; i++){
				var focus = focusShapes[i];
				if(focus.type == "bounding"){
					inBounding.push(focus);				
				}else if(focus.type == "linker"){
					inLinker.push(focus);				
				}else if(focus.type == "linker_point"){
					endPoint.push(focus);				
				}
			}
			if(inBounding.length > 0 && endPoint.length > 0){
				//在某图形的边界上，并且在某连接线的端点上，判断一下是否在形状内部
				for(var i = 0; i < inBounding.length; i++){
					var focus = inBounding[i];
					if(focus.inPath){
						result = focus;
						break;
					}
				}
			}
			if(result == null && endPoint.length > 0){
				//如果并没有在形状内部，取最上层的连接线
				endPoint.sort(function compare(a, b){
					if(Utils.isSelected(a.shape.id) && !Utils.isSelected(b.shape.id)){
						return -1;
					}else if(!Utils.isSelected(a.shape.id) && Utils.isSelected(b.shape.id)){
						return 1;
					}else{
						return b.shape.props.zindex - a.shape.props.zindex;
					}
			 	});
				result = endPoint[0];
			}
			if(result == null && inLinker.length > 0){
				//如果并没有在形状内部，取最上层的连接线
				inLinker.sort(function compare(a, b){
					if(Utils.isSelected(a.shape.id) && !Utils.isSelected(b.shape.id)){
						return -1;
					}else if(!Utils.isSelected(a.shape.id) && Utils.isSelected(b.shape.id)){
						return 1;
					}else{
						return b.shape.props.zindex - a.shape.props.zindex;
					}
			 	});
				result = inLinker[0];
			}
			if(result == null){
				result = focusShapes[0];
			}
		}
		return result;
    },
    
    checkCross: function(i, g, f, e) {
        var a = false;
        var h = (g.x - i.x) * (e.y - f.y) - (g.y - i.y) * (e.x - f.x);
        if (h != 0) {
            var c = ((i.y - f.y) * (e.x - f.x) - (i.x - f.x) * (e.y - f.y)) / h;
            var b = ((i.y - f.y) * (g.x - i.x) - (i.x - f.x) * (g.y - i.y)) / h;
            if ((c >= 0) && (c <= 1) && (b >= 0) && (b <= 1)) {
                a = true
            }
        }
        return a
    },
    rectCross: function(h, g) {
        var d = h.x;
        var f = h.x + h.w;
        var j = h.y;
        var b = h.y + h.h;
        var c = g.x;
        var e = g.x + g.w;
        var i = g.y;
        var a = g.y + g.h;
        if (((d < e) && (c < f)) && ((j < a) && (i < b))) {
            return true
        } else {
            return false
        }
    },
    rectInRect: function(c, a) {
        var f = {
            x: c.x,
            y: c.y
        };
        var e = {
            x: c.x + c.w,
            y: c.y
        };
        var d = {
            x: c.x + c.w,
            y: c.y + c.h
        };
        var b = {
            x: c.x,
            y: c.y + c.h
        };
        if (this.pointInRect(f.x, f.y, a) && this.pointInRect(e.x, e.y, a) && this.pointInRect(d.x, d.y, a) && this.pointInRect(b.x, b.y, a)) {
            return true
        } else {
            return false
        }
    },
    pointInPolygon: function(a, c) {
        var h, g, f, e;
        h = a;
        g = {
            x: -1000000,
            y: a.y
        };
        var d = 0;
        for (var b = 0; b < c.length - 1; b++) {
            f = c[b];
            e = c[b + 1];
            if (Utils.checkCross(h, g, f, e) == true) {
                d++
            }
        }
        f = c[c.length - 1];
        e = c[0];
        if (Utils.checkCross(h, g, f, e) == true) {
            d++
        }
        return (d % 2 == 0) ? false : true
    },
    pointInRect: function(b, a, c) {
        if (b >= c.x && b <= c.x + c.w && a >= c.y && a <= c.y + c.h) {
            return true
        }
        return false
    },
    /**
	 * 判断点是否在连接线上
	 * @return 如果没在线上，返回-1，否则返回相交点的索引
	 */
	pointInLinker: function(point, linker, radius){
		var points = this.getLinkerLinePoints(linker);
		//在x轴上放射两个点(一条线)
		var linex1 = {x: point.x - radius, y: point.y};
		var linex2 = {x: point.x + radius, y: point.y};
		//在y轴上放射两个点(一条线)
		var liney1 = {x: point.x, y: point.y - radius};
        var liney2 = {x: point.x, y: point.y + radius};
        
		for(var pi = 1; pi < points.length; pi++){
			var p1 = points[pi - 1];
			var p2 = points[pi];
			var cross = this.checkCross(linex1, linex2, p1, p2);
			if(cross){
				return pi;
			}
			cross = this.checkCross(liney1, liney2, p1, p2);
			if(cross){
				return pi;
			}
		}
		return -1;
	},
    getLinkerLength: function(c) {
        var b = this.getLinkerLinePoints(c);
        var a = 0;
        for (var f = 1; f < b.length; f++) {
            var h = b[f - 1];
            var e = b[f];
            var g = Utils.measureDistance(h, e);
            a += g
        }
        return a
    },
    getShapesByRange: function(c) {
        var a = [];
        for (var e in Model.define.elements) {
            var b = Model.getShapeById(e);
            var d = b.props;
            if (b.name == "linker") {
                d = this.getLinkerBox(b)
            } else {
                d = this.getShapeBox(b)
            }
            if (this.pointInRect(d.x, d.y, c) && this.pointInRect(d.x + d.w, d.y, c) && this.pointInRect(d.x + d.w, d.y + d.h, c) && this.pointInRect(d.x, d.y + d.h, c)) {
                a.push(b.id)
            }
        }
        return a
    },
    getControlBox: function(e) {
        var g = {
            x1: null,
            y1: null,
            x2: null,
            y2: null
        };
        for (var b = 0; b < e.length; b++) {
            var f = e[b];
            var a = Model.getShapeById(f);
            var d;
            if (a.name == "linker") {
                d = this.getLinkerBox(a)
            } else {
                d = this.getShapeBox(a)
            }
            if (g.x1 == null || d.x < g.x1) {
                g.x1 = d.x
            }
            if (g.y1 == null || d.y < g.y1) {
                g.y1 = d.y
            }
            if (g.x2 == null || d.x + d.w > g.x2) {
                g.x2 = d.x + d.w
            }
            if (g.y2 == null || d.y + d.h > g.y2) {
                g.y2 = d.y + d.h
            }
        }
        var c = {
            x: g.x1,
            y: g.y1,
            w: g.x2 - g.x1,
            h: g.y2 - g.y1
        };
        return c
    },
    getShapesBounding: function(a) {
        var f = {
            x1: null,
            y1: null,
            x2: null,
            y2: null
        };
        for (var c = 0; c < a.length; c++) {
            var b = a[c];
            var d;
            if (b.name == "linker") {
                d = this.getLinkerBox(b)
            } else {
                d = b.props
            }
            if (f.x1 == null || d.x < f.x1) {
                f.x1 = d.x
            }
            if (f.y1 == null || d.y < f.y1) {
                f.y1 = d.y
            }
            if (f.x2 == null || d.x + d.w > f.x2) {
                f.x2 = d.x + d.w
            }
            if (f.y2 == null || d.y + d.h > f.y2) {
                f.y2 = d.y + d.h
            }
        }
        var e = {
            x: f.x1,
            y: f.y1,
            w: f.x2 - f.x1,
            h: f.y2 - f.y1
        };
        return e
    },
    getShapeContext: function(b) {
        var a = Utils.getDomById(b);
        return a.getElementsByTagName("canvas")[0].getContext("2d")
    },
    selectIds: [],
    /**
	 * 选中形状
	 * @param {} shapeIds 选中图形的id
	 * @param {} withCallback 是否施行回调
	 */
	selectShape: function(shapeIds, withCallback){
		//如果是字符串，则为选择一个
		if(typeof shapeIds == "string"){
			var shapeId = shapeIds;
			shapeIds = [];
			shapeIds.push(shapeId);
		}
		if(shapeIds.length <= 0){
			return;
		}
		var selectIds = Utils.mergeArray([], shapeIds); //构建一个新的数组
		//先进行循环，找到与图形组合的图形，一并选中
		for (var i = 0; i < shapeIds.length; i++) {
			var shape = Model.getShapeById(shapeIds[i]);
			if(shape.group){
				var groupedShapeIds = Model.getGroupShapes(shape.group);
				Utils.mergeArray(selectIds, groupedShapeIds);
			}
		}
		//重新构建一下，如果子元素不允许缩放，选中子元素时，让其选中父元素
		var ids = [];
		for (var i = 0; i < selectIds.length; i++) {
			var id = selectIds[i];
			var shape = Model.getShapeById(id);
			if(shape.parent && shape.resizeDir.length == 0 && ids.indexOf(shape.parent) < 0){
				ids.push(shape.parent);
			}else if(ids.indexOf(id) < 0){
				ids.push(id);
			}
		}
		shapeIds = ids;
		Utils.removeAnchors();
		Utils.selectIds = [];
		//设置选中状态
		for (var index = 0; index < shapeIds.length; index++) {
			var shapeId = shapeIds[index];
			var shape = Model.getShapeById(shapeId);
			Utils.selectIds.push(shapeId);
			if(shape.name == "linker"){
				if(this.isLocked(shape.id)){
					//锁定，显示叉号
					Utils.showLockers(shape);
				}else{
					Designer.painter.renderLinker(shape);
				}
			}else{
				if(this.isLocked(shape.id)){
					//锁定，显示叉号
					Utils.showLockers(shape);
				}else{
					Utils.showAnchors(shape);
				}
			}
		}
		//拿到选中的图形，不包括锁定的，给这些图形绘制控制器
		var ids = Utils.getSelectedIds();
		var onlyOneLinker = false
		if(ids.length == 1){
			var first = Model.getShapeById(ids[0]);
			if(first.name == "linker"){
				onlyOneLinker = true;
				Utils.showLinkerControls();
			}
		}
		if(ids.length > 0 && !onlyOneLinker){
			var control = Designer.painter.drawControls(ids);
		}
		if(typeof withCallback == "undefined"){
			withCallback = true
		}
		if(this.selectCallback && withCallback){
			this.selectCallback();
		}
		Designer.events.push("selectChanged");
		this.showLinkerCursor();
	},
    selectCallback: null,
    unselect: function() {
        var c = this.selectIds;
        this.selectIds = [];
        for (var b = 0; b < c.length; b++) {
            var d = c[b];
            var a = Model.getShapeById(d);
            if (a.name == "linker") {
                Designer.painter.renderLinker(a)
            }
        }
        $("#shape_controls").hide();
        Utils.removeLockers();
        Utils.removeAnchors();
        Designer.events.push("selectChanged");
        this.hideLinkerCursor();
        this.hideLinkerControls()
    },
    getSelected: function() {
        var a = [];
        for (var b = 0; b < this.selectIds.length; b++) {
            var d = this.selectIds[b];
            if (!Utils.isLocked(d)) {
                var c = Model.getShapeById(d);
                a.push(c)
            }
        }
        return a
    },
    getSelectedIds: function() {
        var a = [];
        for (var b = 0; b < this.selectIds.length; b++) {
            var c = this.selectIds[b];
            if (!Utils.isLocked(c)) {
                a.push(c)
            }
        }
        return a
    },
    getSelectedLinkers: function() {
        var a = [];
        for (var b = 0; b < this.selectIds.length; b++) {
            var d = this.selectIds[b];
            if (!Utils.isLocked(d)) {
                var c = Model.getShapeById(d);
                if (c.name == "linker") {
                    a.push(c)
                }
            }
        }
        return a
    },
    getSelectedLinkerIds: function() {
        var a = [];
        for (var b = 0; b < this.selectIds.length; b++) {
            var d = this.selectIds[b];
            if (!Utils.isLocked(d)) {
                var c = Model.getShapeById(d);
                if (c.name == "linker") {
                    a.push(d)
                }
            }
        }
        return a
    },
    getSelectedShapeIds: function() {
        var a = [];
        for (var b = 0; b < this.selectIds.length; b++) {
            var d = this.selectIds[b];
            if (!Utils.isLocked(d)) {
                var c = Model.getShapeById(d);
                if (c.name != "linker") {
                    a.push(d)
                }
            }
        }
        return a
    },
    getSelectedLockedIds: function() {
        var a = [];
        for (var b = 0; b < this.selectIds.length; b++) {
            var c = this.selectIds[b];
            if (Utils.isLocked(c)) {
                a.push(c)
            }
        }
        return a
    },
    getSelectedGroups: function() {
        var a = [];
        for (var c = 0; c < this.selectIds.length; c++) {
            var d = this.selectIds[c];
            var b = Model.getShapeById(d);
            if (b.group && a.indexOf(b.group) < 0) {
                a.push(b.group)
            }
        }
        return a
    },
    isSelected: function(a) {
        if (this.selectIds.indexOf(a) >= 0 && !this.isLocked(a)) {
            return true
        }
        return false
    },
    isLocked: function(a) {
        if (Model.getShapeById(a).locked) {
            return true
        } else {
            return false
        }
    },
    linkerCursorTimer: null,
    showLinkerCursor: function() {
        this.hideLinkerCursor();
        var l = Utils.getSelectedIds();
        if (l.length == 1) {
            var c = Model.getShapeById(l[0]);
            if (c.name != "linker") {
                var f = Model.linkerMap.map[c.id];
                if (f && f.length) {
                    var m = [];
                    for (var o = 0; o < f.length; o++) {
                        var v = f[o];
                        var j = Model.getShapeById(v);
                        if (c.id != j.from.id || !j.to.id) {
                            continue
                        }
                        var q = this.getLinkerLength(j).toScale();
                        var n = [];
                        if (j.linkerType == "broken") {
                            n.push({
                                x: j.from.x.toScale(),
                                y: j.from.y.toScale(),
                                t: 0
                            });
                            for (var t = 0; t < j.points.length; t++) {
                                var k = j.points[t];
                                n.push({
                                    x: k.x.toScale(),
                                    y: k.y.toScale()
                                })
                            }
                            n.push({
                                x: j.to.x.toScale(),
                                y: j.to.y.toScale()
                            });
                            var s = 0;
                            for (var t = 1; t < n.length; t++) {
                                var b = n[t - 1];
                                var a = n[t];
                                s += Utils.measureDistance(b, a);
                                a.t = s / q
                            }
                        }
                        var h = Math.floor(q / 120) + 1;
                        var e = 3 / q;
                        var u = (Math.ceil(q / 120) * 120) / q;
                        var r = 0;
                        while (r < q) {
                            var g = {
                                t: r / q,
                                step: e,
                                linker: j,
                                points: n,
                                maxT: u
                            };
                            m.push(g);
                            r += 120
                        }
                    }
                    this.playLinkerCursor(m)
                }
            }
        }
    },
    playLinkerCursor: function(f) {
        for (var c = 0; c < f.length; c++) {
            var h = f[c];
            var g = $("<div class='linker_cursor'></div>").appendTo("#designer_canvas");
            var e = h.linker;
            var a = Utils.getLinkerLineStyle(e.lineStyle);
            var b = (a.lineWidth + 2).toScale();
            if (b < 5) {
                b = 5
            }
            var d = b / 2;
            h.half = d;
            h.dom = g;
            g.css({
                width: b,
                height: b,
                "-webkit-border-radius": d,
                "-moz-border-radius": d,
                "-ms-border-radius": d,
                "-o-border-radius": d,
                "border-radius": d,
                "z-index": $("#" + e.id).css("z-index")
            })
        }
        this.linkerCursorTimer = setInterval(function() {
            for (var j = 0; j < f.length; j++) {
                var q = f[j];
                var l = q.linker;
                if (q.t >= q.maxT) {
                    q.t = 0;
                    q.dom.show()
                }
                var u = q.t;
                if (l.linkerType == "broken") {
                    for (var k = 1; k < q.points.length; k++) {
                        var r = q.points[k - 1];
                        var p = q.points[k];
                        if (u >= r.t && u < p.t) {
                            var v = (u - r.t) / (p.t - r.t);
                            var n = (1 - v) * r.x + v * p.x;
                            var m = (1 - v) * r.y + v * p.y;
                            q.dom.css({
                                left: n - q.half,
                                top: m - q.half
                            });
                            break
                        }
                    }
                } else {
                    if (l.linkerType == "curve") {
                        var s = l.from;
                        var r = l.points[0];
                        var p = l.points[1];
                        var o = l.to;
                        var n = s.x.toScale() * Math.pow((1 - u), 3) + r.x.toScale() * u * Math.pow((1 - u), 2) * 3 + p.x.toScale() * Math.pow(u, 2) * (1 - u) * 3 + o.x.toScale() * Math.pow(u, 3);
                        var m = s.y.toScale() * Math.pow((1 - u), 3) + r.y.toScale() * u * Math.pow((1 - u), 2) * 3 + p.y.toScale() * Math.pow(u, 2) * (1 - u) * 3 + o.y.toScale() * Math.pow(u, 3);
                        q.dom.css({
                            left: n - q.half,
                            top: m - q.half
                        })
                    } else {
                        var n = (1 - u) * l.from.x.toScale() + u * l.to.x.toScale();
                        var m = (1 - u) * l.from.y.toScale() + u * l.to.y.toScale();
                        q.dom.css({
                            left: n - q.half,
                            top: m - q.half
                        })
                    }
                }
                q.t += q.step;
                if (q.t >= 1) {
                    q.dom.hide()
                }
            }
        }, 30)
    },
    hideLinkerCursor: function() {
        if (this.linkerCursorTimer) {
            clearInterval(this.linkerCursorTimer)
        }
        $(".linker_cursor").remove()
    },
    showLinkerControls: function() {
        this.hideLinkerControls();
        var b = Utils.getSelectedIds();
        var c = null;
        if (b.length == 1) {
            var a = Model.getShapeById(b[0]);
            if (a.name == "linker" && a.linkerType == "curve") {
                c = a
            }
        }
        if (c == null) {
            return
        }
        function d(i, h) {
            var g = null;
            var n = null;
            if (h == "from") {
                g = i.from;
                n = i.points[0]
            } else {
                g = i.to;
                n = i.points[1]
            }
            var j = Utils.measureDistance(g, n).toScale() - 6;
            var m = {
                x: (0.5 * g.x + 0.5 * n.x).toScale(),
                y: (0.5 * g.y + 0.5 * n.y).toScale()
            };
            var f = Utils.getAngle(g, n) + Math.PI / 2;
            var o = $("<div class='linker_control_line'></div>").appendTo("#designer_canvas");
            var l = $("<div class='linker_control_point'></div>").appendTo("#designer_canvas");
            var e = Math.round(f / (Math.PI * 2) * 360);
            var k = "rotate(" + e + "deg)";
            o.css({
                left: m.x,
                top: m.y - j / 2,
                height: j,
                "z-index": Model.orderList.length,
                "-webkit-transform": k,
                "-ms-transform": k,
                "-o-transform": k,
                "-moz-transform": k,
                transform: k
            });
            l.css({
                left: n.x.toScale() - 4,
                top: n.y.toScale() - 4,
                "z-index": Model.orderList.length
            });
            l.attr("ty", h);
            l.unbind().bind("mousedown", function(p) {
                i = Model.getShapeById(i.id);
                var q = null;
                if (h == "from") {
                    q = i.points[0]
                } else {
                    q = i.points[1]
                }
                p.stopPropagation();
                l.addClass("moving");
                Designer.op.changeState("changing_curve");
                $(document).bind("mousemove.change_curve", function(r) {
                    var s = Utils.getRelativePos(r.pageX, r.pageY, $("#designer_canvas"));
                    q.x = s.x;
                    q.y = s.y;
                    Designer.painter.renderLinker(i);
                    Model.define.elements[i.id] = i;
                    Utils.showLinkerControls();
                    $(".linker_control_point[ty=" + l.attr("ty") + "]").addClass("moving");
                    $(document).unbind("mouseup.changed_curve").bind("mouseup.changed_curve", function(t) {
                        Model.update(i);
                        $(document).unbind("mouseup.changed_curve")
                    })
                });
                $(document).unbind("mouseup.change_curve").bind("mouseup.change_curve", function(r) {
                    $(document).unbind("mouseup.change_curve");
                    $(document).unbind("mousemove.change_curve");
                    $(".linker_control_point").removeClass("moving");
                    Designer.op.resetState()
                })
            });
            return l
        }
        d(c, "from");
        d(c, "to")
    },
    hideLinkerControls: function() {
        $(".linker_control_line").remove();
        $(".linker_control_point").remove()
    },
    showAnchors: function(i) {
        if ($(".shape_contour[forshape=" + i.id + "]").length > 0) {
            return
        }
        var f = $("<div class='shape_contour' forshape='" + i.id + "'></div>").appendTo($("#designer_canvas"));
        f.css({
            left: i.props.x.toScale(),
            top: i.props.y.toScale(),
            "z-index": Model.orderList.length + 1
        });
        if (!Utils.isSelected(i.id)) {
            f.addClass("hovered_contour")
        }
        var c = Designer.config.anchorSize - 2;
        var b = {
            "border-color": Designer.config.anchorColor,
            "border-radius": Designer.config.anchorSize / 2,
            width: c,
            height: c
        };
        var a = i.getAnchors();
        var h = {
            x: i.props.w / 2,
            y: i.props.h / 2
        };
        var e = i.props.angle;
        for (var j = 0; j < a.length; j++) {
            var g = a[j];
            var k = $("<div class='shape_anchor'></div>").appendTo(f);
            var d = this.getRotated(h, g, e);
            b.left = d.x.toScale() - Designer.config.anchorSize / 2;
            b.top = d.y.toScale() - Designer.config.anchorSize / 2;
            k.css(b)
        }
    },
    hideAnchors: function() {
        $(".hovered_contour").remove()
    },
    removeAnchors: function() {
        $(".shape_contour").remove()
    },
    showLockers: function(d) {
        var j = $("#" + d.id);
        var f = j.position();
        function c() {
            var n = $("<canvas class='shape_locker' width='10px' height='10px'></canvas>").appendTo(j);
            var m = n[0].getContext("2d");
            m.strokeStyle = "#777";
            m.lineWidth = 1;
            var l = 9;
            m.beginPath();
            m.moveTo(2, 2);
            m.lineTo(l, l);
            m.moveTo(2, l);
            m.lineTo(l, 2);
            m.stroke();
            return n
        }
        function e(l) {
            var m = c();
            m.css({
                left: l.x.toScale() - f.left - 5,
                top: l.y.toScale() - f.top - 5
            })
        }
        if (d.name != "linker") {
            var b = d.props;
            var a = {
                x: b.x + b.w / 2,
                y: b.y + b.h / 2
            };
            var k = this.getRotated(a, {
                x: b.x,
                y: b.y
            }, d.props.angle);
            e(k);
            var i = this.getRotated(a, {
                x: b.x + b.w,
                y: b.y
            }, d.props.angle);
            e(i);
            var h = this.getRotated(a, {
                x: b.x + b.w,
                y: b.y + b.h
            }, d.props.angle);
            e(h);
            var g = this.getRotated(a, {
                x: b.x,
                y: b.y + b.h
            }, d.props.angle);
            e(g)
        } else {
            e(d.from);
            e(d.to)
        }
    },
    removeLockers: function() {
        $(".shape_locker").remove()
    },
    measureDistance: function(p1, p2){
		var h = p2.y - p1.y;
		var w = p2.x - p1.x;
		return Math.sqrt(Math.pow(h, 2) + Math.pow(w, 2));
	},
    removeFromArray: function(c, b) {
        var a = c.indexOf(b);
        if (a >= 0) {
            c.splice(a, 1)
        }
        return c
    },
    addToArray: function(c, b) {
        var a = c.indexOf(b);
        if (a < 0) {
            c.push(b)
        }
        return c
    },
    mergeArray: function(b, a) {
        for (var c = 0; c < a.length; c++) {
            var d = a[c];
            if (b.indexOf(d) < 0) {
                b.push(d)
            }
        }
        return b
    },
    getCirclePoints: function(a, h, e) {
        var g = Math.PI / 18;
        var d = [];
        for (var c = 0; c < 36; c++) {
            var b = g * c;
            var f = {
                x: a - Math.cos(b) * e,
                y: h - Math.sin(b) * e,
                angle: b
            };
            d.push(f)
        }
        return d
    },
    getPointAngle: function(n, q, o, a) {
        var j = $("#" + n).position();
        var h = Utils.getShapeContext(n);
        q = q.toScale() - j.left;
        o = o.toScale() - j.top;
        var b = this.getCirclePoints(q, o, a);
        var m = b.length;
        var t = false;
        for (var k = 0; k < m; k++) {
            var c = b[k];
            if (h.isPointInPath(c.x, c.y)) {
                c.inPath = true;
                t = true
            } else {
                c.inPath = false
            }
        }
        if (t == false) {
            return null
        }
        var d = null;
        var g = null;
        for (var k = 0; k < m; k++) {
            var c = b[k];
            if (!c.inPath) {
                if (d == null) {
                    var f = b[(k - 1 + m) % m];
                    if (f.inPath) {
                        d = c.angle
                    }
                }
                if (g == null) {
                    var l = b[(k + 1 + m) % m];
                    if (l.inPath) {
                        g = c.angle
                    }
                }
                if (d != null && g != null) {
                    break
                }
            }
        }
        var s = (Math.PI * 2 + g - d) % (Math.PI * 2) / 2;
        var e = (d + s) % (Math.PI * 2);
        return e
    },
    getAngleDir: function(angle){
		var pi = Math.PI;
		if(angle >= pi / 4 && angle < pi / 4 * 3){
			return 1;//上
		}else if(angle >= pi / 4 * 3 && angle < pi / 4 * 5){
			return 2;//右
		}else if(angle >= pi / 4 * 5 && angle < pi / 4 * 7){
			return 3;//下
		}else{
			return 4;//左
		}
	},






















    getLinkerPoints: function(linker){
		var points = [];
		if(linker.linkerType == "broken"){
			var pi = Math.PI;
			var from = linker.from;
			var to = linker.to;
			var xDistance = Math.abs(to.x - from.x);
			var yDistance = Math.abs(to.y - from.y);
			var minDistance = 30; //最小距离，比如起点向上，终点在下方，则先要往上画minDistance的距离
            
            
            //折线，取折点
			if(from.id != null && to.id != null){
				//起点和终点都连接了形状
				var fromDir = this.getAngleDir(from.angle); //起点方向
                var toDir = this.getAngleDir(to.angle); //终点方向
				var fixed, active, reverse; //固定点、移动点、是否需要逆序
				//以起点为判断依据，可以涵盖所有情况
				if(fromDir == 1 && toDir == 1){
					//情况1：两个点都向上
					if(from.y < to.y){
						fixed = from;
						active = to;
						reverse = false;
					}else{
						fixed = to;
						active = from;
						reverse = true;
					}
					var fixedProps = Model.getShapeById(fixed.id).props;
					var activeProps = Model.getShapeById(active.id).props;
					if(active.x >= fixedProps.x - minDistance && active.x <= fixedProps.x + fixedProps.w + minDistance){
						var x;
						if(active.x < fixedProps.x + fixedProps.w / 2){
							x = fixedProps.x - minDistance;
						}else{
							x = fixedProps.x + fixedProps.w + minDistance;
						}
						var y = fixed.y - minDistance;
						points.push({x: fixed.x, y: y});
						points.push({x: x, y: y});
						y = active.y - minDistance;
						points.push({x: x, y: y});
						points.push({x: active.x, y: y});
					}else{
						var y = fixed.y - minDistance;
						points.push({x: fixed.x, y: y});
						points.push({x: active.x, y: y});
					}
				}else if(fromDir == 3 && toDir == 3){
					//情况2：两个点都向下
					if(from.y > to.y){
						fixed = from;
						active = to;
						reverse = false;
					}else{
						fixed = to;
						active = from;
						reverse = true;
					}
					var fixedProps = Model.getShapeById(fixed.id).props;
					var activeProps = Model.getShapeById(active.id).props;
					if(active.x >= fixedProps.x - minDistance && active.x <= fixedProps.x + fixedProps.w + minDistance){
						var y = fixed.y + minDistance;
						var x;
						if(active.x < fixedProps.x + fixedProps.w / 2){
							x = fixedProps.x - minDistance;
						}else{
							x = fixedProps.x + fixedProps.w + minDistance;
						}
						points.push({x: fixed.x, y: y});
						points.push({x: x, y: y});
						y = active.y + minDistance;
						points.push({x: x, y: y});
						points.push({x: active.x, y: y});
					}else{
						var y = fixed.y + minDistance;
						points.push({x: fixed.x, y: y});
						points.push({x: active.x, y: y});
					}
				}else if(fromDir == 2 && toDir == 2){
					//情况3：两点都向右
					if(from.x > to.x){
						fixed = from;
						active = to;
						reverse = false;
					}else{
						fixed = to;
						active = from;
						reverse = true;
					}
					var fixedProps = Model.getShapeById(fixed.id).props;
					var activeProps = Model.getShapeById(active.id).props;
					if(active.y >= fixedProps.y - minDistance && active.y <= fixedProps.y + fixedProps.h + minDistance){
						var x = fixed.x + minDistance;
						var y;
						if(active.y < fixedProps.y + fixedProps.h / 2){
							y = fixedProps.y - minDistance;
						}else{
							y = fixedProps.y + fixedProps.h + minDistance;
						}
						points.push({x: x, y: fixed.y});
						points.push({x: x, y: y});
						x = active.x + minDistance;
						points.push({x: x, y: y});
						points.push({x: x, y: active.y});
					}else{
						var x = fixed.x + minDistance;
						points.push({x: x, y: fixed.y});
						points.push({x: x, y: active.y});
					}
				}else if(fromDir == 4 && toDir == 4){
					//情况4：两点都向左
					if(from.x < to.x){
						fixed = from;
						active = to;
						reverse = false;
					}else{
						fixed = to;
						active = from;
						reverse = true;
					}
					var fixedProps = Model.getShapeById(fixed.id).props;
					var activeProps = Model.getShapeById(active.id).props;
					if(active.y >= fixedProps.y - minDistance && active.y <= fixedProps.y + fixedProps.h + minDistance){
						var x = fixed.x - minDistance;
						var y;
						if(active.y < fixedProps.y + fixedProps.h / 2){
							y = fixedProps.y - minDistance;
						}else{
							y = fixedProps.y + fixedProps.h + minDistance;
						}
						points.push({x: x, y: fixed.y});
						points.push({x: x, y: y});
						x = active.x - minDistance;
						points.push({x: x, y: y});
						points.push({x: x, y: active.y});
					}else{
						var x = fixed.x - minDistance;
						points.push({x: x, y: fixed.y});
						points.push({x: x, y: active.y});
					}
				}else if((fromDir == 1 && toDir == 3) || (fromDir == 3 && toDir == 1)){
					//情况5：一个点向上，一个点向下
					if(fromDir == 1){
						fixed = from;
						active = to;
						reverse = false;
					}else{
						fixed = to;
						active = from;
						reverse = true;
					}
					var fixedProps = Model.getShapeById(fixed.id).props;
					var activeProps = Model.getShapeById(active.id).props;
					if(active.y <= fixed.y){
						var y = fixed.y - yDistance / 2;
						points.push({x: fixed.x, y: y});
						points.push({x: active.x, y: y});
					}else{
						var fixedRight = fixedProps.x + fixedProps.w;
						var activeRight = activeProps.x + activeProps.w;
						var y = fixed.y - minDistance;
						var x;
						if(activeRight >= fixedProps.x && activeProps.x <= fixedRight){
							//x轴重叠的情况
							var half = fixedProps.x + fixedProps.w / 2;
							if(active.x < half){
								//从左边绕
								x = fixedProps.x < activeProps.x ? fixedProps.x - minDistance : activeProps.x - minDistance;
							}else{
								//从右边绕
								x = fixedRight > activeRight ? fixedRight + minDistance : activeRight + minDistance;
							}
							if(activeProps.y < fixed.y){
								y = activeProps.y - minDistance;
							}
						}else{
							if(active.x < fixed.x){
								x = activeRight + (fixedProps.x - activeRight) / 2;
							}else{
								x = fixedRight + (activeProps.x - fixedRight) / 2;
							}
						}
						points.push({x: fixed.x, y: y});
						points.push({x: x, y: y});
						y = active.y + minDistance;
						points.push({x: x, y: y});
						points.push({x: active.x, y: y});
					}
				}else if((fromDir == 2 && toDir == 4) || (fromDir == 4 && toDir == 2)){
					//情况6：一个点向右，一个点向左
					if(fromDir == 2){
						fixed = from;
						active = to;
						reverse = false;
					}else{
						fixed = to;
						active = from;
						reverse = true;
					}
					var fixedProps = Model.getShapeById(fixed.id).props;
					var activeProps = Model.getShapeById(active.id).props;
					if(active.x > fixed.x){
						var x = fixed.x + xDistance / 2;
						points.push({x: x, y: fixed.y});
						points.push({x: x, y: active.y});
					}else{
						var fixedBottom = fixedProps.y + fixedProps.h;
						var activeBottom = activeProps.y + activeProps.h;
						var x = fixed.x + minDistance;
						var y;
						if(activeBottom >= fixedProps.y && activeProps.y <= fixedBottom){
							//y轴重叠的情况
							var half = fixedProps.y + fixedProps.h / 2;
							if(active.y < half){
								//从上边绕
								y = fixedProps.y < activeProps.y ? fixedProps.y - minDistance : activeProps.y - minDistance;
							}else{
								//从下边绕
								y = fixedBottom > activeBottom ? fixedBottom + minDistance : activeBottom + minDistance;
							}
							if(activeProps.x + activeProps.w > fixed.x){
								x = activeProps.x + activeProps.w + minDistance;
							}
						}else{
							if(active.y < fixed.y){
								y = activeBottom + (fixedProps.y - activeBottom) / 2;
							}else{
								y = fixedBottom + (activeProps.y - fixedBottom) / 2;
							}
						}
						points.push({x: x, y: fixed.y});
						points.push({x: x, y: y});
						x = active.x - minDistance;
						points.push({x: x, y: y});
						points.push({x: x, y: active.y});
					}
				}else if((fromDir == 1 && toDir == 2) || (fromDir == 2 && toDir == 1)){
					//情况7：一个点向上，一个点向右
					if(fromDir == 2){
						fixed = from;
						active = to;
						reverse = false;
					}else{
						fixed = to;
						active = from;
						reverse = true;
					}
					var fixedProps = Model.getShapeById(fixed.id).props;
					var activeProps = Model.getShapeById(active.id).props;
					if(active.x > fixed.x && active.y > fixed.y){
						points.push({x: active.x, y: fixed.y});
					}else if(active.x > fixed.x && activeProps.x > fixed.x){
						var x;
						if(activeProps.x - fixed.x < minDistance * 2){
							x = fixed.x + (activeProps.x - fixed.x) / 2;
						}else{
							x = fixed.x + minDistance;
						}
						var y = active.y - minDistance;
						points.push({x: x, y: fixed.y});
						points.push({x: x, y: y});
						points.push({x: active.x, y: y});
					}else if(active.x <= fixed.x && active.y > fixedProps.y + fixedProps.h){
						var fixedBottom = fixedProps.y + fixedProps.h;
						var x = fixed.x + minDistance;
						var y
						if(active.y - fixedBottom < minDistance * 2){
							y = fixedBottom + (active.y - fixedBottom) / 2;
						}else{
							y = active.y - minDistance;
						}
						points.push({x: x, y: fixed.y});
						points.push({x: x, y: y});
						points.push({x: active.x, y: y});
					}else{
						var x;
						var activeRight = activeProps.x + activeProps.w;
						if(activeRight > fixed.x){
							x = activeRight + minDistance;
						}else{
							x = fixed.x + minDistance;
						}
						var y;
						if(active.y < fixedProps.y){
							y = active.y - minDistance;
						}else{
							y = fixedProps.y - minDistance;
						}
						points.push({x: x, y: fixed.y});
						points.push({x: x, y: y});
						points.push({x: active.x, y: y});
					}
				}else if((fromDir == 1 && toDir == 4) || (fromDir == 4 && toDir == 1)){
					//情况8：一个点向上，一个点向左
					if(fromDir == 4){
						fixed = from;
						active = to;
						reverse = false;
					}else{
						fixed = to;
						active = from;
						reverse = true;
					}
					var fixedProps = Model.getShapeById(fixed.id).props;
					var activeProps = Model.getShapeById(active.id).props;
					var activeRight = activeProps.x + activeProps.w;
					if(active.x < fixed.x && active.y > fixed.y){
						points.push({x: active.x, y: fixed.y});
					}else if(active.x < fixed.x && activeRight < fixed.x){
						var x;
						if(fixed.x - activeRight < minDistance * 2){
							x = activeRight + (fixed.x - activeRight) / 2;
						}else{
							x = fixed.x - minDistance;
						}
						var y = active.y - minDistance;
						points.push({x: x, y: fixed.y});
						points.push({x: x, y: y});
						points.push({x: active.x, y: y});
					}else if(active.x >= fixed.x && active.y > fixedProps.y + fixedProps.h){
						var fixedBottom = fixedProps.y + fixedProps.h;
						var x = fixed.x - minDistance;
						var y
						if(active.y - fixedBottom < minDistance * 2){
							y = fixedBottom + (active.y - fixedBottom) / 2;
						}else{
							y = active.y - minDistance;
						}
						points.push({x: x, y: fixed.y});
						points.push({x: x, y: y});
						points.push({x: active.x, y: y});
					}else{
						var x;
						if(activeProps.x < fixed.x){
							x = activeProps.x - minDistance;
						}else{
							x = fixed.x - minDistance;
						}
						var y;
						if(active.y < fixedProps.y){
							y = active.y - minDistance;
						}else{
							y = fixedProps.y - minDistance;
						}
						points.push({x: x, y: fixed.y});
						points.push({x: x, y: y});
						points.push({x: active.x, y: y});
					}
				}else if((fromDir == 2 && toDir == 3) || (fromDir == 3 && toDir == 2)){
					//情况9：一个点向右，一个点向下
					if(fromDir == 2){
						fixed = from;
						active = to;
						reverse = false;
					}else{
						fixed = to;
						active = from;
						reverse = true;
					}
					var fixedProps = Model.getShapeById(fixed.id).props;
					var activeProps = Model.getShapeById(active.id).props;
					if(active.x > fixed.x && active.y < fixed.y){
						points.push({x: active.x, y: fixed.y});
					}else if(active.x > fixed.x && activeProps.x > fixed.x){
						var x;
						if(activeProps.x - fixed.x < minDistance * 2){
							x = fixed.x + (activeProps.x - fixed.x) / 2;
						}else{
							x = fixed.x + minDistance;
						}
						var y = active.y + minDistance;
						points.push({x: x, y: fixed.y});
						points.push({x: x, y: y});
						points.push({x: active.x, y: y});
					}else if(active.x <= fixed.x && active.y < fixedProps.y){
						var x = fixed.x + minDistance;
						var y
						if(fixedProps.y - active.y < minDistance * 2){
							y = active.y + (fixedProps.y - active.y) / 2;
						}else{
							y = active.y + minDistance;
						}
						points.push({x: x, y: fixed.y});
						points.push({x: x, y: y});
						points.push({x: active.x, y: y});
					}else{
						var x;
						var activeRight = activeProps.x + activeProps.w;
						if(activeRight > fixed.x){
							x = activeRight + minDistance;
						}else{
							x = fixed.x + minDistance;
						}
						var y;
						if(active.y > fixedProps.y + fixedProps.h){
							y = active.y + minDistance;
						}else{
							y = fixedProps.y + fixedProps.h + minDistance;
						}
						points.push({x: x, y: fixed.y});
						points.push({x: x, y: y});
						points.push({x: active.x, y: y});
					}
				}else if((fromDir == 3 && toDir == 4) || (fromDir == 4 && toDir == 3)){
					//情况10：一个点向下，一个点向左
					if(fromDir == 4){
						fixed = from;
						active = to;
						reverse = false;
					}else{
						fixed = to;
						active = from;
						reverse = true;
					}
					var fixedProps = Model.getShapeById(fixed.id).props;
					var activeProps = Model.getShapeById(active.id).props;
					var activeRight = activeProps.x + activeProps.w;
					if(active.x < fixed.x && active.y < fixed.y){
						points.push({x: active.x, y: fixed.y});
					}else if(active.x < fixed.x && activeRight < fixed.x){
						var x;
						if(fixed.x - activeRight < minDistance * 2){
							x = activeRight + (fixed.x - activeRight) / 2;
						}else{
							x = fixed.x - minDistance;
						}
						var y = active.y + minDistance;
						points.push({x: x, y: fixed.y});
						points.push({x: x, y: y});
						points.push({x: active.x, y: y});
					}else if(active.x >= fixed.x && active.y < fixedProps.y){
						var x = fixed.x - minDistance;
						var y
						if(fixedProps.y - active.y < minDistance * 2){
							y = active.y + (fixedProps.y - active.y) / 2;
						}else{
							y = active.y + minDistance;
						}
						points.push({x: x, y: fixed.y});
						points.push({x: x, y: y});
						points.push({x: active.x, y: y});
					}else{
						var x;
						if(activeProps.x < fixed.x){
							x = activeProps.x - minDistance;
						}else{
							x = fixed.x - minDistance;
						}
						var y;
						if(active.y > fixedProps.y + fixedProps.h){
							y = active.y + minDistance;
						}else{
							y = fixedProps.y + fixedProps.h + minDistance;
						}
						points.push({x: x, y: fixed.y});
						points.push({x: x, y: y});
						points.push({x: active.x, y: y});
					}
				}
				if(reverse){
					points.reverse();
				}
			}else if(from.id != null || to.id != null){














				//只有起点或终点连接了形状
				//连接了形状的端点被认为是固定点，另一点被认为是活动的点
				var fixed, active, reverse, angle;
				if(from.id != null){
					fixed = from;
					active = to;
					reverse = false;
					angle = from.angle
				}else{
					fixed = to;
					active = from;
					reverse = true; //如果固定点是终点，需要把得到的点逆序，因为绘制时是从起点开始的，而此处计算获得的点将是从终点开始
					angle = to.angle
                }
                


                // console.log('angle', angle)
                var props = Model.getShapeById(fixed.id).props;
                


				if(angle >= pi / 4 && angle < pi / 4 * 3){
					//起点角度为向上
					if(active.y < fixed.y){
						//终点在起点图形上方
						if(xDistance >= yDistance){
							//如果终点离起点的水平距离较远，最终方向为水平，此情况下只有一个折点
							points.push({x: fixed.x, y: active.y});
						}else{
							//如果终点离起点的垂直距离较远，最终方向为向上，此情况下有两个折点
							var half = yDistance / 2;
							points.push({x: fixed.x, y: fixed.y - half});
							points.push({x: active.x, y: fixed.y - half});
						}
					}else{
						//终点在起点水平平行或下方的位置
						points.push({x: fixed.x, y: fixed.y - minDistance}); //先向上画一笔
						if(xDistance >= yDistance){
							//如果终点离起点的水平距离较远，最终方向为水平
							if(active.x >= props.x - minDistance && active.x <= props.x + props.w + minDistance){
								//如果终点在x轴上的坐标，在图形范围内，在判断终点与形状是偏左还是偏右
								var shapeHalf = props.x + props.w / 2;
								if(active.x < shapeHalf){
									//偏左，第二点在形状左上角
									points.push({x: props.x - minDistance, y: fixed.y - minDistance});
									points.push({x: props.x - minDistance, y: active.y});
								}else{
									points.push({x: props.x + props.w + minDistance, y: fixed.y - minDistance});
									points.push({x: props.x + props.w + minDistance, y: active.y});
								}
							}else{
								//如果终点在x轴上的坐标，在图形范围外，此时有三个点
								if(active.x < props.x){
									points.push({x: active.x + minDistance, y: fixed.y - minDistance});
									points.push({x: active.x + minDistance, y: active.y});
								}else{
									points.push({x: active.x - minDistance, y: fixed.y - minDistance});
									points.push({x: active.x - minDistance, y: active.y});
								}
							}
						}else{
							//如果终点离起点的垂直距离较远，最终方向为向下
							if(active.x >= props.x - minDistance && active.x <= props.x + props.w + minDistance){
								//如果终点在x轴上的坐标，在图形范围内，此时有四个点
								//在判断终点与形状是偏左还是偏右
								var shapeHalf = props.x + props.w / 2;
								if(active.x < shapeHalf){
									//偏左，第二点在形状左上角
									points.push({x: props.x - minDistance, y: fixed.y - minDistance});
									points.push({x: props.x - minDistance, y: active.y - minDistance});
									points.push({x: active.x, y: active.y - minDistance});
								}else{
									points.push({x: props.x + props.w + minDistance, y: fixed.y - minDistance});
									points.push({x: props.x + props.w + minDistance, y: active.y - minDistance});
									points.push({x: active.x, y: active.y - minDistance});
								}
							}else{
								//如果终点在x轴上的坐标，在图形范围外，此时有两个点
								points.push({x: active.x, y: fixed.y - minDistance});
							}
						}
					}
				}else if(angle >= pi / 4 * 3 && angle < pi / 4 * 5){
					//起点角度为向右
					if(active.x > fixed.x){
						//终点在起点图形右方
						if(xDistance >= yDistance){
							//如果终点离起点的水平距离较远，最终方向为水平，此情况下有两个折点
							var half = xDistance / 2;
							points.push({x: fixed.x + half, y: fixed.y});
							points.push({x: fixed.x + half, y: active.y});
						}else{
							//如果终点离起点的垂直距离较远，最终方向为垂直，此情况下只有一个折点
							points.push({x: active.x, y: fixed.y});
						}
					}else{
						points.push({x: fixed.x + minDistance, y: fixed.y});
						if(xDistance >= yDistance){
							//如果终点离起点的水平距离较远，最终方向为水平
							if(active.y >= props.y - minDistance && active.y <= props.y + props.h + minDistance){
								//如果终点在y轴上的坐标，在图形范围内，在判断终点与形状是偏上还是偏下
								var shapeHalf = props.y + props.h / 2;
								if(active.y < shapeHalf){
									//偏上，第二点在形状右上角
									points.push({x: fixed.x + minDistance, y: props.y - minDistance});
									points.push({x: active.x + minDistance, y: props.y - minDistance});
									points.push({x: active.x + minDistance, y: active.y});
								}else{
									points.push({x: fixed.x + minDistance, y: props.y + props.h + minDistance});
									points.push({x: active.x + minDistance, y: props.y + props.h + minDistance});
									points.push({x: active.x + minDistance, y: active.y});
								}
							}else{
								points.push({x: fixed.x + minDistance, y: active.y});
							}
						}else{
							//如果终点离起点的垂直距离较远，最终方向为向下
							if(active.y >= props.y - minDistance && active.y <= props.y + props.h + minDistance){
								var shapeHalf = props.y + props.h / 2;
								if(active.y < shapeHalf){
									points.push({x: fixed.x + minDistance, y: props.y - minDistance});
									points.push({x: active.x, y: props.y - minDistance});
								}else{
									points.push({x: fixed.x + minDistance, y: props.y + props.h + minDistance});
									points.push({x: active.x, y: props.y + props.h + minDistance});
								}
							}else{
								if(active.y < fixed.y){
									points.push({x: fixed.x + minDistance, y: active.y + minDistance});
									points.push({x: active.x, y: active.y + minDistance});
								}else{
									points.push({x: fixed.x + minDistance, y: active.y - minDistance});
									points.push({x: active.x, y: active.y - minDistance});
								}
							}
						}
					}
				}else if(angle >= pi / 4 * 5 && angle < pi / 4 * 7){
					//起点角度为向下
					if(active.y > fixed.y){
                        // console.log('Frida Test 4');
						if(xDistance >= yDistance){
							points.push({x: fixed.x, y: active.y});
						}else{
							var half = yDistance / 2;
							points.push({x: fixed.x, y: fixed.y + half});
							points.push({x: active.x, y: fixed.y + half});
						}
					}else{
						points.push({x: fixed.x, y: fixed.y + minDistance}); 
						if(xDistance >= yDistance){
							if(active.x >= props.x - minDistance && active.x <= props.x + props.w + minDistance){
								var shapeHalf = props.x + props.w / 2;
								if(active.x < shapeHalf){
									points.push({x: props.x - minDistance, y: fixed.y + minDistance});
									points.push({x: props.x - minDistance, y: active.y});
								}else{
									points.push({x: props.x + props.w + minDistance, y: fixed.y + minDistance});
									points.push({x: props.x + props.w + minDistance, y: active.y});
								}
							}else{
								if(active.x < props.x){
									points.push({x: active.x + minDistance, y: fixed.y + minDistance});
									points.push({x: active.x + minDistance, y: active.y});
								}else{
									points.push({x: active.x - minDistance, y: fixed.y + minDistance});
									points.push({x: active.x - minDistance, y: active.y});
								}
							}
						}else{
							if(active.x >= props.x - minDistance && active.x <= props.x + props.w + minDistance){
								var shapeHalf = props.x + props.w / 2;
								if(active.x < shapeHalf){
									points.push({x: props.x - minDistance, y: fixed.y + minDistance});
									points.push({x: props.x - minDistance, y: active.y + minDistance});
									points.push({x: active.x, y: active.y + minDistance});
								}else{
									points.push({x: props.x + props.w + minDistance, y: fixed.y + minDistance});
									points.push({x: props.x + props.w + minDistance, y: active.y + minDistance});
									points.push({x: active.x, y: active.y + minDistance});
								}
							}else{
								points.push({x: active.x, y: fixed.y + minDistance});
							}
						}
					}
				}else{
					//起点角度为向左
					if(active.x < fixed.x){
						if(xDistance >= yDistance){
							var half = xDistance / 2;
							points.push({x: fixed.x - half, y: fixed.y});
							points.push({x: fixed.x - half, y: active.y});
						}else{
							points.push({x: active.x, y: fixed.y});
						}
					}else{
						points.push({x: fixed.x - minDistance, y: fixed.y});
						if(xDistance >= yDistance){
							if(active.y >= props.y - minDistance && active.y <= props.y + props.h + minDistance){
								var shapeHalf = props.y + props.h / 2;
								if(active.y < shapeHalf){
									points.push({x: fixed.x - minDistance, y: props.y - minDistance});
									points.push({x: active.x - minDistance, y: props.y - minDistance});
									points.push({x: active.x - minDistance, y: active.y});
								}else{
									points.push({x: fixed.x - minDistance, y: props.y + props.h + minDistance});
									points.push({x: active.x - minDistance, y: props.y + props.h + minDistance});
									points.push({x: active.x - minDistance, y: active.y});
								}
							}else{
								points.push({x: fixed.x - minDistance, y: active.y});
							}
						}else{
							//如果终点离起点的垂直距离较远，最终方向为向下
							if(active.y >= props.y - minDistance && active.y <= props.y + props.h + minDistance){
								var shapeHalf = props.y + props.h / 2;
								if(active.y < shapeHalf){
									points.push({x: fixed.x - minDistance, y: props.y - minDistance});
									points.push({x: active.x, y: props.y - minDistance});
								}else{
									points.push({x: fixed.x - minDistance, y: props.y + props.h + minDistance});
									points.push({x: active.x, y: props.y + props.h + minDistance});
								}
							}else{
								if(active.y < fixed.y){
									points.push({x: fixed.x - minDistance, y: active.y + minDistance});
									points.push({x: active.x, y: active.y + minDistance});
								}else{
									points.push({x: fixed.x - minDistance, y: active.y - minDistance});
									points.push({x: active.x, y: active.y - minDistance});
								}
							}
						}
					}
				}
				if(reverse){
					points.reverse();
				}
            
            












            
            
            
            
            
            }else{
				//折线的起点和终点都没有角度(没有连接形状)
				if(xDistance >= yDistance){
                    //如果宽大于高，连接线整体方向为水平
					var half = (to.x - from.x) / 2;
					points.push({x: from.x + half, y: from.y});
					points.push({x: from.x + half, y: to.y});
				}else{
                    //否则为垂直
					var half = (to.y - from.y) / 2;
					points.push({x: from.x, y: from.y + half});
					points.push({x: to.x, y: from.y + half});
				}
			}
		}else if(linker.linkerType == "curve"){
			var from = linker.from;
			var to = linker.to;
			var distance = this.measureDistance(from, to);
			var cDistance = distance * 0.4; //控制点的距离，等于起始点距离的1/5
			/**
			 * 获取控制点坐标
			 */
			function getControlPoint(point, another){
				if(point.id != null){
					return {
						x: point.x - cDistance * Math.cos(point.angle),
						y: point.y - cDistance * Math.sin(point.angle)
					};
				}else{
					var yDistance = Math.abs(point.y - another.y);
					var xDiatance = Math.abs(point.x - another.x);
					var curveAngle = Math.atan(yDistance / xDiatance);
					var result = {};
					if(point.x <= another.x){
						result.x = point.x + cDistance * Math.cos(curveAngle);
					}else{
						result.x = point.x - cDistance * Math.cos(curveAngle);
					}
					if(point.y <= another.y){
						result.y = point.y + cDistance * Math.sin(curveAngle);
					}else{
						result.y = point.y - cDistance * Math.sin(curveAngle);
					}
					return result;
				}
			}
			points.push(getControlPoint(from, to));
			points.push(getControlPoint(to, from));
		}
		return points;
    },
    

























    getLinkerLinePoints: function(d) {
        var b = [];
        if (d.linkerType != "curve") {
            b.push(d.from);
            b = b.concat(d.points)
        } else {
            var c = 0.05;
            var a = 0;
            while (a <= 1) {
                var e = {
                    x: (1 - a) * (1 - a) * (1 - a) * d.from.x + 3 * (1 - a) * (1 - a) * a * d.points[0].x + 3 * (1 - a) * a * a * d.points[1].x + a * a * a * d.to.x,
                    y: (1 - a) * (1 - a) * (1 - a) * d.from.y + 3 * (1 - a) * (1 - a) * a * d.points[0].y + 3 * (1 - a) * a * a * d.points[1].y + a * a * a * d.to.y
                };
                b.push(e);
                a += c
            }
        }
        b.push(d.to);
        return b
    },
    getLinkerLinesPoints: function(f) {
        var d = [];
        var e = 0.1;
        var c = 0;
        if (f.linkerType == "broken") {
            d.push(f.from);
            for (var b = 0; b < f.points.length; b++) {
                var a = f.points[b]
            }
            while (c <= 1) {
                var g = {
                    x: f.from.x * (1 - c) + f.to.x * c,
                    y: f.from.y * (1 - c) + f.to.y * c
                };
                d.push(g);
                c += e
            }
        }
        if (f.linkerType == "normal") {
            d.push(f.from);
            while (c <= 1) {
                var g = {
                    x: f.from.x * (1 - c) + f.to.x * c,
                    y: f.from.y * (1 - c) + f.to.y * c
                };
                d.push(g);
                c += e
            }
        } else {
            while (c <= 1) {
                var g = {
                    x: (1 - c) * (1 - c) * (1 - c) * f.from.x + 3 * (1 - c) * (1 - c) * c * f.points[0].x + 3 * (1 - c) * c * c * f.points[1].x + c * c * c * f.to.x,
                    y: (1 - c) * (1 - c) * (1 - c) * f.from.y + 3 * (1 - c) * (1 - c) * c * f.points[0].y + 3 * (1 - c) * c * c * f.points[1].y + c * c * c * f.to.y
                };
                d.push(g);
                c += e
            }
        }
        d.push(f.to);
        return d
    },
    getLinkerBox: function(g) {
        var j = this.getLinkerLinePoints(g);
        var d = j[0].x;
        var c = j[0].y;
        var b = j[0].x;
        var a = j[0].y;
        for (var e = 0; e < j.length; e++) {
            var h = j[e];
            if (h.x < d) {
                d = h.x
            } else {
                if (h.x > b) {
                    b = h.x
                }
            }
            if (h.y < c) {
                c = h.y
            } else {
                if (h.y > a) {
                    a = h.y
                }
            }
        }
        var f = {
            x: d,
            y: c,
            w: b - d,
            h: a - c
        };
        return f
    },
    getShapeBox: function(a) {
        var b = a.props;
        var c = a.props.angle;
        return this.getRotatedBox(b, c)
    },
    getRotatedBox: function(g, e, b) {
        if (e == 0) {
            return g
        } else {
            if (!b) {
                b = {
                    x: g.x + g.w / 2,
                    y: g.y + g.h / 2
                }
            }
            var k = this.getRotated(b, {
                x: g.x,
                y: g.y
            }, e);
            var j = this.getRotated(b, {
                x: g.x + g.w,
                y: g.y
            }, e);
            var i = this.getRotated(b, {
                x: g.x + g.w,
                y: g.y + g.h
            }, e);
            var h = this.getRotated(b, {
                x: g.x,
                y: g.y + g.h
            }, e);
            var f = Math.min(k.x, j.x, i.x, h.x);
            var c = Math.max(k.x, j.x, i.x, h.x);
            var d = Math.min(k.y, j.y, i.y, h.y);
            var a = Math.max(k.y, j.y, i.y, h.y);
            return {
                x: f,
                y: d,
                w: c - f,
                h: a - d
            }
        }
    },
    getRotated: function(c, b, g) {
        var f = this.measureDistance(c, b);
        if (f == 0 || g == 0) {
            return b
        }
        var d = Math.atan(Math.abs(b.x - c.x) / Math.abs(c.y - b.y));
        if (b.x >= c.x && b.y >= c.y) {
            d = Math.PI - d
        } else {
            if (b.x <= c.x && b.y >= c.y) {
                d = Math.PI + d
            } else {
                if (b.x <= c.x && b.y <= c.y) {
                    d = Math.PI * 2 - d
                }
            }
        }
        d = d % (Math.PI * 2);
        var e = (d + g) % (Math.PI * 2);
        var a = {
            x: c.x + Math.sin(e) * f,
            y: c.y - Math.cos(e) * f
        };
        return a
    },
    getShapeAnchorInLinker: function(c) {
        var k = c.getAnchors();
        var d = [];
        var r = {
            x: c.props.x + c.props.w / 2,
            y: c.props.y + c.props.h / 2
        };
        for (var p = 0; p < k.length; p++) {
            var m = k[p];
            var n = {
                x: m.x + c.props.x,
                y: m.y + c.props.y
            };
            var f = this.getRotated(r, n, c.props.angle);
            d.push(f)
        }
        var h = [];
        var e = 2;
        for (var o = Model.orderList.length - 1; o >= 0; o--) {
            var l = Model.orderList[o].id;
            var s = Model.getShapeById(l);
            if (s.name != "linker" || (s.attribute && s.attribute.collapseBy)) {
                continue
            }
            var j = s;
            var q = null;
            e = 3;
            for (var p = 0; p < d.length; p++) {
                var a = d[p];
                var b = {
                    x: a.x - e,
                    y: a.y - e,
                    w: e * 2,
                    h: e * 2
                };
                if (j.from.id == null && this.pointInRect(j.from.x, j.from.y, b)) {
                    q = {
                        linker: j,
                        anchors: [a],
                        type: "from"
                    };
                    break
                }
                if (j.to.id == null && this.pointInRect(j.to.x, j.to.y, b)) {
                    q = {
                        linker: j,
                        anchors: [a],
                        type: "to"
                    };
                    break
                }
            }
            e = 2;
            if (q == null) {
                for (var p = 0; p < d.length; p++) {
                    var a = d[p];
                    var g = Utils.pointInLinker(a, j, e);
                    if (g > -1) {
                        if (q == null) {
                            q = {
                                linker: j,
                                anchors: [],
                                type: "line"
                            }
                        }
                        q.anchors.push(a)
                    }
                }
            }
            if (q != null) {
                h.push(q)
            }
        }
        return h
    },
    getEndpointAngle: function(d, f) {
        var a;
        if (f == "from") {
            a = d.from
        } else {
            a = d.to
        }
        var c;
        if (d.linkerType == "normal") {
            if (f == "from") {
                c = d.to
            } else {
                c = d.from
            }
        } else {
            if (d.linkerType == "broken") {
                if (f == "from") {
                    c = d.points[0]
                } else {
                    c = d.points[d.points.length - 1]
                }
            } else {
                var e = 12;
                var b;
                var g = Utils.measureDistance(d.from, d.to);
                if (f == "from") {
                    b = e / g
                } else {
                    b = 1 - e / g
                }
                c = {
                    x: (1 - b) * (1 - b) * (1 - b) * d.from.x + 3 * (1 - b) * (1 - b) * b * d.points[0].x + 3 * (1 - b) * b * b * d.points[1].x + b * b * b * d.to.x,
                    y: (1 - b) * (1 - b) * (1 - b) * d.from.y + 3 * (1 - b) * (1 - b) * b * d.points[0].y + 3 * (1 - b) * b * b * d.points[1].y + b * b * b * d.to.y
                }
            }
        }
        return this.getAngle(c, a)
    },
    getAngle: function(c, a) {
        var b = Math.atan(Math.abs(c.y - a.y) / Math.abs(c.x - a.x));
        if (a.x <= c.x && a.y > c.y) {
            b = Math.PI - b
        } else {
            if (a.x < c.x && a.y <= c.y) {
                b = Math.PI + b
            } else {
                if (a.x >= c.x && a.y < c.y) {
                    b = Math.PI * 2 - b
                }
            }
        }
        return b
    },
    getDarkerColor: function(c, h) {
        if (!h) {
            h = 13
        }
        var f = c.split(",");
        var a = parseInt(f[0]);
        var e = parseInt(f[1]);
        var i = parseInt(f[2]);
        var d = Math.round(a - a / 255 * h);
        if (d < 0) {
            d = 0
        }
        var j = Math.round(e - e / 255 * h);
        if (j < 0) {
            j = 0
        }
        var k = Math.round(i - i / 255 * h);
        if (k < 0) {
            k = 0
        }
        return d + "," + j + "," + k
    },
    getDarkestColor: function(a) {
        return this.getDarkerColor(a, 26)
    },
    toScale: function(c) {
        var a = {};
        for (var b in c) {
            a[b] = c[b];
            if (typeof c[b] == "number") {
                a[b] = a[b].toScale()
            }
        }
        return a
    },
    restoreScale: function(c) {
        var a = {};
        for (var b in c) {
            a[b] = c[b];
            if (typeof c[b] == "number") {
                a[b] = a[b].restoreScale()
            }
        }
        return a
    },

    /**
	 * 获取选中图形以外的连接线
	 */
	getOutlinkers: function(shapes){
		var outlinkers = [];
		var outlinkerIds = [];
		for(var i = 0; i < shapes.length; i++){
			var shape = shapes[i];
			if(shape.name != "linker"){
				//从linkerMap中取到形状上的连接线
				var linkerIds = Model.getShapeLinkers(shape.id);
				if(linkerIds && linkerIds.length > 0){
					for(var index = 0; index < linkerIds.length; index++){
						var id = linkerIds[index];
						if(!this.isSelected(id) && outlinkerIds.indexOf(id) < 0){
							//只获取未选中的
							outlinkers.push(Model.getShapeById(id));
							outlinkerIds.push(id);
						}
					}
				}
			}
		}
		return outlinkers;
	},
    getFamilyShapes: function(a) {
        var g = [];
        for (var d = 0; d < a.length; d++) {
            var b = a[d];
            if (b.name != "linker") {
                if (b.parent) {
                    var f = Model.getShapeById(b.parent);
                    if (!Utils.isSelected(b.parent)) {
                        g.push(f)
                    }
                    var e = this.getChildrenShapes(f);
                    g = g.concat(e)
                }
                var c = this.getChildrenShapes(b);
                g = g.concat(c)
            }
        }
        return g
    },
    getChildrenShapes: function(a) {
        var c = [];
        if (a.children && a.children.length > 0) {
            for (var b = 0; b < a.children.length; b++) {
                var d = a.children[b];
                if (!Utils.isSelected(d)) {
                    c.push(Model.getShapeById(d))
                }
            }
        }
        return c
    },
    isFamilyShape: function(b, a) {
        if (b.parent == a.id) {
            return true
        } else {
            if (b.id == a.parent) {
                return true
            } else {
                if (b.parent && b.parent == a.parent) {
                    return true
                }
            }
        }
        return false
    },
    getContainedShapes: function(c) {
        var b = [];
        var e = [];
        for (var f = 0; f < c.length; f++) {
            var d = c[f];
            if (d.name != "linker" && d.attribute && d.attribute.container) {
                var g = a(d);
                b = b.concat(g)
            }
        }
        function a(h) {
            var l = [];
            for (var k = Model.orderList.length - 1; k >= 0; k--) {
                var n = Model.orderList[k].id;
                if (h.id != n && !Utils.isSelected(n) && e.indexOf(n) < 0) {
                    var j = Model.getShapeById(n);
                    if (!j.attribute || typeof j.attribute.container == "undefined" || j.attribute.container == false) {
                        if (!Utils.isFamilyShape(j, h)) {
                            var m = Utils.getShapeBox(j);
                            if (Utils.rectInRect(m, h.props) && j.container == h.id) {
                                l.push(j);
                                e.push(n)
                            }
                        }
                    }
                }
            }
            return l
        }
        return b
    },
    getAttachedShapes: function(c) {
        var a = [];
        for (var f = 0; f < c.length; f++) {
            a.push(c[f].id)
        }
        var g = [];
        for (var f = 0; f < c.length; f++) {
            var h = c[f];
            if (h.groupName == "task" || h.groupName == "callActivity" || h.groupName == "subProcess") {
                var b = [];
                for (var d = Model.orderList.length - 1; d >= 0; d--) {
                    var k = Model.orderList[d].id;
                    var e = Model.getShapeById(k);
                    if (e.attachTo == h.id && !Utils.isSelected(k) && a.indexOf(k) < 0) {
                        b.push(e)
                    }
                }
                g = g.concat(b)
            }
        }
        return g
    },
    copy: function(a) {
        return $.extend(true, {}, a)
    },
    rangeChildren: function(j) {
        var e = [];
        if (j.children && j.children.length > 0) {
            if (j.name == "verticalPool") {
                var o = [];
                var b = [];
                for (var f = 0; f < j.children.length; f++) {
                    var d = j.children[f];
                    var c = Model.getShapeById(d);
                    if (c.name == "horizontalSeparator") {
                        b.push(c)
                    } else {
                        o.push(c)
                    }
                }
                o.sort(function(i, h) {
                    return i.props.x - h.props.x
                });
                var l = j.props.x;
                for (var f = 0; f < o.length; f++) {
                    var c = o[f];
                    c.props.x = l;
                    Designer.painter.renderShape(c);
                    e.push(c);
                    l += c.props.w
                }
                b.sort(function(i, h) {
                    return i.props.y - h.props.y
                });
                var k = j.props.y + 40;
                for (var f = 0; f < b.length; f++) {
                    var c = b[f];
                    var a = c.props.y + c.props.h;
                    c.props.w = j.props.w;
                    c.props.y = k;
                    var g = a - k;
                    c.props.h = g;
                    Designer.painter.renderShape(c);
                    e.push(c);
                    k += g
                }
            } else {
                if (j.name == "horizontalPool") {
                    var o = [];
                    var b = [];
                    for (var f = 0; f < j.children.length; f++) {
                        var d = j.children[f];
                        var c = Model.getShapeById(d);
                        if (c.name == "verticalSeparator") {
                            b.push(c)
                        } else {
                            o.push(c)
                        }
                    }
                    o.sort(function(i, h) {
                        return i.props.y - h.props.y
                    });
                    var k = j.props.y;
                    for (var f = 0; f < o.length; f++) {
                        var c = o[f];
                        c.props.y = k;
                        Designer.painter.renderShape(c);
                        e.push(c);
                        k += c.props.h
                    }
                    b.sort(function(i, h) {
                        return i.props.x - h.props.x
                    });
                    var l = j.props.x + 40;
                    for (var f = 0; f < b.length; f++) {
                        var c = b[f];
                        var n = c.props.x + c.props.w;
                        c.props.h = j.props.h;
                        c.props.x = l;
                        var m = n - l;
                        c.props.w = m;
                        Designer.painter.renderShape(c);
                        e.push(c);
                        l += m
                    }
                }
            }
        }
        return e
    },
    getRelativePos: function(c, b, d) {
        var a = d.offset();
        if (a == null) {
            a = {
                left: 0,
                top: 0
            }
        }
        return {
            x: c - a.left + d.scrollLeft(),
            y: b - a.top + d.scrollTop()
        }
    },
    getCollapsedShapes: function(b) {
        var k = [];
        var a = [];
        for (var e = 0; e < b.length; e++) {
            var f = b[e];
            if (f.attribute && f.attribute.collapsed) {
                var h = [];
                for (var c = Model.orderList.length - 1; c >= 0; c--) {
                    var g = Model.orderList[c].id;
                    var d = Model.getShapeById(g);
                    if (d.attribute && d.attribute.collapseBy == f.id && a.indexOf(g) < 0) {
                        h.push(d)
                    }
                }
                k = k.concat(h)
            }
        }
        return k
    },
    getCollapsedShapesById: function(e) {
        var a = [];
        for (var c = Model.orderList.length - 1; c >= 0; c--) {
            var d = Model.orderList[c].id;
            var b = Model.getShapeById(d);
            if (b.attribute && b.attribute.collapseBy == e) {
                a.push(b)
            }
        }
        return a
    },
    getShapeLineStyle: function(a, b) {
        if (b == false || !Model.define.theme || !Model.define.theme.shape) {
            return $.extend({}, Schema.shapeDefaults.lineStyle, a)
        } else {
            return $.extend({}, Schema.shapeDefaults.lineStyle, Model.define.theme.shape.lineStyle, a)
        }
    },
    getLinkerLineStyle: function(a, b) {
        if (b == false || !Model.define.theme || !Model.define.theme.linker) {
            return $.extend({}, Schema.linkerDefaults.lineStyle, a)
        } else {
            return $.extend({}, Schema.linkerDefaults.lineStyle, Model.define.theme.linker.lineStyle, a)
        }
    },
    getShapeFontStyle: function(b, a) {
        if (a == false || !Model.define.theme || !Model.define.theme.shape) {
            return $.extend({}, Schema.shapeDefaults.fontStyle, b)
        } else {
            return $.extend({}, Schema.shapeDefaults.fontStyle, Model.define.theme.shape.fontStyle, b)
        }
    },
    getLinkerFontStyle: function(b, a) {
        if (a == false || !Model.define.theme || !Model.define.theme.linker) {
            return $.extend({}, Schema.linkerDefaults.fontStyle, b)
        } else {
            return $.extend({}, Schema.linkerDefaults.fontStyle, Model.define.theme.linker.fontStyle, b)
        }
    },
    getShapeFillStyle: function(a, b) {
        if (b == false || !Model.define.theme || !Model.define.theme.shape) {
            return $.extend({}, Schema.shapeDefaults.fillStyle, a)
        } else {
            return $.extend({}, Schema.shapeDefaults.fillStyle, Model.define.theme.shape.fillStyle, a)
        }
    },
    containsChinese: function(a) {
        if (escape(a).indexOf("%u") >= 0) {
            return true
        } else {
            return false
        }
    },
    filterXss: function(a) {
        a = a.toString();
        a = a.replace(/</g, "&lt;");
        a = a.replace(/%3C/g, "&lt;");
        a = a.replace(/>/g, "&gt;");
        a = a.replace(/%3E/g, "&gt;");
        a = a.replace(/'/g, "&#39;");
        a = a.replace(/"/g, "&quot;");
        return a
    },
    showError: function() {
        var a = $("#canvas-error");
        if (a.length) {
            a = $("<div id='canvas-error'><span>保存出现了异常，为了防止内容丢失，请及时刷新页面或者反馈问题</span></div>").appendTo("body");
            a.show()
        }
    }
};
var GradientHelper = {
    createLinearGradient: function(f, i, h) {
        var b = f.props;
        var c;
        var e;
        var d;
        if (b.w > b.h) {
            c = {
                x: 0,
                y: b.h / 2
            };
            e = {
                x: b.w,
                y: b.h / 2
            };
            d = (h.angle + Math.PI / 2) % (Math.PI * 2)
        } else {
            c = {
                x: b.w / 2,
                y: 0
            };
            e = {
                x: b.w / 2,
                y: b.h
            };
            d = h.angle
        }
        if (d != 0) {
            var a = {
                x: b.w / 2,
                y: b.h / 2
            };
            c = Utils.getRotated(a, c, d);
            e = Utils.getRotated(a, e, d);
            if (c.x < 0) {
                c.x = 0
            }
            if (c.x > f.props.w) {
                c.x = f.props.w
            }
            if (c.y < 0) {
                c.y = 0
            }
            if (c.y > f.props.h) {
                c.y = f.props.h
            }
            if (e.x < 0) {
                e.x = 0
            }
            if (e.x > f.props.w) {
                e.x = f.props.w
            }
            if (e.y < 0) {
                e.y = 0
            }
            if (e.y > f.props.h) {
                e.y = f.props.h
            }
        }
        var g = i.createLinearGradient(c.x, c.y, e.x, e.y);
        g.addColorStop(0, "rgb(" + h.beginColor + ")");
        g.addColorStop(1, "rgb(" + h.endColor + ")");
        return g
    },
    createRadialGradient: function(c, a, b) {
        var f = c.props;
        var d = f.h;
        if (f.w < f.h) {
            d = f.w
        }
        var e = a.createRadialGradient(f.w / 2, f.h / 2, 10, f.w / 2, f.h / 2, d * b.radius);
        e.addColorStop(0, "rgb(" + b.beginColor + ")");
        e.addColorStop(1, "rgb(" + b.endColor + ")");
        return e
    },
    getLighterColor: function(c) {
        var h = 60;
        var f = c.split(",");
        var a = parseInt(f[0]);
        var e = parseInt(f[1]);
        var i = parseInt(f[2]);
        var d = Math.round(a + (255 - a) / 255 * h);
        if (d > 255) {
            d = 255
        }
        var j = Math.round(e + (255 - e) / 255 * h);
        if (j > 255) {
            j = 255
        }
        var k = Math.round(i + (255 - i) / 255 * h);
        if (k > 255) {
            k = 255
        }
        return d + "," + j + "," + k
    },
    getDarkerColor: function(c) {
        var h = 60;
        var f = c.split(",");
        var a = parseInt(f[0]);
        var e = parseInt(f[1]);
        var i = parseInt(f[2]);
        var d = Math.round(a - a / 255 * h);
        if (d < 0) {
            d = 0
        }
        var j = Math.round(e - e / 255 * h);
        if (j < 0) {
            j = 0
        }
        var k = Math.round(i - i / 255 * h);
        if (k < 0) {
            k = 0
        }
        return d + "," + j + "," + k
    }
};
var MessageSource = {
    batchSize: 0,
    messages: [],
    withUndo: true,
    withMessage: true,
    withDock: true,
    undoStack: {
        stack: [],
        push: function(b, a) {
            this.stack.push(b);
            if (typeof a == "undefined") {
                a = true
            }
            if (a) {
                MessageSource.redoStack.stack = []
            }
            Designer.events.push("undoStackChanged", this.stack.length)
        },
        pop: function() {
            var b = this.stack.length;
            if (b == 0) {
                return null
            }
            var a = this.stack[b - 1];
            this.stack.splice(b - 1, 1);
            MessageSource.redoStack.push(a);
            Designer.events.push("undoStackChanged", this.stack.length);
            return a
        }
    },
    redoStack: {
        stack: [],
        push: function(a) {
            this.stack.push(a);
            Designer.events.push("redoStackChanged", this.stack.length)
        },
        pop: function() {
            var b = this.stack.length;
            if (b == 0) {
                return null
            }
            var a = this.stack[b - 1];
            this.stack.splice(b - 1, 1);
            MessageSource.undoStack.push(a, false);
            Designer.events.push("redoStackChanged", this.stack.length);
            return a
        }
    },
    beginBatch: function() {
        this.batchSize++
    },
    commit: function() {
        this.batchSize--;
        this.submit()
    },
    submit: function() {
        if (this.batchSize == 0 && this.messages.length != 0) {
            if (this.withDock) {
                Dock.update(true)
            }
            if (this.withMessage == false) {
                this.messages = [];
                return
            }
            if (this.withUndo) {
                this.undoStack.push(this.messages)
            }
            if (chartId != "") {
                var a = {
                    action: "command",
                    messages: this.messages,
                    name: userName
                };
                CLB.send(a)
            }
            this.messages = []
        }
    },
    send: function(b, a) {
        this.messages.push({
            action: b,
            content: a
        });
        this.submit()
    },
    receive: function(a) {
        this.doWithoutMessage(function() {
            MessageSource.executeMessages(a, true);
            Utils.showLinkerControls();
            Utils.showLinkerCursor()
        })
    },
    undo: function() {
        var a = this.undoStack.pop();
        if (a == null) {
            return
        }
        this.doWithoutUndo(function() {
            MessageSource.beginBatch();
            for (var d = 0; d < a.length; d++) {
                var g = a[d];
                if (g.action == "create") {
                    Utils.unselect();
                    Model.remove(g.content, false)
                } else {
                    if (g.action == "update") {
                        var b = g.content.shapes;
                        Model.updateMulti(b);
                        for (var c = 0; c < b.length; c++) {
                            var f = b[c];
                            Designer.painter.renderShape(f)
                        }
                        var e = Utils.getSelectedIds();
                        Utils.unselect();
                        Utils.selectShape(e, false)
                    } else {
                        if (g.action == "remove") {
                            var b = g.content;
                            Model.addMulti(b);
                            for (var c = 0; c < b.length; c++) {
                                var f = b[c];
                                Designer.painter.renderShape(f)
                            }
                        } else {
                            if (g.action == "updatePage") {
                                Model.updatePage(g.content.page)
                            } else {
                                if (g.action == "setTheme") {
                                    Model.setTheme(g.content.theme)
                                }
                            }
                        }
                    }
                }
            }
            MessageSource.commit()
        })
    },
    redo: function() {
        var a = this.redoStack.pop();
        if (a == null) {
            return
        }
        this.doWithoutUndo(function() {
            MessageSource.executeMessages(a, false)
        })
    },
    executeMessages: function(e, j) {
        MessageSource.beginBatch();
        for (var f = 0; f < e.length; f++) {
            var c = e[f];
            if (c.action == "create") {
                var b = c.content;
                if (j) {
                    for (var h = 0; h < b.length; h++) {
                        var g = b[h];
                        if (g.name != "linker") {
                            Schema.initShapeFunctions(g)
                        }
                    }
                }
                Model.addMulti(b);
                for (var h = 0; h < b.length; h++) {
                    var g = b[h];
                    Designer.painter.renderShape(g)
                }
                Model.build()
            } else {
                if (c.action == "update") {
                    var k = c.content.updates;
                    for (var h = 0; h < k.length; h++) {
                        var d = k[h];
                        if (j && d.name != "linker") {
                            Schema.initShapeFunctions(d)
                        }
                        Designer.painter.renderShape(d)
                    }
                    Model.updateMulti(k);
                    var a = Utils.getSelectedIds();
                    Utils.unselect();
                    Utils.selectShape(a)
                } else {
                    if (c.action == "remove") {
                        Utils.unselect();
                        Model.remove(c.content)
                    } else {
                        if (c.action == "updatePage") {
                            Model.updatePage(c.content.update)
                        } else {
                            if (c.action == "setTheme") {
                                Model.setTheme(c.content.update)
                            }
                        }
                    }
                }
            }
        }
        MessageSource.commit()
    },
    doWithoutUndo: function(a) {
        this.withUndo = false;
        a();
        this.withUndo = true
    },
    doWithoutMessage: function(a) {
        this.withMessage = false;
        a();
        this.withMessage = true
    },
    doWithoutUpdateDock: function(a) {
        this.withDock = false;
        a();
        this.withDock = true
    }
};
Number.prototype.toScale = function() {
    return this * Designer.config.scale
}
;
Number.prototype.restoreScale = function() {
    return this / Designer.config.scale
}
;
Date.prototype.format = function(b) {
    var c = {
        "M+": this.getMonth() + 1,
        "d+": this.getDate(),
        "h+": this.getHours(),
        "m+": this.getMinutes(),
        "s+": this.getSeconds(),
        "q+": Math.floor((this.getMonth() + 3) / 3),
        S: this.getMilliseconds()
    };
    if (/(y+)/.test(b)) {
        b = b.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length))
    }
    for (var a in c) {
        if (new RegExp("(" + a + ")").test(b)) {
            b = b.replace(RegExp.$1, RegExp.$1.length == 1 ? c[a] : ("00" + c[a]).substr(("" + c[a]).length))
        }
    }
    return b
}
;
