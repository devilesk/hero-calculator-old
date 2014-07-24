var HEROCALCULATOR = (function (my) {

    my.CloneOption = function (name, displayname, levels, image, level) {
        this.heroName = ko.computed(function() {
            return (levels > 0) ? name + (level() <= levels ? level() : 1) : name;
        });
        this.heroDisplayName = displayname;
        this.image = image;
        this.levels = levels;
    };
    
    my.CloneViewModel = function (h,p) {
        var self = new my.HeroCalculatorModel(0);
        self.parent = p;
        self.selectedHero(_.findWhere(self.availableHeroes(), {heroName: 'meepo'}));
        self.hero = ko.computed(function() {
            return ko.mapping.fromJS(my.heroData['npc_dota_hero_meepo']);
        });
        return self;
    }

    return my;
}(HEROCALCULATOR));