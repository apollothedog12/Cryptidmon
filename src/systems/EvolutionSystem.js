export class EvolutionSystem {
    constructor(evolutions, cryptidTemplates) {
        this.evolutions = evolutions;
        this.templates = cryptidTemplates;
    }

    checkEvolution(cryptid) {
        const evo = this.evolutions[cryptid.templateId];
        if (!evo) return null;

        if (evo.method === 'level' && cryptid.level >= evo.level) {
            return evo;
        }

        return null;
    }

    checkItemEvolution(cryptid, itemId) {
        const evo = this.evolutions[cryptid.templateId];
        if (!evo) return null;

        if (evo.method === 'item' && evo.item === itemId) {
            return evo;
        }

        return null;
    }

    evolve(cryptid, evo) {
        const newTemplate = this.templates.find(t => t.id === evo.into);
        if (!newTemplate) return false;

        const oldName = cryptid.name;
        const hpRatio = cryptid.hp / cryptid.maxHp;

        // Update to new form
        cryptid.templateId = newTemplate.id;
        cryptid.name = newTemplate.name;
        cryptid.types = [...newTemplate.types];
        cryptid.baseStats = { ...newTemplate.baseStats };
        cryptid.spriteColor = newTemplate.spriteColor || cryptid.spriteColor;
        cryptid.description = newTemplate.description;

        // Recalculate stats (keep IV values)
        cryptid.stats = cryptid.calcStats();
        cryptid.maxHp = cryptid.stats.hp;
        cryptid.hp = Math.floor(cryptid.maxHp * hpRatio);

        return { oldName, newName: newTemplate.name, template: newTemplate };
    }
}
