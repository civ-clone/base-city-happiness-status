import {
  Engine,
  instance as engineInstance,
} from '@civ-clone/core-engine/Engine';
import {
  PendingEffect,
  PendingEffectRegistry,
  instance as pendingEffectRegistryInstance,
} from '@civ-clone/core-pending-effect';
import City from '@civ-clone/core-city/City';

/**
 * A city's status (in disorder, celebrating and the like) is kept as a `PendingEffect` on the city, named by the
 * ruleset's `handler`. Pending effects are saved, so a loaded game knows which cities already had a status, and a
 * status recorded at the start of one turn is still there at the start of the next: that's how a ruleset tells a
 * city's second turn of disorder, or of celebrating, from its first.
 */
export const cityStatus = (
  handler: string,
  city: City,
  pendingEffects: PendingEffectRegistry = pendingEffectRegistryInstance
): PendingEffect | null =>
  pendingEffects
    .getByTarget(city)
    .find(
      (pendingEffect: PendingEffect): boolean =>
        pendingEffect.handler() === handler
    ) ?? null;

/**
 * Emits `event` with the city when its status `handler` ends. Register it whenever the rules are created, so a status
 * loaded from a save can still end.
 */
export const registerCityStatusHandler = (
  handler: string,
  event: string,
  pendingEffects: PendingEffectRegistry = pendingEffectRegistryInstance,
  engine: Engine = engineInstance
): void =>
  pendingEffects.handler(handler, (pendingEffect: PendingEffect) =>
    engine.emit(event, pendingEffect.target())
  );

/**
 * Records the city's status `handler` when it has started (`active` with nothing `recorded`), calling `onStart` first,
 * and ends it when it has stopped (not `active` with one `recorded`), which emits the event its handler was registered
 * with. `recorded` is the city's status as it was before this turn's check (`cityStatus`), so a ruleset can act on a
 * status carried over from the last turn before it's updated.
 */
export const updateCityStatus = (
  handler: string,
  city: City,
  active: boolean,
  recorded: PendingEffect | null,
  pendingEffects: PendingEffectRegistry = pendingEffectRegistryInstance,
  onStart: () => void = () => {}
): void => {
  if (active && recorded === null) {
    onStart();

    pendingEffects.register(new PendingEffect(handler, city));
  }

  if (!active && recorded !== null) {
    pendingEffects.discharge(recorded);
  }
};

/**
 * Drops the city's statuses named in `handlers` without ending them, so no event is emitted: for a city that's gone,
 * which would otherwise stay in the save.
 */
export const forgetCityStatuses = (
  city: City,
  handlers: string[],
  pendingEffects: PendingEffectRegistry = pendingEffectRegistryInstance
): void =>
  pendingEffects
    .getByTarget(city)
    .filter((pendingEffect: PendingEffect): boolean =>
      handlers.includes(pendingEffect.handler())
    )
    .forEach((pendingEffect: PendingEffect): void =>
      pendingEffects.unregister(pendingEffect)
    );
