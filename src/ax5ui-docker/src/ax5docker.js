/*
 * Copyright (c) 2017. tom@axisj.com
 * - github.com/thomasjang
 * - www.axisj.com
 */

(function () {

    let UI = ax5.ui,
        U = ax5.util;

    UI.addClass({
        className: "docker",
        version: "${VERSION}"
    }, (function () {

        /**
         * @class ax5docker
         * @classdesc
         * @author tom@axisj.com
         * @example
         * ```
         * var ax5docker = new ax5.ui.ax5docker();
         * ```
         */
        let ax5docker = function () {
            let self = this,
                cfg;

            this.instanceId = ax5.getGuid();
            this.config = {
                theme: 'default',
                animateTime: 250,
                columnKeys: {}
            };
            // 패널 정보
            this.panels = [];
            this.panelId = 0;

            // 패널의 컨텐츠 모듈
            this.modules = {};

            cfg = this.config;

            const getPanelId = () => {
                return this.panelId++;
            };

            const defaultModuleInit = (container, state) => {
                container["$element"].html(state.name);
            };

            const getPanelPath = (parent, pIndex) => {
                let paths = [];
                if (parent && typeof parent.panelPath !== "undefined") {
                    paths.push(parent.panelPath);
                }

                paths.push(pIndex || 0);
                return paths.join(".");
            };

            const repaintPanels = () => {
                const buildPanel = (_pane) => {
                    let moduleState = jQuery.extend(_pane.moduleState, {
                            name: _pane.name
                        }),
                        moduleContainer = {
                            '$element': _pane.$item
                        };
                    if (_pane.moduleName in this.modules && 'init' in this.modules[_pane.moduleName]) {
                        this.modules[_pane.moduleName].init(moduleContainer, moduleState);
                    } else {
                        defaultModuleInit(moduleContainer, moduleState);
                    }
                };

                const appendProcessor = {
                    stack($parent, parent, myself, pIndex){

                        let $dom, activeIndex = -1;
                        myself.panelPath = getPanelPath(parent, pIndex);

                        $dom = jQuery('<div data-ax5docker-pane="" data-ax5docker-path="' + myself.panelPath + '">' +
                            '<ul data-ax5docker-pane-tabs=""></ul>' +
                            '<div data-ax5docker-pane-item-views=""></div>' +
                            '</div>');
                        $parent.append($dom);

                        if (U.isArray(myself.panels)) {
                            myself.panels.forEach(function (P, pIndex) {
                                if (myself.active) activeIndex = pIndex;
                            });
                            if (activeIndex === -1) activeIndex = 0;
                            myself.panels[activeIndex].active = true;

                            myself.panels.forEach(function (P, _pIndex) {
                                appendProcessor[P.type]($dom, myself, P, _pIndex);
                            });
                        }

                        $dom = null;
                        activeIndex = null;
                    },
                    panel($parent, parent, myself, pIndex){
                        let $dom;
                        myself.panelPath = getPanelPath(parent, pIndex);
                        myself.$label = jQuery('<li data-ax5docker-pane-tab="' + pIndex + '" data-ax5docker-path="' + myself.panelPath + '">' +
                            '<div class="title">' + myself.name + '</div>' +
                            '<div class="close-icon">' + cfg.icons.close + '</div>' +
                            '</li>');

                        if (!myself.$item) {
                            myself.$item = jQuery('<div data-ax5docker-pane-item="' + pIndex + '" data-ax5docker-pane-id="' + getPanelId() + '" data-ax5docker-path="' + myself.panelPath + '"></div>');
                        }

                        if (parent && parent.type == "stack") {
                            if (myself.active) {
                                buildPanel(myself);
                                myself.$label.addClass("active");
                                myself.$item.addClass("active");
                            }
                            $parent.find('[data-ax5docker-pane-tabs]').append(myself.$label);
                            $parent.find('[data-ax5docker-pane-item-views]').append(myself.$item);
                        } else {
                            $dom = jQuery('<div data-ax5docker-pane="" data-ax5docker-path="' + myself.panelPath + '">' +
                                '<ul data-ax5docker-pane-tabs=""></ul>' +
                                '<div data-ax5docker-pane-item-views=""></div>' +
                                '</div>');

                            buildPanel(myself);
                            myself.$label.addClass("active");
                            myself.$item.addClass("active");

                            $dom.find('[data-ax5docker-pane-tabs]').append(myself.$label);
                            $dom.find('[data-ax5docker-pane-item-views]').append(myself.$item);

                            $parent.append($dom);
                        }

                        $dom = null;
                    },
                    resizeHandel($parent, parent, myself){
                        let $dom = jQuery('<div data-ax5docker-resize-handle=""></div>');
                        $parent.append($dom);
                        $dom = null;
                    },
                    row($parent, parent, myself, pIndex){
                        let $dom;
                        myself.panelPath = getPanelPath(parent, pIndex);
                        if (parent && parent.type == "stack") {
                            throw "The 'stack' type child nodes are allowed only for the 'panel' type.";
                        }
                        $dom = jQuery('<div data-ax5docker-pane-axis="row" data-ax5docker-path="' + myself.panelPath + '"></div>');
                        $parent.append($dom);

                        if (U.isArray(myself.panels)) {
                            myself.panels.forEach(function (P, _pIndex) {
                                if (_pIndex > 0) appendProcessor["resizeHandel"]($dom, P, myself, _pIndex);
                                appendProcessor[P.type]($dom, myself, P, _pIndex);
                            });
                        }

                        $dom = null;
                    },
                    column($parent, parent, myself, pIndex){
                        let $dom;
                        myself.panelPath = getPanelPath(parent, pIndex);
                        if (parent && parent.type == "stack") {
                            throw "The 'stack' type child nodes are allowed only for the 'panel' type.";
                        }
                        $dom = jQuery('<div data-ax5docker-pane-axis="column" data-ax5docker-path="' + myself.panelPath + '"></div>');
                        $parent.append($dom);

                        if (U.isArray(myself.panels)) {
                            myself.panels.forEach(function (P, _pIndex) {
                                if (pIndex > 0) appendProcessor["resizeHandel"]($dom, P, myself, _pIndex);
                                appendProcessor[P.type]($dom, myself, P, _pIndex);
                            });
                        }

                        $dom = null;
                    }
                };

                let $root = jQuery('<div data-ax5docker-panes=""></div>');
                appendProcessor[this.panels[0].type]($root, null, this.panels[0], 0);
                this.$target.html($root);


                this.$target
                    .off("click")
                    .on("click", "[data-ax5docker-pane-tab] .close-icon", function (e) {
                        console.log("close icon");
                        U.stopEvent(e);
                    })
                    .on("click", "[data-ax5docker-pane-tab]", function (e) {
                        //console.log(e.originalEvent.target);
                        console.log("click pane-tab");

                        console.log($(this).parents('[data-ax5docker-pane]'));

                        U.stopEvent(e);
                    });
                $root = null;
            };


            /**
             * @method ax5docker.setConfig
             * @param {Object} config
             * @param {Array} config.panels
             */
            this.init = function (_config) {
                cfg = jQuery.extend(true, {}, cfg, _config);
                if (!cfg.target) {
                    console.log(ax5.info.getError("ax5docker", "401", "init"));
                    return this;
                }
                // memory target
                this.$target = jQuery(cfg.target);
                // set panels
                this.panels = cfg.panels || [];
                // event Functions
                this.onStateChanged = cfg.onStateChanged;
                this.onClick = cfg.onClick;
                this.onLoad = cfg.onLoad;
                this.onDataChanged = cfg.onDataChanged;
            };
            /**
             * @method ax5docker.setPanels
             * @returns {ax5docker}
             */
            this.setPanels = function (_panels) {
                // set panels
                this.panels = _panels || [];

                // 패널 다시 그리기
                repaintPanels();
                return this;
            };

            this.addModule = function (modules) {
                if (U.isObject(modules)) {
                    jQuery.extend(true, this.modules, modules);
                }
                return this;
            };

            this.repaint = function () {
                // 패널 다시 그리기
                repaintPanels();
            };

            // 클래스 생성자
            this.main = (function () {
                if (arguments && U.isObject(arguments[0])) {
                    this.setConfig(arguments[0]);
                }
            }).apply(this, arguments);

        };

        return ax5docker;
    })());

})();

// todo : active 된 패널만 표시하기 -- ok
// todo : row > stack 구현 -- ok
// todo : stack 패널 active change
// todo : resize
// todo : 패널 추가 / 삭제 / 재구성
// todo : 패널 drag & drop
