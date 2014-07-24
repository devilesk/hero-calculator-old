var HEROCALCULATOR = (function (my) {

    var itemtooltipdata = {}

    function getTooltipItemDescription(item) {
        var d = item.description;
        for (var i=0;i<item.attributes.length;i++) {
            if (item.attributes[i].name != null) {
                var attributeName = item.attributes[i].name;
                var attributeValue = item.attributes[i].value[0];
                for (var j=1;j<item.attributes[i].value.length;j++) {
                    attributeValue += ' / ' + item.attributes[i].value[j];
                }
                var regexp = new RegExp('%' + attributeName + '%', "gi");
                d = d.replace(regexp, attributeValue );
            }
        }
        var regexp = new RegExp('%%', "gi");
        d = d.replace(regexp,'%');
        regexp = new RegExp('\n', "gi");
        d = d.replace(/\\n/g, "<br>");
        return d;
    }

    var ability_vars = {
        '$health':'Health',
        '$mana':'Mana',
        '$armor':'Armor',
        '$damage':'Damage',
        '$str':'Strength',
        '$int':'Intelligence',
        '$agi':'Agility',
        '$all':'All Attributes',
        '$attack':'Attack Speed',
        '$hp_regen':'HP Regeneration',
        '$mana_regen':'Mana Regeneration',
        '$move_speed':'Movement Speed',
        '$evasion':'Evasion',
        '$spell_resist':'Spell Resistance',
        '$selected_attribute':'Selected Attribute'
    }

    function getTooltipItemAttributes(item) {
        var a = '';
        for (var i=0;i<item.attributes.length;i++) {
            if (item.attributes[i].tooltip != null) {
                var attributeTooltip = item.attributes[i].tooltip;
                var attributeValue = item.attributes[i].value[0];
                for (var j=1;j<item.attributes[i].value.length;j++) {
                    attributeValue += ' / ' + item.attributes[i].value[j];
                }
                var p = attributeTooltip.indexOf("%");
                if (p == 0) {
                    attributeValue = attributeValue + '%';
                    attributeTooltip = attributeTooltip.slice(1);
                }
                var d = attributeTooltip.indexOf("$");
                if (d != -1) {
                    a = a + attributeTooltip.slice(0, d) + ' ' + attributeValue + ' ' + ability_vars[attributeTooltip.slice(d)] + '<br>';
                }
                else {
                    a = a + attributeTooltip + ' ' + attributeValue + '<br>';
                }
            }
        }
        return a.trim('<br>');
    }

    function getTooltipItemCooldown(item) {
        var c = '';
        for (var i=0;i<item.cooldown.length; i++) {
            c = c + ' ' + item.cooldown[i];
        }
        return c;
    }

    function getTooltipItemManaCost(item) {
        var c = '';
        for (var i=0;i<item.manacost.length; i++) {
            if (item.manacost[i] > 0) {
                c = c + ' ' + item.manacost[i];
            }
        }
        return c;
    }
    
    my.getItemTooltipData = function(el) {
        if (my.itemData['item_' + el] == undefined) {
            return undefined;
        }
        if (itemtooltipdata[el] == undefined) {
            var item = my.itemData['item_' + el];
            var data = $('<div>');
            data.append($('<span>').html(item.displayname).attr('id','item_name').addClass('item_field'));
            data.append($('<span>').html(item.itemcost).attr('id','item_cost').addClass('item_field'));
            data.append($('<hr>'));
            if (item.description != null) {
                data.append($('<div>').html(getTooltipItemDescription(item)).attr('id','item_description').addClass('item_field'));
            }
            var attributedata = getTooltipItemAttributes(item);
            if (attributedata != '') {
                data.append($('<div>').html(attributedata).attr('id','item_attributes').addClass('item_field'));
            }
            var cd = getTooltipItemCooldown(item);
            var mana = getTooltipItemManaCost(item);
            if (cd != '' || mana != '') {
                var cdmanacost = $('<div>').attr('id','item_cdmana');
                if (cd != '') {
                    cdmanacost.append($('<span>').html(cd).attr('id','item_cooldown').addClass('item_field'));
                }
                if (mana != '') {
                    cdmanacost.append($('<span>').html(mana).attr('id','item_manacost').addClass('item_field'));
                }
                data.append(cdmanacost);
            }
            if (item.lore != null) {
                data.append($('<div>').html(item.lore).attr('id','item_lore').addClass('item_field'));
            }
            itemtooltipdata[el] = data.html();
            return data.html();
        }
        else {
            return itemtooltipdata[el];
        }
    }

    var abilityTooltipData = {}

    function getTooltipAbilityDescription(item) {
        var d = item.description;
        for (var i=0;i<item.attributes.length;i++) {
            if (item.attributes[i].name != null) {
                var attributeName = item.attributes[i].name;
                var attributeValue = item.attributes[i].value[0];
                for (var j=1;j<item.attributes[i].value.length;j++) {
                    attributeValue += ' / ' + item.attributes[i].value[j];
                }
                regexp = new RegExp('%' + attributeName + '%', "gi");
                d = d.replace(regexp, attributeValue);
            }
        }
        var regexp = new RegExp('%%', "gi");
        d = d.replace(regexp, '%');
        regexp = new RegExp('\n', "gi");
        d = d.replace(/\\n/g, "<br>");
        return d;
    }

    function getTooltipAbilityAttributes(item) {
        var a = '';
        if (item.damage.length > 0 && _.reduce(item.damage, function(memo, num){ return memo + num; }, 0) > 0) {
            var attributeTooltip = 'DAMAGE: ';
            var attributeValue = item.damage[0];
            for (var j=1;j<item.damage.length;j++) {
                attributeValue += ' / ' + item.damage[j];
            }
            a = a + attributeTooltip + ' ' + attributeValue + '<br>';
        }
        for (var i=0;i<item.attributes.length;i++) {
            if (item.attributes[i].tooltip != null) {
                var attributeTooltip = item.attributes[i].tooltip;
                var attributeValue = item.attributes[i].value[0];
                for (var j=1;j<item.attributes[i].value.length;j++) {
                    attributeValue += ' / ' + item.attributes[i].value[j];
                }
                var p = attributeTooltip.indexOf("%");
                if (p == 0) {
                    if (attributeValue.toString().indexOf("/") == -1) {
                        attributeValue = attributeValue + '%';
                    } else {
                        var regexp2 = new RegExp("/", "gi");
                        attributeValue = attributeValue.replace(regexp2, "%/") + '%';
                    }
                    attributeTooltip = attributeTooltip.slice(1);
                }
                var d = attributeTooltip.indexOf("$");
                a = a + attributeTooltip + ' ' + attributeValue + '<br>';
            }
        }
        return a.trim('<br>');
    }

    function getTooltipAbilityManaCost(item) {
        var c = '';
        if (_.reduce(item.manacost, function(memo, num){ return memo + num; }, 0) == 0) {
            return c;
        }
        if (_.every(item.manacost, function(num) { return num == item.manacost[0]; })) {
            return item.manacost[0].toString();
        }
        for (var i = 0; i < 4; i++) {
            if (item.manacost[i] != null) {
                c = c + " " + item.manacost[i];
            }
        }
        return c;
    }

    function getTooltipAbilityCooldown(item) {
        var c = '';
        if (_.reduce(item.cooldown, function(memo, num){ return memo + num; }, 0) == 0) {
            return c;
        }
        if (_.every(item.cooldown, function(num) { return num == item.cooldown[0]; })) {
            return item.cooldown[0].toString();
        }
        for (var i = 0; i < 4; i++) {
            if (item.cooldown[i] != null) {
                c = c + " " + item.cooldown[i];
            }
        }
        return c;
    }
        
    my.getAbilityTooltipData = function(hero, el) {
        if (abilityTooltipData[el] == undefined) {
            var abilityName = el
            var ability = {};
            if (my.heroData[hero] == undefined) {
                for (var i=0;i<my.unitData[hero].abilities.length;i++) {
                    if (my.unitData[hero].abilities[i].name == el) {
                        ability = my.unitData[hero].abilities[i];
                    }
                }            
            }
            else {
                for (var i=0;i<my.heroData[hero].abilities.length;i++) {
                    if (my.heroData[hero].abilities[i].name == el) {
                        ability = my.heroData[hero].abilities[i];
                    }
                }
            }
            var data = $('<div>')
            data.append($('<span>').html(ability.displayname).attr('id','item_name').addClass('item_field'));
            data.append($('<hr>'));
            if (ability.description != null) {
                data.append($('<div>').html(getTooltipAbilityDescription(ability)).attr('id','item_description').addClass('item_field'));
            }
            var attributedata = getTooltipAbilityAttributes(ability);
            if (attributedata != '') {
                data.append($('<div>').html(attributedata).attr('id','item_attributes').addClass('item_field'));
            }
            var cd = getTooltipAbilityCooldown(ability);
            var mana = getTooltipAbilityManaCost(ability);
            if (cd != '' || mana != '') {
                var cdmanacost = $('<div>').attr('id','item_cdmana');
                if (mana != '') {
                    cdmanacost.append($('<span>').html(mana.trim()).attr('id','item_manacost').addClass('item_field'));
                }
                if (cd != '') {
                    cdmanacost.append($('<span>').html(cd.trim()).attr('id','item_cooldown').addClass('item_field'));
                }
                data.append(cdmanacost);
            }
            if (ability.lore != null) {
                data.append($('<div>').html(ability.lore).attr('id','item_lore').addClass('item_field'));
            }
            abilityTooltipData[el] = data.html();
            return data.html();
        }
        else {
            return abilityTooltipData[el];
        }
    }
    
    return my;
}(HEROCALCULATOR));