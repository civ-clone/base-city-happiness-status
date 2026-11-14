"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cityStatusTurn = void 0;
const cityStatus_1 = require("./cityStatus");
const CelebrateLeader_1 = require("@civ-clone/core-city-happiness/Rules/CelebrateLeader");
const CivilDisorder_1 = require("@civ-clone/core-city-happiness/Rules/CivilDisorder");
/**
 * Checks each of `cities` for civil disorder and for celebrating, at the start of their player's turn, emitting
 * `city:civil-disorder` for each city in disorder, and records the statuses that start and ends those that stop
 * (`updateCityStatus`), emitting `city:leader-celebration` as a celebration starts. The handlers' events (registered
 * with `registerCityStatusHandler`) tell of order restored and celebrations ended. The cities are taken in order, and a
 * hook may change the player's government part-way through them.
 */
const cityStatusTurn = (cities, { disorderHandler, celebrationHandler, pendingEffects, ruleRegistry, engine, celebrationSurvivesDisorder = false, onDisorderContinues = () => { }, onCelebrationChecked = () => { }, forgetCelebration = () => false, }) => cities.forEach((city) => {
    // Both rules read the same yields, and working them out isn't cheap (civ-clone/web-renderer#315).
    const yields = city.yields(), check = {
        city,
        yields,
        disorder: ruleRegistry
            .process(CivilDisorder_1.default, city, yields)
            .some((result) => result),
        celebrating: ruleRegistry
            .process(CelebrateLeader_1.default, city, yields)
            .some((result) => result),
        recordedDisorder: (0, cityStatus_1.cityStatus)(disorderHandler, city, pendingEffects),
        recordedCelebration: (0, cityStatus_1.cityStatus)(celebrationHandler, city, pendingEffects),
    };
    if (check.disorder) {
        engine.emit('city:civil-disorder', city);
    }
    if (check.disorder && check.recordedDisorder !== null) {
        onDisorderContinues(check);
    }
    onCelebrationChecked(check, check.celebrating && check.recordedCelebration !== null);
    // Records disorder that has started, and ends disorder that has stopped.
    (0, cityStatus_1.updateCityStatus)(disorderHandler, city, check.disorder, check.recordedDisorder, pendingEffects);
    if (celebrationSurvivesDisorder && check.disorder && !check.celebrating) {
        return;
    }
    if (!check.celebrating &&
        check.recordedCelebration !== null &&
        forgetCelebration(check)) {
        (0, cityStatus_1.forgetCityStatuses)(city, [celebrationHandler], pendingEffects);
        return;
    }
    (0, cityStatus_1.updateCityStatus)(celebrationHandler, city, check.celebrating, check.recordedCelebration, pendingEffects, () => engine.emit('city:leader-celebration', city));
});
exports.cityStatusTurn = cityStatusTurn;
exports.default = exports.cityStatusTurn;
//# sourceMappingURL=statusTurn.js.map