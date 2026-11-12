"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.forgetCityStatuses = exports.updateCityStatus = exports.registerCityStatusHandler = exports.cityStatus = void 0;
const Engine_1 = require("@civ-clone/core-engine/Engine");
const core_pending_effect_1 = require("@civ-clone/core-pending-effect");
/**
 * A city's status (in disorder, celebrating and the like) is kept as a `PendingEffect` on the city, named by the
 * ruleset's `handler`. Pending effects are saved, so a loaded game knows which cities already had a status, and a
 * status recorded at the start of one turn is still there at the start of the next: that's how a ruleset tells a
 * city's second turn of disorder, or of celebrating, from its first.
 */
const cityStatus = (handler, city, pendingEffects = core_pending_effect_1.instance) => {
    var _a;
    return (_a = pendingEffects
        .getByTarget(city)
        .find((pendingEffect) => pendingEffect.handler() === handler)) !== null && _a !== void 0 ? _a : null;
};
exports.cityStatus = cityStatus;
/**
 * Emits `event` with the city when its status `handler` ends. Register it whenever the rules are created, so a status
 * loaded from a save can still end.
 */
const registerCityStatusHandler = (handler, event, pendingEffects = core_pending_effect_1.instance, engine = Engine_1.instance) => pendingEffects.handler(handler, (pendingEffect) => engine.emit(event, pendingEffect.target()));
exports.registerCityStatusHandler = registerCityStatusHandler;
/**
 * Records the city's status `handler` when it has started (`active` with nothing `recorded`), calling `onStart` first,
 * and ends it when it has stopped (not `active` with one `recorded`), which emits the event its handler was registered
 * with. `recorded` is the city's status as it was before this turn's check (`cityStatus`), so a ruleset can act on a
 * status carried over from the last turn before it's updated.
 */
const updateCityStatus = (handler, city, active, recorded, pendingEffects = core_pending_effect_1.instance, onStart = () => { }) => {
    if (active && recorded === null) {
        onStart();
        pendingEffects.register(new core_pending_effect_1.PendingEffect(handler, city));
    }
    if (!active && recorded !== null) {
        pendingEffects.discharge(recorded);
    }
};
exports.updateCityStatus = updateCityStatus;
/**
 * Drops the city's statuses named in `handlers` without ending them, so no event is emitted: for a city that's gone,
 * which would otherwise stay in the save.
 */
const forgetCityStatuses = (city, handlers, pendingEffects = core_pending_effect_1.instance) => pendingEffects
    .getByTarget(city)
    .filter((pendingEffect) => handlers.includes(pendingEffect.handler()))
    .forEach((pendingEffect) => pendingEffects.unregister(pendingEffect));
exports.forgetCityStatuses = forgetCityStatuses;
//# sourceMappingURL=cityStatus.js.map