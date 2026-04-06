export class QuestSystem {
    constructor(quests, gameState) {
        this.allQuests = quests;
        this.state = gameState;
    }

    getActiveQuests() {
        return this.allQuests.filter(q => this.state.questStates[q.id] === 'active');
    }

    getCompletedQuests() {
        return this.allQuests.filter(q => this.state.questStates[q.id] === 'completed');
    }

    isQuestActive(questId) {
        return this.state.questStates[questId] === 'active';
    }

    isQuestComplete(questId) {
        return this.state.questStates[questId] === 'completed';
    }

    startQuest(questId) {
        const quest = this.allQuests.find(q => q.id === questId);
        if (!quest) return false;

        // Check prerequisite
        if (quest.prerequisite && this.state.questStates[quest.prerequisite] !== 'completed') {
            return false;
        }

        if (!this.state.questStates[questId]) {
            this.state.questStates[questId] = 'active';
            // Reset objectives
            for (const obj of quest.objectives) {
                obj.completed = false;
                if (obj.count) obj.current = 0;
            }
            return true;
        }
        return false;
    }

    updateObjective(type, target, count = 1) {
        const active = this.getActiveQuests();
        const completed = [];

        for (const quest of active) {
            let questUpdated = false;
            for (const obj of quest.objectives) {
                if (obj.completed) continue;
                if (obj.type !== type) continue;

                if (obj.target === 'any' || obj.target === target) {
                    if (obj.count) {
                        obj.current = (obj.current || 0) + count;
                        if (obj.current >= obj.count) {
                            obj.completed = true;
                            questUpdated = true;
                        }
                    } else {
                        obj.completed = true;
                        questUpdated = true;
                    }
                }
            }

            // Check if all objectives complete
            if (questUpdated && quest.objectives.every(o => o.completed)) {
                completed.push(quest);
            }
        }

        return completed;
    }

    completeQuest(questId) {
        const quest = this.allQuests.find(q => q.id === questId);
        if (!quest) return null;

        this.state.questStates[questId] = 'completed';

        // Auto-start next quest
        if (quest.nextQuest) {
            this.startQuest(quest.nextQuest);
        }

        return quest.rewards;
    }

    getCurrentMainQuest() {
        return this.allQuests.find(q => q.type === 'main' && this.state.questStates[q.id] === 'active');
    }
}
