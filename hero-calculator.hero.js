var HEROCALCULATOR = (function (my) {

    my.IllusionOption = function (name, displayname, baseHero) {
        this.illusionName = name
        this.illusionDisplayName = displayname;
        this.baseHero = baseHero;
    };
    
    my.HeroOption = function(name, displayname) {
        this.heroName = name;
        this.heroDisplayName = displayname;
    };
    
    function createHeroOptions() {
        var options = [];
        for (h in my.heroData) {
            options.push(new my.HeroOption(h.replace('npc_dota_hero_',''), my.heroData[h].displayname))
        }
        return options;
    };
    
    function createIllusionOptions() {
        var options = [];
        for (h in my.illusionData) {
            options.push(new my.IllusionOption(h, my.illusionData[h].displayName, my.illusionData[h].hero))
        }
        return options;
    }
    
    my.HeroCalculatorModel = function(h) {
        var self = this;
        self.availableHeroes = ko.observableArray(createHeroOptions());
        self.sectionDisplay = ko.observable({
            inventory: ko.observable(true),
            ability: ko.observable(true),
            buff: ko.observable(true),
            debuff: ko.observable(true),
            damageamp: ko.observable(false),
            illusion: ko.observable(false)
        });
        self.sectionDisplayToggle = function(section) {
            self.sectionDisplay()[section](!self.sectionDisplay()[section]());
        }
        self.availableHeroes.sort(function(left, right) {
            return left.heroDisplayName == right.heroDisplayName ? 0 : (left.heroDisplayName < right.heroDisplayName ? -1 : 1);
        });
        self.selectedHero = ko.observable(self.availableHeroes()[h]);
        self.selectedHeroLevel = ko.observable(1);
        self.inventory = new my.InventoryViewModel();
        self.buffs = new my.BuffViewModel();
        self.buffs.hasScepter = self.inventory.hasScepter;
        self.debuffs = new my.BuffViewModel();
        self.damageAmplification = new my.DamageAmpViewModel();
        self.damageReduction = new my.DamageAmpViewModel();
        self.hero = ko.computed(function() {
            return ko.mapping.fromJS(my.heroData['npc_dota_hero_' + self.selectedHero().heroName]);
        });
        self.heroCompare = ko.observable(self);
        self.enemy = ko.observable(self);
        self.unit = ko.observable(self);
        self.clone = ko.observable(self);
        self.illusions = ko.observableArray([]);
        self.availableIllusions = ko.observableArray(createIllusionOptions());
        self.selectedIllusion = ko.observable(self.availableIllusions()[0]);
        self.illusionAbilityLevel = ko.observable(1);
        self.illusionAbilityMaxLevel = ko.computed(function() {
            return my.illusionData[self.selectedIllusion().illusionName].max_level;
        });
        self.showDiff = ko.observable(true);
        self.getAbilityLevelMax = function(data) {
            if (data.abilitytype() == 'DOTA_ABILITY_TYPE_ATTRIBUTES') {
                return 10;
            }
            else if (data.name() == 'invoker_quas' || data.name() == 'invoker_wex' || data.name() == 'invoker_exort') {
                return 7;
            }
            else if (data.name() == 'invoker_invoke') {
                return 4;
            }
            else if (data.name() == 'earth_spirit_stone_caller') {
                return 1;
            }
            else if (data.abilitytype() == 'DOTA_ABILITY_TYPE_ULTIMATE' || data.name() == 'keeper_of_the_light_recall' || data.name() == 'keeper_of_the_light_blinding_light' || data.name() == 'ember_spirit_activate_fire_remnant') {
                return 3;
            }
            else if (data.name() == 'puck_ethereal_jaunt'  || data.name() == 'shadow_demon_shadow_poison_release' || data.name() == 'templar_assassin_trap' || data.name() == 'spectre_reality') {
                return 0;
            }
            else if (data.name() == 'invoker_cold_snap'  || data.name() == 'invoker_ghost_walk' || data.name() == 'invoker_tornado' || data.name() == 'invoker_emp' || data.name() == 'invoker_alacrity'
                || data.name() == 'invoker_chaos_meteor' || data.name() == 'invoker_sun_strike' || data.name() == 'invoker_forge_spirit' || data.name() == 'invoker_ice_wall' || data.name() == 'invoker_deafening_blast') {
                return 0;
            }
            else {
                return 4;
            }
        };
        
        self.skillPointHistory = ko.observableArray();
        
        self.ability = ko.computed(function() {
            var a = new my.AbilityModel(ko.mapping.fromJS(my.heroData['npc_dota_hero_' + self.selectedHero().heroName].abilities), self);
            if (self.selectedHero().heroName == 'earth_spirit') {
                a.abilities()[3].level(1);
            }
            if (self.selectedHero().heroName == 'invoker') {
                for (var i=6;i<16;i++) {
                    a.abilities()[i].level(1);
                }
            }
            self.skillPointHistory.removeAll();
            a.hasScepter = self.inventory.hasScepter
            return a;
        });
        self.showCriticalStrikeDetails = ko.observable(false);
        self.toggleCriticalStrikeDetails = function() {
            self.showCriticalStrikeDetails(!self.showCriticalStrikeDetails());
        };
        self.damageInputValue = ko.observable(0);
        self.showDamageDetails = ko.observable(false);
        self.toggleDamageDetails = function() {
            self.showDamageDetails(!self.showDamageDetails());
        };
        self.showStatDetails = ko.observable(false);
        self.toggleStatDetails = function() {
            self.showStatDetails(!self.showStatDetails());
        };
        
        self.availableSkillPoints = ko.computed(function() {
            var c = self.selectedHeroLevel();
            for (var i=0;i < self.ability().abilities().length;i++) {
                var getIndex = function() {
                    return i;
                };
                switch(self.ability().abilities()[i].abilitytype()) {
                    case 'DOTA_ABILITY_TYPE_ULTIMATE':
                        if (self.selectedHero().heroName == 'invoker') {
                            while (
                                ((self.ability().abilities()[i].level() == 1) && (parseInt(self.selectedHeroLevel()) < 2)) ||
                                ((self.ability().abilities()[i].level() == 2) && (parseInt(self.selectedHeroLevel()) < 7)) ||
                                ((self.ability().abilities()[i].level() == 3) && (parseInt(self.selectedHeroLevel()) < 11)) ||
                                ((self.ability().abilities()[i].level() == 4) && (parseInt(self.selectedHeroLevel()) < 17))
                            ) {
                                self.ability().levelDownAbility(getIndex, null, null, self);
                            }
                        }
                        else if (self.selectedHero().heroName == 'meepo') {
                            while ((self.ability().abilities()[i].level()-1) * 7 + 3 > parseInt(self.selectedHeroLevel())) {
                                self.ability().levelDownAbility(getIndex, null, null, self);
                            }
                        }
                        else {
                            while (self.ability().abilities()[i].level() * 5 + 1 > parseInt(self.selectedHeroLevel())) {
                                self.ability().levelDownAbility(getIndex, null, null, self);
                            }
                        }
                    break;
                    default:
                        while (self.ability().abilities()[i].level() * 2 - 1 > parseInt(self.selectedHeroLevel())) {
                            self.ability().levelDownAbility(getIndex, null, null, self);
                        }
                    break;
                }
            }
            var getIndex = function() {
                return self.skillPointHistory()[self.skillPointHistory().length-1];
            };
            while (self.skillPointHistory().length > c) {
                self.ability().levelDownAbility(getIndex, null, null, self);
            }
            return c-self.skillPointHistory().length;
        }, this);
        /*self.availableSkillPoints = ko.computed(function() {
            var c = self.selectedHeroLevel();
            for (var i=0;i < self.ability().abilities().length;i++) {
                switch(self.ability().abilities()[i].abilitytype()) {
                    case 'DOTA_ABILITY_TYPE_ULTIMATE':
                        if ((self.ability().abilities()[i].level()+1) * 5 + 1 > parseInt(self.selectedHeroLevel())) {
                            self.ability().abilities()[i].level(Math.floor((parseInt(self.selectedHeroLevel()) - 1) / 5));
                        }
                    break;
                    default:
                        if (self.ability().abilities()[i].level() * 2 + 1 > parseInt(self.selectedHeroLevel())) {
                                self.ability().abilities()[i].level(Math.floor((parseInt(self.selectedHeroLevel()) + 1) / 2));
                        }
                    break;
                }
                switch(self.ability().abilities()[i].name()) {
                    case 'beastmaster_call_of_the_wild_boar':
                    case 'chen_test_of_faith_teleport':
                    case 'keeper_of_the_light_recall':
                    case 'keeper_of_the_light_blinding_light':
                    case 'keeper_of_the_light_illuminate_end':
                    case 'keeper_of_the_light_spirit_form_illuminate':
                    case 'morphling_morph_str':
                    case 'shadow_demon_shadow_poison_release':
                    case 'nevermore_shadowraze2':
                    case 'nevermore_shadowraze3':
                    case 'earth_spirit_stone_caller':
                    case 'ember_spirit_activate_fire_remnant':
                    case 'invoker_cold_snap' :
                    case 'invoker_ghost_walk':
                    case 'invoker_tornado':
                    case 'invoker_emp':
                    case 'invoker_alacrity':
                    case 'invoker_chaos_meteor':
                    case 'invoker_sun_strike':
                    case 'invoker_forge_spirit':
                    case 'invoker_ice_wall':
                    case 'invoker_deafening_blast':
                    break;
                    default:
                        c -= self.ability().abilities()[i].level();
                    break;
                }
            }
            if (c < 0) {
                for (var i=0;i < self.ability().abilities().length;i++) {
                    self.ability().abilities()[i].level(0);
                }
                c = self.selectedHeroLevel();
            }
            return c;
        }, this);*/
        self.primaryAttribute = ko.computed(function() {
            var v = my.heroData['npc_dota_hero_' + self.selectedHero().heroName].attributeprimary;
            if (v == 'DOTA_ATTRIBUTE_AGILITY') {
                return 'agi'
            }
            else if (v == 'DOTA_ATTRIBUTE_INTELLECT') {
                return 'int'
            }
            else if (v == 'DOTA_ATTRIBUTE_STRENGTH') {
                return 'str'
            }
            else {
                return ''
            }
        });
        self.totalAttribute = function(a) {
            if (a == 'agi') {
                return parseFloat(self.totalAgi());
            }
            if (a == 'int') {
                return parseFloat(self.totalInt());
            }
            if (a == 'str') {
                return parseFloat(self.totalStr());
            }
        };
        self.totalAgi = ko.computed(function() {
            return (my.heroData['npc_dota_hero_' + self.selectedHero().heroName].attributebaseagility
                    + my.heroData['npc_dota_hero_' + self.selectedHero().heroName].attributeagilitygain * (self.selectedHeroLevel() - 1) 
                    + self.inventory.getAttributes('agi') 
                    + self.ability().getAttributeBonusLevel()*2
                    + self.ability().getAgility()
                    + self.enemy().ability().getAllStatsReduction()
                    + self.debuffs.getAllStatsReduction()
                   ).toFixed(2);
        });
        self.intStolen = ko.observable(0).extend({ numeric: 0 });
        self.totalInt = ko.computed(function() {
            return (my.heroData['npc_dota_hero_' + self.selectedHero().heroName].attributebaseintelligence 
                    + my.heroData['npc_dota_hero_' + self.selectedHero().heroName].attributeintelligencegain * (self.selectedHeroLevel() - 1) 
                    + self.inventory.getAttributes('int') 
                    + self.ability().getAttributeBonusLevel()*2
                    + self.ability().getIntelligence()
                    + self.enemy().ability().getAllStatsReduction()
                    + self.debuffs.getAllStatsReduction() + self.intStolen()
                   ).toFixed(2);
        });
        self.totalStr = ko.computed(function() {
            return (my.heroData['npc_dota_hero_' + self.selectedHero().heroName].attributebasestrength 
                    + my.heroData['npc_dota_hero_' + self.selectedHero().heroName].attributestrengthgain * (self.selectedHeroLevel() - 1) 
                    + self.inventory.getAttributes('str') 
                    + self.ability().getAttributeBonusLevel()*2
                    + self.ability().getStrength()
                    + self.enemy().ability().getAllStatsReduction()
                    + self.debuffs.getAllStatsReduction()
                   ).toFixed(2);
        });
        self.health = ko.computed(function() {
            return (my.heroData['npc_dota_hero_' + self.selectedHero().heroName].statushealth + Math.floor(self.totalStr())*19 
                    + self.inventory.getHealth()
                    + self.ability().getHealth()).toFixed(2);
        });
        self.healthregen = ko.computed(function() {
            return (my.heroData['npc_dota_hero_' + self.selectedHero().heroName].statushealthregen + self.totalStr()*.03 
                    + self.inventory.getHealthRegen() 
                    + self.ability().getHealthRegen()
                    + self.buffs.getHealthRegen()).toFixed(2);
        });
        self.mana = ko.computed(function() {
            return (my.heroData['npc_dota_hero_' + self.selectedHero().heroName].statusmana + self.totalInt()*13 + self.inventory.getMana()).toFixed(2);
        });
        self.manaregen = ko.computed(function() {
            return ((my.heroData['npc_dota_hero_' + self.selectedHero().heroName].statusmanaregen 
                    + self.totalInt()*.04 
                    + self.ability().getManaRegen()) 
                    * (1 + self.inventory.getManaRegenPercent()) 
                    + (self.selectedHero().heroName == 'crystal_maiden' ? self.ability().getManaRegenArcaneAura() * 2 : self.buffs.getManaRegenArcaneAura())
                    + self.inventory.getManaRegenBloodstone()
                    - self.enemy().ability().getManaRegenReduction()).toFixed(2);
        });
        self.totalArmorPhysical = ko.computed(function() {
            return (self.enemy().ability().getArmorBaseReduction() * self.debuffs.getArmorBaseReduction() * (my.heroData['npc_dota_hero_' + self.selectedHero().heroName].armorphysical + self.totalAgi()*.14)
                    + self.inventory.getArmor() + self.enemy().inventory.getArmorReduction() + self.ability().getArmor() + self.enemy().ability().getArmorReduction() + self.buffs.getArmor() + self.debuffs.getArmorReduction()).toFixed(2);
        });
        self.totalArmorPhysicalReduction = ko.observable();
        self.totalMovementSpeed = ko.computed(function() {
            var ms = (self.ability().setMovementSpeed() > 0 ? self.ability().setMovementSpeed() : self.buffs.setMovementSpeed());
            if (ms > 0) {
                return ms;
            }
            else {
                return ((my.heroData['npc_dota_hero_' + self.selectedHero().heroName].movementspeed + self.inventory.getMovementSpeedFlat()+ self.ability().getMovementSpeedFlat()) * 
                        (1 + self.inventory.getMovementSpeedPercent() 
                           + self.ability().getMovementSpeedPercent() 
                           + self.enemy().inventory.getMovementSpeedPercentReduction() 
                           + self.enemy().ability().getMovementSpeedPercentReduction() 
                           + self.buffs.getMovementSpeedPercent() 
                           + self.debuffs.getMovementSpeedPercentReduction()
                           + self.unit().ability().getMovementSpeedPercent() 
                        )).toFixed(2);
            }
        });
        self.totalTurnRate = ko.computed(function() {
            return (my.heroData['npc_dota_hero_' + self.selectedHero().heroName].movementturnrate 
                    * (1 + self.enemy().ability().getTurnRateReduction()
                         + self.debuffs.getTurnRateReduction())).toFixed(2);
        });
        self.baseDamage = ko.computed(function() {
            var totalAttribute = self.totalAttribute(self.primaryAttribute()),
                abilityBaseDamage = self.ability().getBaseDamage();
            return [Math.floor((my.heroData['npc_dota_hero_' + self.selectedHero().heroName].attackdamagemin + totalAttribute + abilityBaseDamage.total) * abilityBaseDamage.multiplier),
                    Math.floor((my.heroData['npc_dota_hero_' + self.selectedHero().heroName].attackdamagemax + totalAttribute + abilityBaseDamage.total) * abilityBaseDamage.multiplier)];
        });
        self.bonusDamage = ko.computed(function() {
            return self.inventory.getBonusDamage().total
                    + self.ability().getBonusDamage().total
                    + self.buffs.getBonusDamage().total
                    + Math.floor((self.baseDamage()[0] + self.baseDamage()[1])/2 
                                  * (self.inventory.getBonusDamagePercent().total
                                     + self.ability().getBonusDamagePercent().total
                                     + self.buffs.getBonusDamagePercent().total
                                    )
                                )
                    + Math.floor(
                        (self.hero().attacktype() == 'DOTA_UNIT_CAP_RANGED_ATTACK' 
                            ? ((self.selectedHero().heroName == 'drow_ranger') ? self.ability().getBonusDamagePrecisionAura().total[0] * self.totalAgi() : self.buffs.getBonusDamagePrecisionAura().total[1])
                            : 0)
                      );
        });
        self.bonusDamageReduction = ko.computed(function() {
            return Math.abs(self.enemy().ability().getBonusDamageReduction() + self.debuffs.getBonusDamageReduction());
        });
        self.damage = ko.computed(function() {
            return [self.baseDamage()[0] + self.bonusDamage()[0],
                    self.baseDamage()[1] + self.bonusDamage()[1]];
        });
        self.damageAgainstEnemy = ko.observable();
        self.totalMagicResistanceProduct = ko.computed(function() {
            return (1 - my.heroData['npc_dota_hero_' + self.selectedHero().heroName].magicalresistance / 100) 
                       * (1 - self.inventory.getMagicResist() / 100) 
                       * (1 - self.ability().getMagicResist() / 100) 
                       * (1 - self.buffs.getMagicResist() / 100) 
                       * self.enemy().inventory.getMagicResistReduction()
                       * self.enemy().ability().getMagicResistReduction() 
                       * self.debuffs.getMagicResistReduction();
        });
        self.totalMagicResistance = ko.computed(function() {
            return (1 - self.totalMagicResistanceProduct()).toFixed(2);
        });
        self.bat = ko.computed(function() {
            var abilityBAT = self.ability().getBAT();
            if (abilityBAT > 0) {
                return abilityBAT;
            }
            return my.heroData['npc_dota_hero_' + self.selectedHero().heroName].attackrate;
        });
        self.ias = ko.computed(function() {
            var val = parseFloat(self.totalAgi()) 
                    + self.inventory.getAttackSpeed() 
                    + self.enemy().inventory.getAttackSpeedReduction() 
                    + self.ability().getAttackSpeed() 
                    + self.enemy().ability().getAttackSpeedReduction() 
                    + self.buffs.getAttackSpeed() 
                    + self.debuffs.getAttackSpeedReduction()
                    + self.unit().ability().getAttackSpeed(); 
            if (val < -80) {
                return -80;
            }
            else if (val > 400) {
                return 400;
            }
            return (val).toFixed(2);
        });
        self.attackTime = ko.computed(function() {
            return (self.bat() / (1 + self.ias() / 100)).toFixed(2);
        });
        self.attacksPerSecond = ko.computed(function() {
            return ((1 + self.ias() / 100) / self.bat()).toFixed(2);
        });
        self.evasion = ko.computed(function() {
            var e = self.ability().setEvasion();
            if (e) {
                return (e * 100).toFixed(2);
            }
            else {
                return ((1-(self.inventory.getEvasion() * self.ability().getEvasion())) * 100).toFixed(2);
            }
        });
        self.ehpPhysical = ko.computed(function() {
            var ehp = (self.health() * (1 + .06 * self.totalArmorPhysical())) / (1-(1-(self.inventory.getEvasion() * self.ability().getEvasion())))
            ehp *= (_.some(self.inventory.activeItems(), function(item) {return item.item == 'mask_of_madness';}) ? (1/1.3) : 1);
            return ehp.toFixed(2);
        });
        self.ehpMagical = ko.computed(function() {
            var ehp = self.health() / self.totalMagicResistanceProduct();
            ehp *= (_.some(self.inventory.activeItems(), function(item) {return item.item == 'mask_of_madness';}) ? (1/1.3) : 1);
            return ehp.toFixed(2);
        });
        self.bash = ko.computed(function() {
            var attacktype = my.heroData['npc_dota_hero_' + self.selectedHero().heroName].attacktype;
            return ((1-(self.inventory.getBash(attacktype) * self.ability().getBash())) * 100).toFixed(2);
        });

        self.cleaveInfo = ko.computed(function() {
            var cleaveSources = self.inventory.getCleaveSource();
            $.extend(cleaveSources, self.ability().getCleaveSource());
            $.extend(cleaveSources, self.buffs.getCleaveSource());
            var cleaveSourcesArray = [];
            for (prop in cleaveSources) {
                var el = cleaveSources[prop];
                el.name = prop
                cleaveSourcesArray.push(el);
            }
            function compareByRadius(a,b) {
                if (a.radius < b.radius)
                    return 1;
                if (a.radius > b.radius)
                    return -1;
                return 0;
            }

            cleaveSourcesArray.sort(compareByRadius);
            var cleaveSourcesByRadius = {};
            for (var i=0;i<cleaveSourcesArray.length;i++) {
                var total = 0;
                for (var j=0;j<cleaveSourcesArray.length;j++) {
                    if (cleaveSourcesArray[j].radius >= cleaveSourcesArray[i].radius) {
                        total += cleaveSourcesArray[j].magnitude * cleaveSourcesArray[j].count;
                    }
                }
                cleaveSourcesByRadius[cleaveSourcesArray[i].radius] = total;
            }
            var result = [];
            for (prop in cleaveSourcesByRadius) {
                result.push({
                    'radius':prop,
                    'magnitude':cleaveSourcesByRadius[prop]
                });
            }
            return result;
        });
        
        self.critChance = ko.computed(function() {
            return ((1-(self.inventory.getCritChance() * self.ability().getCritChance())) * 100).toFixed(2);
        });

        self.critInfo = ko.computed(function() {
            var critSources = self.inventory.getCritSource();
            $.extend(critSources, self.ability().getCritSource());
            $.extend(critSources, self.buffs.getCritSource());
            var critSourcesArray = [];
            for (prop in critSources) {
                var el = critSources[prop];
                el.name = prop
                critSourcesArray.push(el);
            }
            function compareByMultiplier(a,b) {
                if (a.multiplier < b.multiplier)
                    return 1;
                if (a.multiplier > b.multiplier)
                    return -1;
                return 0;
            }

            critSourcesArray.sort(compareByMultiplier);
            
            var result = [];
            var critTotal = 0;
            for (var i=0;i<critSourcesArray.length;i++) {
                var total = 1;
                for (var j=0;j<i;j++) {
                    for (var k=0;k<critSourcesArray[j].count;k++) {
                        total *= (1-critSourcesArray[j].chance);
                    }
                }
                var total2 = 1;
                for (var k=0;k<critSourcesArray[i].count;k++) {
                    total2 *= (1-critSourcesArray[i].chance);
                }
                total *= (1-total2);
                critTotal += total;
                if (critSourcesArray[i].count > 1) {
                    result.push({
                        'name':critSourcesArray[i].displayname + ' x' + critSourcesArray[i].count,
                        'chance':critSourcesArray[i].chance,
                        'multiplier':critSourcesArray[i].multiplier,
                        'count':critSourcesArray[i].count,
                        'totalchance':total
                    });
                }
                else {
                    result.push({
                        'name':critSourcesArray[i].displayname,
                        'chance':critSourcesArray[i].chance,
                        'multiplier':critSourcesArray[i].multiplier,
                        'count':critSourcesArray[i].count,
                        'totalchance':total
                    });
                }
            }
            return { sources: result, total: critTotal };
        });
        
        self.bashInfo = ko.computed(function() {
            var attacktype = my.heroData['npc_dota_hero_' + self.selectedHero().heroName].attacktype;
            var bashSources = self.inventory.getBashSource(attacktype);
            $.extend(bashSources, self.ability().getBashSource());
            var bashSourcesArray = [];
            for (prop in bashSources) {
                var el = bashSources[prop];
                el.name = prop
                bashSourcesArray.push(el);
            }
            function compareByDuration(a,b) {
                if (a.duration < b.duration)
                    return 1;
                if (a.duration > b.duration)
                    return -1;
                return 0;
            }

            //bashSourcesArray.sort(compareByDuration);
            
            var result = [];
            var bashTotal = 0;
            for (var i=0;i<bashSourcesArray.length;i++) {
                var total = 1;
                for (var j=0;j<i;j++) {
                    for (var k=0;k<bashSourcesArray[j].count;k++) {
                        total *= (1-bashSourcesArray[j].chance);
                    }
                }
                var total2 = 1;
                for (var k=0;k<bashSourcesArray[i].count;k++) {
                    total2 *= (1-bashSourcesArray[i].chance);
                }
                total *= (1-total2);
                bashTotal += total;
                if (bashSourcesArray[i].name == 'spirit_breaker_greater_bash') {
                    var d = bashSourcesArray[i].damage * self.totalMovementSpeed();
                }
                else {
                    var d = bashSourcesArray[i].damage;
                }
                if (bashSourcesArray[i].count > 1) {
                    result.push({
                        'name':bashSourcesArray[i].displayname + ' x' + bashSourcesArray[i].count,
                        'chance':bashSourcesArray[i].chance,
                        'damage':d,
                        'count':bashSourcesArray[i].count,
                        'damageType':bashSourcesArray[i].damageType,
                        'totalchance':total
                    });
                }
                else {
                    result.push({
                        'name':bashSourcesArray[i].displayname,
                        'chance':bashSourcesArray[i].chance,
                        'damage':d,
                        'count':bashSourcesArray[i].count,
                        'damageType':bashSourcesArray[i].damageType,
                        'totalchance':total
                    });
                }

            }
            return { sources: result, total: bashTotal };
        });
        
        self.orbProcInfo = ko.computed(function() {
            var attacktype = my.heroData['npc_dota_hero_' + self.selectedHero().heroName].attacktype;
            var damageSources = self.inventory.getOrbProcSource();
            //$.extend(damageSources, self.ability().getProcSource());
            var damageSourcesArray = [];
            for (prop in damageSources) {
                var el = damageSources[prop];
                el.name = prop
                damageSourcesArray.push(el);
            }
            function compareByDamage(a,b) {
                if (a.priority > b.priority) {
                    return 1;
                }
                if (a.priority < b.priority) {
                    return -1;
                }
                if (a.damage < b.damage)
                    return 1;
                if (a.damage > b.damage)
                    return -1;
                return 0;
            }

            damageSourcesArray.sort(compareByDamage);
            
            var result = [];
            var damageTotal = 0;
            for (var i=0;i<damageSourcesArray.length;i++) {
                var total = 1;
                for (var j=0;j<i;j++) {
                    for (var k=0;k<damageSourcesArray[j].count;k++) {
                        total *= (1-damageSourcesArray[j].chance);
                    }
                }
                var total2 = 1;
                for (var k=0;k<damageSourcesArray[i].count;k++) {
                    total2 *= (1-damageSourcesArray[i].chance);
                }
                total *= (1-total2);
                damageTotal += total;
                if (damageSourcesArray[i].count > 1) {
                    result.push({
                        'name':damageSourcesArray[i].displayname + ' x' + damageSourcesArray[i].count,
                        'chance':damageSourcesArray[i].chance,
                        'damage':damageSourcesArray[i].damage,
                        'count':damageSourcesArray[i].count,
                        'damageType':damageSourcesArray[i].damageType,
                        'totalchance':total
                    });
                }
                else {
                    result.push({
                        'name':damageSourcesArray[i].displayname,
                        'chance':damageSourcesArray[i].chance,
                        'damage':damageSourcesArray[i].damage,
                        'count':damageSourcesArray[i].count,
                        'damageType':damageSourcesArray[i].damageType,
                        'totalchance':total
                    });
                }
            }
            return { sources: result, total: damageTotal };
        });

        self.getReducedDamage = function(value, type) {
            switch(type) {
                case 'physical':
                    if (self.enemy().totalArmorPhysical() >= 0) {
                        return value * (1 - (0.06 * self.enemy().totalArmorPhysical()) / (1 + 0.06 * self.enemy().totalArmorPhysical()));
                    }
                    else {
                        return value * (1 + (1 - Math.pow(0.94,-self.enemy().totalArmorPhysical())));
                    }
                break;
                case 'magic':
                    return value * (1 - self.enemy().totalMagicResistance());
                break;
                case 'pure':
                    return value;
                break;
            }
        }
            
        self.damageTotalInfo = ko.computed(function() {
            var bonusDamageArray = [
                self.ability().getBonusDamage().sources,
                self.buffs.getBonusDamage().sources
            ],
            bonusDamagePctArray = [
                self.ability().getBonusDamagePercent().sources,
                self.buffs.getBonusDamagePercent().sources
            ],
            itemBonusDamage = self.inventory.getBonusDamage().sources,
            itemBonusDamagePct = self.inventory.getBonusDamagePercent().sources,
            critSources = self.critInfo(),
            abilityOrbSources = self.ability().getOrbSource(),
            itemOrbSources = self.inventory.getOrbSource(),
            itemProcOrbSources = self.orbProcInfo(),
            bashSources = self.bashInfo(),
            
            baseDamage = (self.baseDamage()[0] + self.baseDamage()[1])/2,
            totalDamage = baseDamage,
            totalCritableDamage = baseDamage,
            totalCrit = 0,
            damage = {
                pure: 0,
                physical: baseDamage,
                magic: 0
            },
            result = [],
            crits = [];

            // bonus damage from items
            for (i in itemBonusDamage) {
                var d = itemBonusDamage[i].damage*itemBonusDamage[i].count;
                result.push({
                    name: itemBonusDamage[i].displayname + (itemBonusDamage[i].count > 1 ? ' x' + itemBonusDamage[i].count : ''),
                    damage: d,
                    damageType: itemBonusDamage[i].damageType,
                    damageReduced: self.getReducedDamage(d, itemBonusDamage[i].damageType)
                });
                totalDamage += d;
                totalCritableDamage += d;
                damage[itemBonusDamage[i].damageType] += d;
            }

            // bonus damage percent from items
            for (i in itemBonusDamagePct) {
                var d = baseDamage * itemBonusDamagePct[i].damage;
                result.push({
                    name: itemBonusDamagePct[i].displayname,
                    damage: d,
                    damageType: itemBonusDamagePct[i].damageType,
                    damageReduced: self.getReducedDamage(d, itemBonusDamagePct[i].damageType)
                });
                totalDamage += d;
                totalCritableDamage += d;
                damage[itemBonusDamagePct[i].damageType] += d;
            }
            
            // bonus damage from abilities and buffs
            for (var i=0;i<bonusDamageArray.length;i++) {
                for (j in bonusDamageArray[i]) {
                    var d = bonusDamageArray[i][j].damage;
                    result.push({
                        name: bonusDamageArray[i][j].displayname,
                        damage: d,
                        damageType: bonusDamageArray[i][j].damageType,
                        damageReduced: self.getReducedDamage(d, bonusDamageArray[i][j].damageType)
                    });
                    totalDamage += d;
                    totalCritableDamage += d;
                    damage[bonusDamageArray[i][j].damageType] += d;
                }
            }
            
            // bonus damage percent from abilities and buffs
            for (var i=0;i<bonusDamagePctArray.length;i++) {
                for (j in bonusDamagePctArray[i]) {
                    var d = baseDamage * bonusDamagePctArray[i][j].damage;
                    result.push({
                        name: bonusDamagePctArray[i][j].displayname,
                        damage: d,
                        damageType: bonusDamagePctArray[i][j].damageType,
                        damageReduced: self.getReducedDamage(d, bonusDamagePctArray[i][j].damageType)
                    });
                    totalDamage += d;
                    totalCritableDamage += d;
                    damage[bonusDamagePctArray[i][j].damageType] += d;
                }
            }
            // drow_ranger_trueshot
            if (self.hero().attacktype() == 'DOTA_UNIT_CAP_RANGED_ATTACK') {
                if (self.selectedHero().heroName == 'drow_ranger') {
                    var s = self.ability().getBonusDamagePrecisionAura().sources;
                    var index = 0;
                }
                else {
                    var s = self.buffs.getBonusDamagePrecisionAura().sources;
                    var index = 1;
                }
                if (s[index] != undefined) {
                    if (self.selectedHero().heroName == 'drow_ranger') {
                        var d = s[index].damage * self.totalAgi();
                    }
                    else {
                        var d = s[index].damage;
                    }
                    result.push({
                        name: s[index].displayname,
                        damage: d,
                        damageType: 'physical',
                        damageReduced: self.getReducedDamage(d, 'physical')
                    });
                    totalDamage += d;
                    totalCritableDamage += d;
                    damage.physical += d;                    
                }
        
            }
            
            // bash damage
            for (var i=0;i<bashSources.sources.length;i++) {
                var d = bashSources.sources[i].damage * bashSources.sources[i].chance * bashSources.sources[i].count;
                result.push({
                    name: bashSources.sources[i].name,
                    damage: d,
                    damageType: bashSources.sources[i].damageType,
                    damageReduced: self.getReducedDamage(d, bashSources.sources[i].damageType)
                });
                totalDamage += d;
                damage[bashSources.sources[i].damageType] += d;
            }
            
            // %-based orbs
            for (var i=0;i<itemProcOrbSources.sources.length;i++) {
                var d = itemProcOrbSources.sources[i].damage * (1-Math.pow(1-itemProcOrbSources.sources[i].chance,itemProcOrbSources.sources[i].count));
                result.push({
                    name: itemProcOrbSources.sources[i].name,
                    damage: d,
                    damageType: itemProcOrbSources.sources[i].damageType,
                    damageReduced: self.getReducedDamage(d, itemProcOrbSources.sources[i].damageType)
                });
                totalDamage += d;
                damage[itemProcOrbSources.sources[i].damageType] += d;
            }
            
            // ability orbs
            for (orb in abilityOrbSources) {
                var d = abilityOrbSources[orb].damage * (1-itemProcOrbSources.total);
                result.push({
                    name: abilityOrbSources[orb].displayname,
                    damage: d,
                    damageType: abilityOrbSources[orb].damageType,
                    damageReduced: self.getReducedDamage(d, abilityOrbSources[orb].damageType)
                });
                totalDamage += d;
                damage[abilityOrbSources[orb].damageType] += d;
            }
            
            // item orbs
            if (_.size(abilityOrbSources) == 0) {
                for (orb in itemOrbSources) {
                    var d = itemOrbSources[orb].damage * (1-itemProcOrbSources.total);
                    result.push({
                        name: itemOrbSources[orb].displayname,
                        damage: d,
                        damageType: itemOrbSources[orb].damageType,
                        damageReduced: self.getReducedDamage(d, itemOrbSources[orb].damageType)
                    });
                    totalDamage += d;
                    damage[itemOrbSources[orb].damageType] += d;
                }            
            }
            
            // crit damage
            for (var i=0;i<critSources.sources.length;i++) {
                var d = totalCritableDamage * (critSources.sources[i].multiplier-1) * critSources.sources[i].totalchance;
                crits.push({
                    name: critSources.sources[i].name,
                    damage: d,
                    damageType: 'physical',
                    damageReduced: self.getReducedDamage(d, 'physical')
                });
                totalCrit += d;
            }

            return { sources: result,
                     sourcesCrit: crits,
                     total: totalDamage,
                     totalCrit: totalCrit,
                     totalCritReduced: self.getReducedDamage(totalCrit, 'physical'),
                     totalReduced: self.getReducedDamage(damage.pure, 'pure') 
                                 + self.getReducedDamage(damage.physical, 'physical')
                                 + self.getReducedDamage(damage.magic, 'magic')
                   };
        });
        
        self.getDamageTypeColor = function(damageType) {
            switch(damageType) {
                case 'physical':
                    return '#979aa2';
                break;
                case 'pure':
                    return 'goldenrod';
                break;
                case 'magic':
                    return '#428bca';
                break;
                default:
                    return '#979aa2';
                break;
            }
        }
        
        self.critDamage = ko.computed(function() {
            self.critInfo();
            return 0;
        });
        self.missChance = ko.computed(function() {
            return ((1-(self.enemy().ability().getMissChance() * self.debuffs.getMissChance())) * 100).toFixed(2);
        });
        self.totalattackrange = ko.computed(function() {
            return my.heroData['npc_dota_hero_' + self.selectedHero().heroName].attackrange + self.ability().getAttackRange();
        });
        self.visionrangeday = ko.computed(function() {
            return (my.heroData['npc_dota_hero_' + self.selectedHero().heroName].visiondaytimerange) * (1 + self.enemy().ability().getVisionRangePctReduction()
                                                                                                          + self.debuffs.getVisionRangePctReduction());
        });
        self.visionrangenight = ko.computed(function() {
            return (my.heroData['npc_dota_hero_' + self.selectedHero().heroName].visionnighttimerange + self.ability().getVisionRangeNight()) * (1 + self.enemy().ability().getVisionRangePctReduction()
                                                                                                                                                   + self.debuffs.getVisionRangePctReduction());
        });
        self.lifesteal = ko.computed(function() {
            var total = self.inventory.getLifesteal() + self.ability().getLifesteal() + self.buffs.getLifesteal();
            if (self.hero().attacktype() == 'DOTA_UNIT_CAP_MELEE_ATTACK') {
                total+= self.inventory.getLifestealAura();
            }
            return (total).toFixed(2);
        });
        
        self.damageBrackets = [
            [
                {name: 'medusa_mana_shield', source: self.damageReduction, value: -.5},
                {name: 'templar_assassin_refraction', source: self.damageReduction, value: -1},
                {name: 'faceless_void_backtrack', source: self.damageReduction, value: -1},
                {name: 'nyx_assassin_spiked_carapace', source: self.damageReduction, value: -1}
            ],
            [
                {
                    name: 'spectre_dispersion',
                    source: self.damageReduction,
                    value: -self.damageReduction.getAbilityDamageAmpValue('spectre_dispersion','damage_reflection_pct')
                },
                {
                    name: 'wisp_overcharge',
                    source: self.damageReduction,
                    value: self.damageReduction.getAbilityDamageAmpValue('wisp_overcharge','bonus_damage_pct')
                },
                {name: 'slardar_sprint', source: self.damageAmplification, value: .5},
                {name: 'bristleback_bristleback', source: self.damageReduction, value: -.5},
                {name: 'undying_flesh_golem', source: self.damageAmplification, value: .5}
            ],
            [
                {name: 'abaddon_borrowed_time', source: self.damageReduction, value: .5},
                {
                    name: 'abaddon_aphotic_shield',
                    source: self.damageReduction,
                    value: self.damageReduction.getAbilityDamageAmpValue('abaddon_aphotic_shield','damage_absorb'),
                    type: 'absorb'
                },
                {name: 'kunkka_ghostship', source: self.damageReduction, value: .5},
                {name: 'treant_living_armor', source: self.damageReduction, value: .5}
            ],
            [
                {name: 'chen_penitence', source: self.damageAmplification, value: .5},
                {name: 'medusa_stone_gaze', source: self.damageAmplification, value: .5},
                {name: 'shadow_demon_soul_catcher', source: self.damageAmplification, value: .5}
            ],
            [
                {name: 'dazzle_shallow_grave', source: self.damageReduction, value: .5}
            ]
        ];

        self.damageBrackets = [
            ['medusa_mana_shield','templar_assassin_refraction','faceless_void_backtrack','nyx_assassin_spiked_carapace'],
            ['spectre_dispersion','wisp_overcharge','slardar_sprint','bristleback_bristleback','undying_flesh_golem'],
            ['abaddon_borrowed_time','abaddon_aphotic_shield','kunkka_ghostship','treant_living_armor'],
            ['chen_penitence','medusa_stone_gaze','shadow_demon_soul_catcher'],
            ['dazzle_shallow_grave']
        ];
        
        self.getDamageAfterBracket = function(initialDamage,index) {
            var bracket = self.damageBrackets[index];
            var multiplier = 1;
            for (var i=0;i<bracket.length;i++) {
                if (_.findWhere(self.damageAmplification.buffs, {name: bracket[i].name}) != undefined || _.findWhere(self.damageReduction.buffs, {name: bracket[i].name}) != undefined) {
                    multiplier += bracket[i].value;
                }
            };
            return initialDamage * multiplier;
        };
        
        self.getDamageAmpReduc = function(initialDamage, skipBracket4) {
            var damage = initialDamage;
            var sources = self.damageAmplification.getDamageMultiplierSources();
            $.extend(sources, self.damageReduction.getDamageMultiplierSources());
            var result = [];
            if (!skipBracket4) {
                result.push({
                    label: 'Initial Damage',
                    damageType: 'physical',
                    value: damage
                });
            }
            // Bracket 1
            var multiplier = 1;
            var label = '';
            for (var i=0;i<self.damageBrackets[1].length;i++) {
                if (sources[self.damageBrackets[1][i]] != undefined) {
                    multiplier += sources[self.damageBrackets[1][i]].multiplier;
                    label += sources[self.damageBrackets[1][i]].displayname + ', ';
                }
                damage *= multiplier;
                if (label != '') {
                    result.push({
                        label: 'After ' + label.substring(0,label.length-2) + ' Reductions',
                        damageType: sources[self.damageBrackets[1][i]].damageType,
                        value: damage
                    });
                }
            }
            
            // Bracket 2
            var multiplier = 1;
            var label = '';
            for (var i=0;i<self.damageBrackets[1].length;i++) {
                if (sources[self.damageBrackets[1][i]] != undefined) {
                    multiplier += sources[self.damageBrackets[1][i]].multiplier;
                    label += sources[self.damageBrackets[1][i]].displayname + ', ';
                }
                damage *= multiplier;
                if (label != '') {
                    result.push({
                        label: 'After ' + label.substring(0,label.length-2) + ' Reductions',
                        damageType: sources[self.damageBrackets[1][i]].damageType,
                        value: damage
                    });
                }
            }
            
            // Bracket 3
            var multiplier = 0;
            var label = '';
            if (sources['abaddon_aphotic_shield'] != undefined) {
                multiplier += sources['abaddon_aphotic_shield'].multiplier;
                label += sources['abaddon_aphotic_shield'].displayname + ', ';
            }
            damage -= multiplier;
            if (label != '') {
                result.push({
                    label: 'After ' + label.substring(0,label.length-2) + ' Reductions',
                    damageType: sources['abaddon_aphotic_shield'].damageType,
                    value: damage
                });
            }
            
            // Bracket 4
            var damageBracket4 = 0;
            var damageBracket4total = 0;
            if (!skipBracket4) {
                damageBracket4 = damage;
                var multiplier = 0;
                var label = '';
                if (sources['shadow_demon_soul_catcher'] != undefined) {
                    multiplier += sources['shadow_demon_soul_catcher'].multiplier;
                }
                damageBracket4 *= multiplier;
                
                var resultBracket4 = self.getDamageAmpReduc(damageBracket4, true);
                if (sources['shadow_demon_soul_catcher'] != undefined) {
                    result.push({
                        label: sources['shadow_demon_soul_catcher'].displayname,
                        damageType: sources['shadow_demon_soul_catcher'].damageType,
                        value: damageBracket4
                    });
                }
                damageBracket4 = resultBracket4.value;
                damageBracket4total += resultBracket4.value;
                if (sources['shadow_demon_soul_catcher'] != undefined) {
                    for (var i=0;i<resultBracket4.sources.length;i++) {
                        result.push(resultBracket4.sources[i]);
                    }
                }
                
                damageBracket4 = damage;
                var multiplier = 0;
                var label = '';
                if (sources['chen_penitence'] != undefined) {
                    multiplier += sources['chen_penitence'].multiplier;
                }
                damageBracket4 *= multiplier;
                
                var resultBracket4 = self.getDamageAmpReduc(damageBracket4, true);
                if (sources['chen_penitence'] != undefined) {
                    result.push({
                        label: sources['chen_penitence'].displayname,
                        damageType: sources['chen_penitence'].damageType,
                        value: damageBracket4
                    });
                }
                damageBracket4 = resultBracket4.value;
                damageBracket4total += resultBracket4.value;
                if (sources['chen_penitence'] != undefined) {
                    for (var i=0;i<resultBracket4.sources.length;i++) {
                        result.push(resultBracket4.sources[i]);
                    }
                }            
            }
            
            if (!skipBracket4) {
                result.push({
                    label: 'Total Damage',
                    damageType: 'physical',
                    value: damage + damageBracket4total
                });
            }
            return { value: damage + damageBracket4total, sources: result };
        };
        
        self.damageInputModified = ko.computed(function() {
            return self.getDamageAmpReduc(self.damageInputValue(), false);
        });
        
        self.addIllusion = function(data, event) {
            console.log('add illusion');
            console.log(self.selectedIllusion());
            self.illusions.push(ko.observable(new my.IllusionViewModel(0, self, self.illusionAbilityLevel())));
        };
        
        self.diffProperties = [
            'totalAgi',
            'totalInt',
            'totalStr',
            'health',
            'healthregen',
            'mana',
            'manaregen',
            'totalArmorPhysical',
            'totalArmorPhysicalReduction',
            'totalMovementSpeed',
            'totalTurnRate',
            'baseDamage',
            'bonusDamage',
            'bonusDamageReduction',
            'damage',
            'damageAgainstEnemy',
            'totalMagicResistanceProduct',
            'totalMagicResistance',
            'bat',
            'ias',
            'attackTime',
            'attacksPerSecond',
            'evasion',
            'ehpPhysical',
            'ehpMagical',
            'bash',
            'critChance',
            'critDamage',
            'missChance',
            'totalattackrange',
            'visionrangeday',
            'visionrangenight',
            'lifesteal'
        ];
        self.diff = {}
        self.getDiffFunction = function(prop) {
            return ko.computed(function() {
                return self[prop]() - self.heroCompare()[prop]();
            }, this, { deferEvaluation: true });
        }
        for (var i = 0; i < self.diffProperties.length; i++) {
            var index = i;
            self.diff[self.diffProperties[index]] = self.getDiffFunction(self.diffProperties[index]);
        }

    };

    return my;
}(HEROCALCULATOR));