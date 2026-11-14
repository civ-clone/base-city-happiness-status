import {
  PendingEffect,
  PendingEffectRegistry,
} from '@civ-clone/core-pending-effect';
import City from '@civ-clone/core-city/City';
import { Engine } from '@civ-clone/core-engine/Engine';
import { RuleRegistry } from '@civ-clone/core-rule/RuleRegistry';
import Yield from '@civ-clone/core-yield/Yield';
/** What a city's check found this turn, and what was recorded before it. */
export type CityStatusCheck = {
  city: City;
  /** The yields the city was judged on, worked out once for both checks. */
  yields: Yield[];
  /** Whether the city is in civil disorder now. */
  disorder: boolean;
  /** Whether the city celebrates now. */
  celebrating: boolean;
  /** The city's disorder as recorded before this turn's check, or `null`. */
  recordedDisorder: PendingEffect | null;
  /** The city's celebration as recorded before this turn's check, or `null`. */
  recordedCelebration: PendingEffect | null;
};
/** How a ruleset keeps its cities' disorder and celebrations from one turn to the next. */
export type CityStatusTurn = {
  /** The status `handler`s the ruleset records disorder and celebration under (see `cityStatus`). */
  disorderHandler: string;
  celebrationHandler: string;
  pendingEffects: PendingEffectRegistry;
  ruleRegistry: RuleRegistry;
  engine: Engine;
  /**
   * Whether a city that celebrated before, and is in disorder now without celebrating, keeps its celebration (Civ1
   *  keeps it, without a word, until order returns); otherwise its celebration is ended or forgotten as usual.
   */
  celebrationSurvivesDisorder?: boolean;
  /** Called for a city in disorder for a second turn running (or more), before its status is updated. */
  onDisorderContinues?: (check: CityStatusCheck) => void;
  /**
   * Called for each city whose celebration is updated, before it is, with whether it celebrates for a second turn
   *  running (or more): what a ruleset grows a city for.
   */
  onCelebrationChecked?: (check: CityStatusCheck, again: boolean) => void;
  /**
   * Whether a celebration that has stopped is dropped without its end being told (no event), rather than ended.
   *  Ended, by default.
   */
  forgetCelebration?: (check: CityStatusCheck) => boolean;
};
/**
 * Checks each of `cities` for civil disorder and for celebrating, at the start of their player's turn, emitting
 * `city:civil-disorder` for each city in disorder, and records the statuses that start and ends those that stop
 * (`updateCityStatus`), emitting `city:leader-celebration` as a celebration starts. The handlers' events (registered
 * with `registerCityStatusHandler`) tell of order restored and celebrations ended. The cities are taken in order, and a
 * hook may change the player's government part-way through them.
 */
export declare const cityStatusTurn: (
  cities: City[],
  {
    disorderHandler,
    celebrationHandler,
    pendingEffects,
    ruleRegistry,
    engine,
    celebrationSurvivesDisorder,
    onDisorderContinues,
    onCelebrationChecked,
    forgetCelebration,
  }: CityStatusTurn
) => void;
export default cityStatusTurn;
