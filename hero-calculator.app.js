var HEROCALCULATOR = (function (my) {

    my.Tab = function (id, href, data, text, color, template) {
        var self = this;
        self.id = id;
        self.href = href;
        self.color = color;
        self.data = data;
        self.data.id = ko.observable(self.href);
        self.text = text;
        self.template = template;
        return self;
    }
    
    my.TabGroup = function (hero, unit, clone) {
        var self = this;
        self.hero = hero;
        self.unit = unit;
        self.clone = clone;
        self.illusions = ko.observableArray([]);
        return self;
    }
    
    my.HeroCalculatorViewModel = function () {
        var self = this;
        self.heroes = [
            new my.HeroCalculatorModel(1),
            new my.HeroCalculatorModel(0),
            new my.HeroCalculatorModel(0),
            new my.HeroCalculatorModel(1)
        ];

        for (var i = 0; i < 4; i++) {
            self.heroes[i].enemy = ko.observable(self.heroes[i < 2 ? 2 : 0]);
            self.heroes[i].unit = ko.observable(new my.UnitViewModel(0, self.heroes[i]));
            self.heroes[i].unit().enemy = ko.observable(self.heroes[i < 2 ? 2 : 0]);
            self.heroes[i].clone = ko.observable(new my.CloneViewModel(0, self.heroes[i]));
            self.heroes[i].heroCompare = ko.observable(self.heroes[1 - (i % 2) + (i < 2 ? 0 : 2)]);
            self.heroes[i].unit().selectedUnit(self.heroes[i].unit().availableUnits()[0]);
            self.heroes[i].selectedHero(self.heroes[i].availableHeroes()[i < 2 ? 0 : 2]);
            self.heroes[i].illusions.subscribe(function (changes) {
                for (var i = 0; i < changes.length; i++) {
                    if (changes[i].status == 'added') {
                        var color = this.index < 2 ? '#5cb85c' : '#d9534f',
                            j = _.uniqueId();
                        self.tabs()[this.index].illusions.push(
                            new my.Tab(
                                'illusionTab' + this.index + '-' + j,
                                'illusionPane' + this.index + '-' + j,
                                self.heroes[this.index].illusions()[self.tabs()[this.index].illusions().length](),
                                'Illusion ' + j,
                                color,
                                'illusion-pane-template')
                        );
                    }
                }
            }, {vm: this, index: i}, "arrayChange");
        }
        self.heroes[0].showUnitTab(true);
        self.tabs = ko.observableArray([]);
        var tabsArr = [];
        for (var i = 0; i < 4; i++) {
            var color = i < 2 ? '#5cb85c' : '#d9534f';
            var tabGroup = new my.TabGroup(
                new my.Tab('heroTab' + i, 'heroPane' + i, self.heroes[i], 'Hero ' + i, color, 'hero-pane-template'),
                new my.Tab('unitTab' + i, 'unitPane' + i, self.heroes[i].unit(), 'Unit ' + i, color, 'unit-pane-template'),
                new my.Tab('cloneTab' + i, 'clonePane' + i, self.heroes[i].clone(), 'Meepo Clone ' + i, color, 'clone-pane-template')
            );
            //self.tabs.push(tabGroup);
            tabsArr.push(tabGroup);
        }
        self.tabs.push.apply(self.tabs, tabsArr);

        self.selectedItem = ko.observable();
        self.layout = ko.observable("1");
        self.displayShop = ko.observable(true);
        self.displayShopItemTooltip = ko.observable(true);
        self.allItems = ko.observableArray([
            {name: 'Str, Agi, Int, MS, Turn, Sight', value: 'stats0'},
            {name: 'Armor, Health, Mana, Regen, EHP', value: 'stats1'},
            {name: 'Phys Res, Magic Res, Lifesteal, Evasion, Bash, Miss', value: 'stats2'},
            {name: 'Damage, IAS, BAT, Attack', value: 'stats3'}
        ]); // Initial items
        self.selectedItems = ko.observableArray([]); 
        self.moveUp = function () {
            var start = self.allItems.indexOf(self.selectedItems()[0]),
                end = self.allItems.indexOf(self.selectedItems()[self.selectedItems().length - 1]);
            if (start > 0) {
                var e = self.allItems.splice(start - 1, 1);
                self.allItems.splice(end, 0, e[0]);            
            }
        };
        self.moveDown = function () {
            var start = self.allItems.indexOf(self.selectedItems()[0]),
                end = self.allItems.indexOf(self.selectedItems()[self.selectedItems().length - 1]);        
            if (end < self.allItems().length - 1) {
                var e = self.allItems.splice(end + 1, 1);
                self.allItems.splice(start, 0, e[0]);
            }    
        };
		self.selectedTabId = ko.observable('heroTab0');
        self.selectedTab = ko.computed(function () {
            var indices = self.selectedTabId().replace('heroTab', '').replace('cloneTab', '').replace('unitTab', '').replace('illusionTab', '').split('-'),
                index = indices[0],
                tab = self.tabs()[index];
            if (self.selectedTabId().indexOf('hero') != -1) {
                return tab.hero;
            }
            else if (self.selectedTabId().indexOf('unit') != -1) {
                return tab.unit;
            }
            else if (self.selectedTabId().indexOf('clone') != -1) {
                return tab.clone;
            }
            else if (self.selectedTabId().indexOf('illusion') != -1) {
                return _.find(tab.illusions(), function (tab) {
                    return tab.id == self.selectedTabId();
                });
            }
            else {
                return self.tabs()[0].hero;
            }
		});
        self.selectedTabs = ko.observableArray(['heroTab0', 'heroTab1']);
		//self.selectedTabs.push('heroTab0');
		//self.selectedTabs.push('heroTab1');
        self.clickTab = function (data, event, index) {
            /*if (event.target.id != 'settingsTab') {
                self.selectedTabId(event.target.id);
            }*/
            self.selectedTabId(event.target.id);
			if (self.selectedTabs()[1] != event.target.id) {
				self.selectedTabs.shift();
				self.selectedTabs.push(event.target.id);
			}
        };
        self.isSecondTab = function (id) {
            return self.selectedTabs().indexOf(id) > -1 && self.selectedTabId() != id;
        }
        
		self.showSideTabId = function (id) {
			return self.selectedTabs().indexOf(id) > -1 && self.sideView();
		};
		
        self.removeTab = function (index, data, event, tab) {
            if (data.id == self.selectedTabId()) {
                //self.selectedTabId('heroTab0');
                self.clickTab(null, {target: {id: 'heroTab0'}});
                $('#heroTab0').tab('show');
            }
            self.tabs()[tab].illusions.remove(function (illusion) {
                return illusion == data;
            });
            self.heroes[tab].illusions.remove(function (illusion) {
                return illusion() == data.data;
            });
        };
        
        self.sideView = ko.observable(false);
        self.sideView.subscribe(function (newValue) {
            if (newValue) {
				if (!self.shopPopout()) {
					self.displayShop(false);
				}
                self.layout("0");
            }
        });
		var $window = $(window);
		self.windowWidth = ko.observable($window.width());
		self.windowHeight = ko.observable($window.height());
		$window.resize(function () { 
			self.windowWidth($window.width());
			self.windowHeight($window.height());
		});
        self.shopDock = ko.observable(false);
        self.shopDock.subscribe(function (newValue) {
            if (newValue) {

            }
            else {
            }
        });
    
		self.shopDockTrigger = ko.computed(function () {
			self.windowWidth();
			self.shopDock();
		});
        self.shopPopout = ko.observable(false);
        self.shopPopout.subscribe(function (newValue) {
            if (newValue) {
				self.displayShop(true);
                $( "#shop-dialog" ).dialog({
                    minWidth: 380,
                    minHeight: 0,
					closeText: "",
					open: function ( event, ui ) {
						$(event.target.offsetParent).find('.ui-dialog-titlebar').find('button')
							.addClass('close glyphicon glyphicon-remove shop-button btn btn-default btn-xs pull-right')
							.removeClass('ui-button ui-widget ui-state-default ui-corner-all ui-button-icon-only ui-dialog-titlebar-close close')
							.css('margin-right','0px')
							.parent()
								.append($('#shop-minimize'))
								.append($('#shop-maximize'));
						$(event.target.offsetParent).find('.ui-dialog-titlebar').dblclick(function () {
							self.displayShop(!self.displayShop());
						});
					},
                    close: function ( event, ui ) {
                        self.shopPopout(false);
                    }
				});
            }
            else {
				$('#shop-container').prepend($('#shop-minimize')).prepend($('#shop-maximize'));
                $( "#shop-dialog" ).dialog("destroy");
            }
        });

        
        self.changeSelectedItem = function (data, event) {
            self.itemInputValue(1);
            self.selectedItem(event.target.id);
        }
        
        self.getItemTooltipData = ko.computed(function () {
            return my.getItemTooltipData(self.selectedItem());
        }, this);
        self.getItemInputLabel = ko.computed(function () {
            if (my.stackableItems.indexOf(self.selectedItem()) != -1) {
                return 'Stack Size'
            }
            else if (my.levelitems.indexOf(self.selectedItem()) != -1) {
                return 'Upgrade Level'
            }
            else if (self.selectedItem() == 'bloodstone') {
                return 'Charges'
            }
            else {
                return ''
            }
        }, this);
        self.itemInputValue = ko.observable(1);
        self.saveLink = ko.observable();
        self.save = function () {
            var data = {
                version: "1.2.0",
                heroes: []
            }
            for (var i = 0; i < 4; i++) {
                var hero = self.heroes[i];
                d = {
                    hero: hero.selectedHero().heroName,
                    level: hero.selectedHeroLevel(),
                    items: [],
                    abilities: [],
                    skillPointHistory: hero.skillPointHistory(),
                    buffs: [],
                    itemBuffs: [],
                    debuffs: [],
                    itemDebuffs: [],
                    graphData: []
                }
                // items
                for (var j = 0; j < hero.inventory.items().length; j++) {
                    d.items.push(ko.toJS(hero.inventory.items()[j]));
                }
                // abilities
                for (var j = 0; j < hero.ability().abilities().length; j++) {
                    d.abilities.push({
                        level: hero.ability().abilities()[j].level(),
                        isActive: hero.ability().abilities()[j].isActive()
                    });
                }
                // buffs
                for (var j = 0; j < hero.buffs.buffs().length; j++) {
                    d.buffs.push({
                        name: hero.buffs.buffs()[j].name,
                        level: hero.buffs.buffs()[j].data.level(),
                        isActive: hero.buffs.buffs()[j].data.isActive()
                    });
                }
                
                // debuffs
                for (var j = 0; j < hero.debuffs.buffs().length; j++) {
                    d.debuffs.push({
                        name: hero.debuffs.buffs()[j].name,
                        level: hero.debuffs.buffs()[j].data.level(),
                        isActive: hero.debuffs.buffs()[j].data.isActive()
                    });
                }

                // item buffs
                for (var j = 0; j < hero.buffs.itemBuffs.items().length; j++) {
                    d.itemBuffs.push(ko.toJS(hero.buffs.itemBuffs.items()[j]));
                }
                
                // item debuffs
                for (var j = 0; j < hero.debuffs.itemBuffs.items().length; j++) {
                    d.itemDebuffs.push(ko.toJS(hero.debuffs.itemBuffs.items()[j]));
                }
                
                // graph data
                d.graphData = ko.toJS(hero.buildExplorer.graphData);
                
                data.heroes.push(d);
            }
            var serialized = JSON.stringify(data);
            $.ajax({
                type: "POST",
                url: "/dota2/apps/hero-calculator/save.php",
                data: {'data': serialized},
                dataType: "json",
                success: function (data){
                    self.saveLink("http://devilesk.com/dota2/apps/hero-calculator?id=" + data.file);
                },
                failure: function (errMsg) {
                    alert("Save request failed.");
                }
            });
        }
        self.load = function (data) {
            for (var i = 0; i < 4; i++) {
                var hero = self.heroes[i];
                hero.selectedHero(_.findWhere(hero.availableHeroes(), {'heroName': data.heroes[i].hero}));
                hero.selectedHeroLevel(data.heroes[i].level);
                hero.inventory.items.removeAll();
                hero.inventory.activeItems.removeAll();
                
                // load items
                for (var j = 0; j < data.heroes[i].items.length; j++) {
                    var item = data.heroes[i].items[j];
                    var new_item = {
                        item: item.item,
                        state: ko.observable(item.state),
                        size: item.size,
                        enabled: ko.observable(item.enabled)
                    }
                    hero.inventory.items.push(new_item);
                }

                // load abilities
                for (var j = 0; j < data.heroes[i].abilities.length; j++) {
                    hero.ability().abilities()[j].level(data.heroes[i].abilities[j].level);
                    hero.ability().abilities()[j].isActive(data.heroes[i].abilities[j].isActive);
                }
                hero.skillPointHistory(data.heroes[i].skillPointHistory);

                // load buffs
                for (var j = 0; j < data.heroes[i].buffs.length; j++) {
                    hero.buffs.selectedBuff(_.findWhere(hero.buffs.availableBuffs(), {buffName: data.heroes[i].buffs[j].name}));
                    hero.buffs.addBuff(hero, {});
                    var b = _.findWhere(hero.buffs.buffs(), { name: data.heroes[i].buffs[j].name });
                    b.data.level(data.heroes[i].buffs[j].level);
                    b.data.isActive(data.heroes[i].buffs[j].isActive);
                }

                // load debuffs
                for (var j = 0; j < data.heroes[i].debuffs.length; j++) {
                    hero.debuffs.selectedBuff(_.findWhere(hero.debuffs.availableDebuffs(), {buffName: data.heroes[i].debuffs[j].name}));
                    hero.debuffs.addBuff(hero, {});
                    var b = _.findWhere(hero.debuffs.buffs(), { name: data.heroes[i].debuffs[j].name });
                    b.data.level(data.heroes[i].debuffs[j].level);
                    b.data.isActive(data.heroes[i].debuffs[j].isActive);
                }

                // load item buffs
                if (data.heroes[i].itemBuffs) {
                    for (var j = 0; j < data.heroes[i].itemBuffs.length; j++) {
                        var item = data.heroes[i].itemBuffs[j];
                        var new_item = {
                            item: item.item,
                            state: ko.observable(item.state),
                            size: item.size,
                            enabled: ko.observable(item.enabled)
                        }
                        hero.buffs.itemBuffs.items.push(new_item);
                    }
                }

                // load item debuffs
                if (data.heroes[i].itemDebuffs) {
                    for (var j = 0; j < data.heroes[i].itemDebuffs.length; j++) {
                        var item = data.heroes[i].itemDebuffs[j];
                        var new_item = {
                            item: item.item,
                            state: ko.observable(item.state),
                            size: item.size,
                            enabled: ko.observable(item.enabled)
                        }
                        hero.debuffs.itemBuffs.items.push(new_item);
                    }
                }
                
                // load graph data
                if (data.heroes[i].graphData) {
                    hero.buildExplorer.loadGraphData(data.heroes[i].graphData);
                }
            }
        }
        
        self.sendReport = function () {
            if ($('#BugReportFormText').val()) {
                $.post( "report.php", { name: $('#BugReportFormName').val(), email: $('#BugReportFormEmail').val(), body: $('#BugReportFormText').val() })
                .done(function (data) {
                    if (data == 'Success') {
                        alert('Report successfully sent. Thanks!');
                        $('#BugReportFormText').val('');
                    }
                    else {
                        alert('Failed to send report. Try again later or email admin@devilesk.com');
                    }
                });
                $('#myModal').modal('hide');
            }
            else {
                alert('Message is required.');
            }
        }
        
        self.getProperty = function (obj, properties) {
            var result = obj;
            for (var i = 0; i < properties.length; i++) {
                result = result[properties[i]];
            }
            return result;
        };
        
        self.getDiffTextWrapper = function (hero, property) {
            return self.getDiffText(self.getDiffMagnitude(hero, property));
        }
        
        self.getDiffMagnitude = function (hero, property) {
            var properties = property.split('.');
            return self.getProperty(hero.damageTotalInfo(), properties).toFixed(2) - self.getProperty(hero.heroCompare().damageTotalInfo(), properties).toFixed(2);
        }
        
        self.getDiffText = function (value) {
            if (value > 0) {
                return '+' + parseFloat(value.toFixed(2));
            }
            else if (value < 0) {
                return '&minus;' + parseFloat(value.toFixed(2)*-1).toString();
            }
            else {
                return '';
            }
        }
        self.highlightedTabInternal = ko.observable('');
        self.highlightedTab = ko.computed(function () {
            return self.highlightedTabInternal();
        }).extend({ throttle: 100 });
        self.highlightTab = function (data) {
            self.highlightedTabInternal(data);
        }
        self.unhighlightTab = function (data) {
            self.highlightedTabInternal('');
        }
        self.showPopover = function (tab) {
            if ($(window).width() < 768) return null;
            if (self.sideView()) return null;
            var compareText = "<strong>Compare tab</strong><br>Delta values are calculated from the difference with this tab.",
                enemyText = "<strong>Enemy tab</strong><br>Stats from this tab are taken into account and affect calculations.";
            switch (tab) {
                case 0:
                    $('#popHero' + 2).popover('destroy').popover({content: enemyText, animation: false, html: true, placement: 'top'}).popover('show');
                    $('#popHero' + 1).popover('destroy').popover({content: compareText, animation: false, html: true}).popover('show');
                break;
                case 1:
                    $('#popHero' + 2).popover('destroy').popover({content: enemyText, animation: false, html: true, placement: 'top'}).popover('show');
                    $('#popHero' + 0).popover('destroy').popover({content: compareText, animation: false, html: true}).popover('show');
                break;
                case 2:
                    $('#popHero' + 0).popover('destroy').popover({content: enemyText, animation: false, html: true, placement: 'top'}).popover('show');
                    $('#popHero' + 3).popover('destroy').popover({content: compareText, animation: false, html: true}).popover('show');
                break;
                case 3:
                    $('#popHero' + 0).popover('destroy').popover({content: enemyText, animation: false, html: true, placement: 'top'}).popover('show');
                    $('#popHero' + 2).popover('destroy').popover({content: compareText, animation: false, html: true}).popover('show');
                break;
            }
        }
        self.hidePopover = function (tab) {
            switch (tab) {
                case 0:
                    $('#popHero' + 1).popover('hide');
                    $('#popHero' + 2).popover('hide');
                    $('#popHero' + 3).popover('hide');
                break;
                case 1:
                    $('#popHero' + 0).popover('hide');
                    $('#popHero' + 2).popover('hide');
                    $('#popHero' + 3).popover('hide');
                break;
                case 2:
                    $('#popHero' + 1).popover('hide');
                    $('#popHero' + 0).popover('hide');
                    $('#popHero' + 3).popover('hide');
                break;
                case 3:
                    $('#popHero' + 1).popover('hide');
                    $('#popHero' + 2).popover('hide');
                    $('#popHero' + 0).popover('hide');
                break;
            }
        }
    }

    my.heroCalculator = {};
	my.theme = ko.observable($('#theme-select').val());
	
    my.init = function (HERODATA_PATH,ITEMDATA_PATH,UNITDATA_PATH) {
        var loadedFiles = 0;
        var loadedFilesMax = 4;
        $.when(
            $.get('templates.html', function (templates) {
                $('body').append('<div style="display:none">' + templates + '<\/div>');
            }),
            $.getJSON(HERODATA_PATH, function (data) {
                my.heroData = data;
                my.heroData['npc_dota_hero_chen'].abilities[2].behavior.push('DOTA_ABILITY_BEHAVIOR_NOT_LEARNABLE');
                my.heroData['npc_dota_hero_nevermore'].abilities[1].behavior.push('DOTA_ABILITY_BEHAVIOR_NOT_LEARNABLE');
                my.heroData['npc_dota_hero_nevermore'].abilities[2].behavior.push('DOTA_ABILITY_BEHAVIOR_NOT_LEARNABLE');
                my.heroData['npc_dota_hero_morphling'].abilities[3].behavior.push('DOTA_ABILITY_BEHAVIOR_NOT_LEARNABLE');
                my.heroData['npc_dota_hero_ogre_magi'].abilities[3].behavior.push('DOTA_ABILITY_BEHAVIOR_NOT_LEARNABLE');
                my.heroData['npc_dota_hero_techies'].abilities[4].behavior.push('DOTA_ABILITY_BEHAVIOR_NOT_LEARNABLE');
                my.heroData['npc_dota_hero_beastmaster'].abilities[2].behavior.push('DOTA_ABILITY_BEHAVIOR_NOT_LEARNABLE');
                var index = my.heroData['npc_dota_hero_lone_druid'].abilities[3].behavior.indexOf('DOTA_ABILITY_BEHAVIOR_HIDDEN');
                my.heroData['npc_dota_hero_lone_druid'].abilities[3].behavior.splice(index, 1);
                
                index = my.heroData['npc_dota_hero_abaddon'].abilities[2].behavior.indexOf('DOTA_ABILITY_BEHAVIOR_PASSIVE');
                my.heroData['npc_dota_hero_abaddon'].abilities[2].behavior.splice(index, 1);
                
                index = my.heroData['npc_dota_hero_riki'].abilities[2].behavior.indexOf('DOTA_ABILITY_BEHAVIOR_PASSIVE');
                my.heroData['npc_dota_hero_riki'].abilities[2].behavior.splice(index, 1);
            }),
            $.getJSON(ITEMDATA_PATH, function (data) {
                my.itemData = data;
            }),
            $.getJSON(UNITDATA_PATH, function (data) {
                my.unitData = data;
            })
        ).done(function(a1, a2, a3, a4){
            my.run();
        });
    }
    
    my.run = function () {
        my.heroCalculator = new my.HeroCalculatorViewModel();
        ko.applyBindings(my.heroCalculator);
		$('#theme-select').change(function () {
			my.theme($(this).val());
		});
		$('#spinner').hide();
		$('#hero-calc-wrapper').css('display', 'inline-block');
        $('#popHero0').addClass('active');
        $('#heroPane0').addClass('active');
        $('#popHero0').popover({animation: false, html: true});
        $('#popHero1').popover({animation: false, html: true});
        $('#popHero4').popover({animation: false, html: true});
        $('#popHero5').popover({animation: false, html: true});
        $('[data-toggle="tooltip"]').tooltip();
        var saveId = getParameterByName('id');
        if (saveId) {
            $.get('save/' + saveId + '.json', function (data) {
                my.heroCalculator.load(data);
            });
        }
    }
    
    my.inventoryClipBoard = {
        items: [],
        activeItems: []
    };

    function getParameterByName(name) {
        name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
        var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
            results = regex.exec(location.search);
        return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
    }

    return my;
}(HEROCALCULATOR));